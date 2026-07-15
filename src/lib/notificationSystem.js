/**
 * Meminta izin akses notifikasi kepada sistem operasi perangkat
 * @returns {Promise<boolean>} Status apakah izin diberikan
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn("Sistem ini tidak mendukung Web Notification API.");
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Mengirimkan notifikasi taktis native ke system drawer perangkat
 * @param {string} title Judul notifikasi utama (Bisa dicustom dari Admin Panel)
 * @param {Object} options Konfigurasi payload notifikasi
 */
export async function sendSystemNotification(title, options = {}) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    const status = await Notification.requestPermission();
    if (status !== 'granted') {
      console.warn("Izin notifikasi belum disetujui oleh mesin situs browser.");
      return;
    }
  }

  // 🎯 PRIORITAS, WARNA TEMA & ASET SILUET STATUS BAR
  const defaultOptions = {
    body: options.body || "",
    tag: options.tag || "grind-log-notification",
    icon: '/notification-icon.png',       // 🔔 Icon utama full color (muncul di dalam kotak pesan)
    badge: '/notification-badge.png',      // 🔍 Icon bar status kecil (menggunakan file siluet transparan agar tidak hitam ngeblok)
    color: '#7C5CFF',                      // 🎯 WARNA UNGU TEMA LU: Mengubah total lingkaran aksen hijau Android jadi UNGU!
    renotify: true,                      // Timpa notifikasi lama jika tag sama
    requireInteraction: true,            // Notifikasi menetap di laci atas sampai di-swipe user
    vibrate: [200, 100, 200],            // Pola getar sistem taktis
    ...options
  };

  // 🚀 Eksekusi via Service Worker Terdaftar
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, defaultOptions);
        return;
      }
    } catch (err) {
      console.error("Gagal menembakkan lewat Service Worker, mencoba fallback...", err);
    }
  }

  // Fallback cadangan jika service worker sedang delay
  try {
    new Notification(title, defaultOptions);
  } catch (e) {
    console.error("Semua jalur notifikasi native diblokir browser:", e);
  }
}