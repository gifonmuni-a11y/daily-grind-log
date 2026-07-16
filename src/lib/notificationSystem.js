import { supabase } from './supabaseClient.js';

// KUNCI PUBLIC VAPID LU UNTUK DAFTAR PUSH DEVICE
const VAPID_PUBLIC_KEY = "BAo4G1F5-EC8xFcYi7KVA0gx1Zq3bv3zrcHIFvY-xc2cvRJtzfCmOxp6q400rCm62lr4Txq04ccixvWRIaT1pFo";

// Fungsi pembantu mengubah kunci VAPID ke format mesin browser
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Meminta izin akses notifikasi DAN otomatis mendaftarkan Token HP ke Supabase
 * @returns {Promise<boolean>} Status apakah izin diberikan
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("Sistem ini tidak mendukung Web Push Notification.");
    return false;
  }

  // Minta izin ke browser HP
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn("Izin notifikasi ditolak oleh player.");
    return false;
  }

  // 🔥 PROSES UTAMA: GENERATE TOKEN & SAVE KE SUPABASE AUTOMATICALLY
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Bikin Token Push khusus perangkat ini
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log("Token Push Perangkat Sukses Dibuat:", JSON.stringify(subscription));

    // Ambil data user yang sedang login saat ini
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Tembak langsung masuk ke kolom push_subscription di tabel profiles!
      const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: JSON.stringify(subscription) })
        .eq('id', user.id); // Mencocokkan dengan ID user yang sedang login

      if (error) {
        console.error("Gagal menyimpan token ke database Supabase:", error.message);
      } else {
        console.log("🔥 BERHASIL! Token HP resmi tersimpan di database. push_subscription tidak NULL lagi!");
      }
    } else {
      console.warn("Token gagal dikirim ke database karena sesi login user tidak terdeteksi.");
    }
  } catch (err) {
    console.error("Gagal memproses pendaftaran Web Push Token PWA:", err);
  }

  return true;
}

/**
 * Mengirimkan notifikasi taktis native ke system drawer perangkat (Tetap Dipertahankan)
 */
export async function sendSystemNotification(title, options = {}) {
  if (!('Notification' in window)) return;

  if (Notification.permission !== 'granted') {
    const status = await Notification.requestPermission();
    if (status !== 'granted') return;
  }

  const defaultOptions = {
    body: options.body || "",
    tag: options.tag || "grind-log-notification",
    icon: '/notification-icon.png',       
    badge: '/notification-badge.png',      
    color: '#7C5CFF',                      
    renotify: true,                      
    requireInteraction: true,            
    vibrate: [200, 100, 200],            
    ...options
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, defaultOptions);
        return;
      }
    } catch (err) {
      console.error("Gagal via Service Worker, fallback...", err);
    }
  }

  try {
    new Notification(title, defaultOptions);
  } catch (e) {
    console.error("Semua jalur notifikasi native diblokir browser:", e);
  }
}
