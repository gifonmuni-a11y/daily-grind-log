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
 * @param {string} title Judul notifikasi utama
 * @param {Object} options Konfigurasi payload notifikasi
 */
export async function sendSystemNotification(title, options = {}) {
  if (!('Notification' in window)) {
    return;
  }

  // Jika izin belum sinkron di level browser situs, minta ulang secara paksa
  if (Notification.permission !== 'granted') {
    const status = await Notification.requestPermission();
    if (status !== 'granted') {
      console.warn("Izin notifikasi belum disetujui oleh mesin situs browser.");
      return;
    }
  }

  // 🎯 SETELAN PRIORITAS TINGGI: Mencegah Android silent-drop notifikasi
  const defaultOptions = {
    body: options.body || "",
    tag: options.tag || "grind-log-notification",
    renotify: true,                 // Timpa notifikasi lama jika tag sama
    requireInteraction: true,       // Notifikasi bakal menetap di laci atas sampai di-swipe user
    vibrate: [200, 100, 200],       // Pola getar taktis
    ...options
  };

  // 🚀 Eksekusi via Service Worker Terdaftar
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, defaultOptions);
        return; // Berhasil keluar ke laci atas HP
      }
    } catch (err) {
      console.error("Gagal menembakkan lewat Service Worker, mencoba fallback...", err);
    }
  }

  // Fallback cadangan jika service worker sedang sibuk/delay
  try {
    new Notification(title, defaultOptions);
  } catch (e) {
    console.error("Semua jalur notifikasi native diblokir browser:", e);
  }
}
