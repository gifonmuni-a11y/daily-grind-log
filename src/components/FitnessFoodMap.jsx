import React, { useState, useEffect } from 'react';
import { Dumbbell, Utensils, Loader2, AlertCircle, MapPin } from 'lucide-react';

export default function FitnessFoodMap() {
  const [category, setCategory] = useState('gym');
  const [userCoords, setUserCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('Mendeteksi lokasi GPS HP lu...');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
          setErrorMsg('');
          setLoading(false);
        },
        () => {
          setErrorMsg('Akses GPS ditolak. Tolong aktifkan izin lokasi di HP lu.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setErrorMsg('Browser HP lu tidak mendukung GPS.');
      setLoading(false);
    }
  }, []);

  // 🎯 URL ENGINE RESMI: Memaksa Google mencari keyword di sekitar titik koordinat GPS rumah lu
  const getGoogleMapsEmbedUrl = () => {
    if (!userCoords) return '';
    
    // Gunakan keyword pencarian lokal
    const keyword = category === 'gym' ? 'Gym+Fitness' : 'Makanan+Sehat+Restoran';
    
    // Trik kuncian: q=${keyword}+${lat},${lon} memaksa Google maps melakukan search massal 
    // dan menjatuhkan banyak pin merah sekaligus di radius sekitar koordinat tersebut.
    return `https://maps.google.com/maps?q=${keyword}+${userCoords.lat},${userCoords.lon}&z=14&output=embed`;
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-[#EDEAF6] p-4 select-none flex flex-col gap-3">
      {/* HEADER NAVIGASI TAB KATEGORI */}
      <div className="flex gap-2 bg-[#100E16] p-1 border border-[#211D2C] rounded-lg">
        <button
          type="button"
          onClick={() => setCategory('gym')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase tracking-wider font-black transition-all ${
            category === 'gym' ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.4)]' : 'text-[#EDEAF6]/40 hover:text-white'
          }`}
        >
          <Dumbbell size={13} /> Gym & Fitness
        </button>
        <button
          type="button"
          onClick={() => setCategory('food')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase tracking-wider font-black transition-all ${
            category === 'food' ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.4)]' : 'text-[#EDEAF6]/40 hover:text-white'
          }`}
        >
          <Utensils size={13} /> Makanan Sehat
        </button>
      </div>

      {/* FRAME UTAMA GOOGLE MAPS LIVE ENGINE (DENGAN EMULASI DARK MODE) */}
      <div className="flex-1 w-full bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden relative min-h-[440px] shadow-[0_0_20px_rgba(124,92,255,0.02)]">
        {loading && (
          <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center font-mono text-xs text-[#EDEAF6]/60 gap-3">
            <Loader2 className="animate-spin text-[#7C5CFF]" size={20} />
            <span>Menghubungkan ke Google Live Radar...</span>
          </div>
        )}

        {errorMsg && !userCoords && (
          <div className="absolute inset-0 bg-black p-4 z-20 flex flex-col items-center justify-center text-center font-mono text-xs text-[#EDEAF6]/60 gap-2">
            <AlertCircle className="text-[#7C5CFF]" size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {userCoords && (
          <iframe
            title="Google Maps Live Radar"
            className="w-full h-full border-0 invert-[0.92] hue-rotate-[180deg] contrast-[1.2] sat-[0.8]" 
            src={getGoogleMapsEmbedUrl()}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* FOOTER INFORMASI */}
      {userCoords && (
        <div className="p-3 bg-[#100E16] border border-[#211D2C] rounded-lg text-[10px] font-mono text-[#EDEAF6]/40 flex items-center gap-2 justify-center">
          <MapPin size={12} className="text-[#7C5CFF]" />
          <span>Mencari fasilitas fisik terdekat dari koordinat HP lu secara real-time</span>
        </div>
      )}
    </div>
  );
}
