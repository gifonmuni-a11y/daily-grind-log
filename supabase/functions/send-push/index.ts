import { serve } from "./server_lokal.ts";

const VAPID_PUBLIC_KEY = (Deno.env.get("VAPID_PUBLIC_KEY") || "").trim().replace(/^"|"$/g, "");
const VAPID_PRIVATE_KEY = (Deno.env.get("VAPID_PRIVATE_KEY") || "").trim().replace(/^"|"$/g, "");

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.log("❌ EROR KRUSIAL: VAPID keys belum terdaftar di Secrets!");
}

function b64ToUint8(b64: string): Uint8Array {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function uint8ToB64Url(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function createVapidHeader(endpoint: string) {
  const url = new URL(endpoint);
  const jwtHeader = { alg: "ES256", typ: "JWT" };
  const jwtPayload = {
    aud: url.origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:admin@example.com"
  };
  
  const headerB64 = uint8ToB64Url(new TextEncoder().encode(JSON.stringify(jwtHeader)));
  const payloadB64 = uint8ToB64Url(new TextEncoder().encode(JSON.stringify(jwtPayload)));
  const tokenContent = `${headerB64}.${payloadB64}`;
  
  const pubKeyUint8 = b64ToUint8(VAPID_PUBLIC_KEY);
  const jwk = {
    kty: "EC", crv: "P-256",
    x: uint8ToB64Url(pubKeyUint8.subarray(1, 33)),
    y: uint8ToB64Url(pubKeyUint8.subarray(33, 65)),
    d: VAPID_PRIVATE_KEY
  };
  
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(tokenContent));
  
  return `VAPID t=${tokenContent}.${uint8ToB64Url(new Uint8Array(signature))}, k=${VAPID_PUBLIC_KEY}`;
}

async function encryptPayload(payloadData: any, userPkB64: string, userAuthB64: string) {
  const userPkBytes = b64ToUint8(userPkB64);
  const userAuthBytes = b64ToUint8(userAuthB64);
  
  const userPublicKey = await crypto.subtle.importKey("raw", userPkBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: userPublicKey }, localKeyPair.privateKey, 256));
  
  const ikmKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveBits"]);
  const infoBuf = new Uint8Array(14 + 65 + 65);
  infoBuf.set(new TextEncoder().encode("WebPush: info\0"), 0);
  infoBuf.set(userPkBytes, 14);
  infoBuf.set(localPublicKeyRaw, 14 + 65);
  
  const ikm = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: userAuthBytes, info: infoBuf }, ikmKey, 256));
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikmKey2 = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  
  const cek = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt, info: new TextEncoder().encode("Content-Encoding: aes128gcm\0") }, ikmKey2, 128));
  
  // 🔥 FIX TYPO: "SHA-256-" berkurang tanda minusnya jadi "SHA-256" yang valid
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt, info: new TextEncoder().encode("Content-Encoding: nonce\0") }, ikmKey2, 96));
  
  const payloadText = new TextEncoder().encode(JSON.stringify(payloadData));
  const plaintext = new Uint8Array(payloadText.length + 1);
  plaintext.set(payloadText, 0);
  plaintext.set([0x02], payloadText.length);
  
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, plaintext));
  
  const body = new Uint8Array(16 + 4 + 1 + 65 + ciphertext.length);
  body.set(salt, 0);
  body.set([0x00, 0x00, 0x10, 0x00], 16);
  body.set([0x41], 20);
  body.set(localPublicKeyRaw, 21);
  body.set(ciphertext, 21 + 65);
  
  return body;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const payload = await req.json();
    console.log("=== DATA WEBHOOK MASUK ===");
    const record = payload.record;

    if (record && record.push_subscription && record.warning_msg) {
      console.log("Memulai proses bongkar JSON token...");
      const subscription = JSON.parse(record.push_subscription);
      
      if (subscription.endpoint && subscription.keys) {
        console.log("Menyusun paket data gambar dan enkripsi...");
        const notificationPayload = {
          title: record.warning_type || "Notifikasi Game",
          body: record.warning_msg,
          icon: record.avatar_url || "",
          image: record.warning_img_url || "" 
        };

        const encryptedBody = await encryptPayload(notificationPayload, subscription.keys.p256dh, subscription.keys.auth);
        const vapidHeader = await createVapidHeader(subscription.endpoint);

        console.log("🚀 Menembak Push Notification ke HP target...");
        const response = await fetch(subscription.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "2419200",
            "Authorization": vapidHeader
          },
          body: encryptedBody
        });

        console.log("📊 Status Balasan Server Browser:", response.status);
        const resText = await response.text();
        console.log("💬 Detail Balasan Server:", resText);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ EROR SISTEM UTAMA:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});
