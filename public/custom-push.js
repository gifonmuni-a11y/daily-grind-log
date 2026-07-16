// Mendengarkan sinyal masuk dari server pusat ketika aplikasi sedang mati
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "[ PENGUMUMAN SISTEM ]";

    const options = {
      body: data.body || "",
      icon: data.icon || '/notification-icon.png',
      badge: data.badge || '/notification-badge.png',
      color: '#7C5CFF', // Warna ungu tema RPG Manhwa
      image: data.image || data.warning_img_url || null, // Menampilkan link foto dari Supabase secara native di laci HP
      requireInteraction: true, // Notifikasi menetap di atas laci HP sampai di-swipe player
      vibrate: [200, 100, 200], // Pola getar sistem taktis
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error("Gagal memproses kiriman data paket push:", err);
  }
});

// Menangani aksi ketika player mengetuk kotak notifikasi di HP mereka
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Jika aplikasi sudah terbuka di background, langsung fokuskan layarnya
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      // Jika aplikasi mati total, otomatis buka browser mengarah ke link aplikasi lu
      return clients.openWindow(event.notification.data.url);
    })
  );
});
