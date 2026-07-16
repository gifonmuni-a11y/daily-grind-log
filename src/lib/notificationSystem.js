import { supabase } from './supabaseClient.js';

// KUNCI PUBLIC VAPID LU
const VAPID_PUBLIC_KEY = "BAo4G1F5-EC8xFcYi7KVA0gx1Zq3bv3zrcHIFvY-xc2cvRJtzfCmOxp6q400rCm62lr4Txq04ccixvWRIaT1pFo";

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
 * Meminta izin akses notifikasi DAN otomatis mereset serta mendaftarkan Token HP ke Supabase
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("Sistem ini tidak mendukung Web Push Notification.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn("Izin notifikasi ditolak oleh player.");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // 🔥 FIX UTAMA: Paksa hapus token lama yang nyangkut di browser biar gak 403 Mismatch lagi!
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
      console.log("Token lama yang mismatch berhasil dibuang.");
    }
    
    // Bikin Token Push baru yang segar dan terikat 100% ke VAPID key baru kita
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };
    
    const subscription = await registration.pushManager.subscribe(subscribeOptions);
    console.log("Token Push Perangkat Baru Sukses Dibuat.");

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: JSON.stringify(subscription) })
        .eq('id', userId);

      if (error) {
        console.error("Gagal menyimpan token ke database Supabase:", error.message);
      } else {
        console.log("🔥 BERHASIL! Token baru resmi masuk database.");
      }
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
