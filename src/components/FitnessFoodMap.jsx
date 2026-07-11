import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Dumbbell, Utensils, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { fetchLocationsWithAutoExpand } from '../utils/geoServices';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function FitnessFoodMap() {
  const [category, setCategory] = useState('gym');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [statusMsg, setStatusMsg] = useState('Mencari sinyal GPS HP kamu...');
  
  const mapRef = useRef(null); 
  const mapInstance = useRef(null); 
  const markersLayer = useRef(null);

  // Efek 1: Inisialisasi Deteksi GPS Perangkat Mobile
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setStatusMsg('');
        },
        () => {
          setStatusMsg('Akses GPS ditolak. Tolong aktifkan izin lokasi di browser HP lu.');
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setStatusMsg('Browser HP lu purba, tidak mendukung deteksi lokasi.');
    }
  }, []);

  // Efek 2: Render Peta Inti Leaflet secara Native
  useEffect(() => {
    if (!userCoords || !mapRef.current) return;

    if (!mapInstance.current) {
      // Setup dasar peta dengan koordinat user
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([userCoords.lat, userCoords.lon], 13);
      
      // Inject tile layer gratisan OpenStreetMap dengan filter dark-mode tiruan via CSS
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapInstance.current);

      // Beri tanda pin biru di posisi asli user sekarang
      L.circle([userCoords.lat, userCoords.lon], {
        radius: 200,
        color: '#7C5CFF',
        fillColor: '#7C5CFF',
        fillOpacity: 0.4
      }).addTo(mapInstance.current).bindPopup('Posisi Lu Sekarang');

      markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    } else {
      mapInstance.current.setView([userCoords.lat, userCoords.lon], 12);
    }
  }, [userCoords]);

  // Efek 3: Memicu Pemindaian Data saat Kategori Diubah
  useEffect(() => {
    if (userCoords) {
      triggerSearch();
    }
  }, [category, userCoords]);

  const triggerSearch = async () => {
    setLoading(true);
    setStatusMsg('Memindai jaringan data regional (Auto-expanding)...');
    
    if (markersLayer.current) markersLayer.current.clearLayers();

    const results = await fetchLocationsWithAutoExpand(userCoords.lat, userCoords.lon, category);
    setPlaces(results);
    setLoading(false);

    if (results.length === 0) {
      setStatusMsg('Zonasi kosong! Tidak ada lokasi terdata dalam radius jangkauan 50 KM.');
      return;
    }

    setStatusMsg('');

    // Plotting titik pin lokasi baru ke dalam peta mini Leaflet
    const bounds = [[userCoords.lat, userCoords.lon]];
    results.forEach(p => {
      bounds.push([p.lat, p.lon]);
      L.marker([p.lat, p.lon])
        .addTo(markersLayer.current)
        .bindPopup(`<b style="color:#000">${p.name}</b><br/><span style="color:#555;font-size:11px">${p.address}</span>`);
    });

    // Posisikan kamera peta agar mencakup semua pin secara otomatis
    if (mapInstance.current && results.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  const handleLaunchGoogleMaps = (destLat, destLon) => {
    const intentUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}&travelmode=driving`;
    window.open(intentUrl, '_blank');
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

      {/* PETA PREVIEW CONTAINER */}
      <div className="w-full h-[220px] bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden relative z-10">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center font-mono text-xs text-[#EDEAF6]/60 gap-2">
            <Loader2 className="animate-spin text-[#7C5CFF]" size={16} />
            <span>Memindai Peta Kota...</span>
          </div>
        )}
      </div>

      {/* STATUS NOTIFIKASI NOTIFIKASI */}
      {statusMsg && (
        <div className="p-3 bg-[#100E16] border border-[#211D2C] rounded-lg text-xs font-mono text-[#EDEAF6]/60 flex items-center gap-2">
          <AlertCircle size={14} className="text-[#7C5CFF]" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* LIST KARTU LOKASI DARI DEKAT KE JAUH */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-340px)]">
        {!loading && places.map((place) => (
          <div 
            key={place.id}
            className="bg-[#100E16] border border-[#211D2C] p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-[#7C5CFF]/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-white uppercase tracking-wider truncate flex items-center gap-1.5">
                <MapPin size={12} className="text-[#7C5CFF]" />
                {place.name}
              </h4>
              <p className="text-[10px] text-[#EDEAF6]/40 truncate mt-1 pl-3.5">
                {place.address}
              </p>
              <div className="mt-2 flex gap-1.5 pl-3.5">
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black border border-[#211D2C] rounded text-[#7C5CFF] font-bold">
                  ~{place.distance.toFixed(1)} KM
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-black border border-[#211D2C] rounded text-[#EDEAF6]/40">
                  Radar: {place.currentRadiusKM}KM
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchGoogleMaps(place.lat, place.lon)}
              className="w-9 h-9 rounded-lg bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 hover:bg-[#7C5CFF] text-[#7C5CFF] hover:text-white flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              title="Navigasi Google Maps"
            >
              <Navigation size={14} fill="currentColor" className="transform rotate-45" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
