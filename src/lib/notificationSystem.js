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

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Mengirimkan notifikasi taktis native ke system drawer perangkat
 * @param {string} title Judul notifikasi utama
 * @param {Object} options Konfigurasi payload notifikasi
 */
export async function sendSystemNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions = {
    icon: '/icons/icon-192x192.png', 
    badge: '/icons/icon-96x96.png', 
    vibrate: [200, 100, 200],       
    data: {
      url: window.location.origin   
    },
    ...options
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, defaultOptions);
    } catch (err) {
      console.error("Gagal menembakkan notifikasi via Service Worker:", err);
      new Notification(title, defaultOptions);
    }
  } else {
    new Notification(title, defaultOptions);
  }
}
