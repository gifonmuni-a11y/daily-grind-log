import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Dumbbell, Utensils, Navigation, Loader2, AlertCircle, Search } from 'lucide-react';
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
  const drawLayer = useRef(null);

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
      setStatusMsg('Browser HP lu tidak mendukung deteksi lokasi GPS.');
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!userCoords || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, { zoomControl: false }).setView([userCoords.lat, userCoords.lon], 12);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO'
      }).addTo(mapInstance.current);

      drawLayer.current = L.layerGroup().addTo(mapInstance.current);

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 250);
    }
  }, [userCoords]);

  useEffect(() => {
    if (userCoords) {
      triggerSearch();
    }
  }, [category, userCoords]);

  const triggerSearch = async () => {
    if (!mapInstance.current || !drawLayer.current) return;

    setLoading(true);
    setStatusMsg('Memindai jaringan regional (Auto-expanding radius)...');
    
    drawLayer.current.clearLayers();

    const results = await fetchLocationsWithAutoExpand(userCoords.lat, userCoords.lon, category);
    setPlaces(results);
    setLoading(false);

    L.circleMarker([userCoords.lat, userCoords.lon], {
      radius: 6,
      color: '#ffffff',
      fillColor: '#7C5CFF',
      fillOpacity: 1,
      weight: 2
    }).addTo(drawLayer.current).bindPopup('Posisi Lu Sekarang');

    if (results.length === 0) {
      setStatusMsg('Zonasi OSM kosong! Coba gunakan Google Engine di bawah.');
      
      L.circle([userCoords.lat, userCoords.lon], {
        radius: 50000,
        color: '#7C5CFF',
        fillColor: '#7C5CFF',
        fillOpacity: 0.05,
        weight: 1.5,
        dashArray: '5, 8'
      }).addTo(drawLayer.current);

      mapInstance.current.setView([userCoords.lat, userCoords.lon], 10);
      return;
    }

    setStatusMsg('');
    
    const activeRadiusMeters = results[results.length - 1].currentRadiusKM * 1000;

    L.circle([userCoords.lat, userCoords.lon], {
      radius: activeRadiusMeters,
      color: '#7C5CFF',
      fillColor: '#7C5CFF',
      fillOpacity: 0.08,
      weight: 1.5
    }).addTo(drawLayer.current);

    const bounds = [[userCoords.lat, userCoords.lon]];
    results.forEach(p => {
      bounds.push([p.lat, p.lon]);
      L.marker([p.lat, p.lon])
        .addTo(drawLayer.current)
        .bindPopup(`<b style="color:#000">${p.name}</b><br/><span style="color:#555;font-size:11px">${p.address}</span>`);
    });

    mapInstance.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleLaunchGoogleMaps = (destLat, destLon) => {
    const intentUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}&travelmode=driving`;
    window.open(intentUrl, '_blank');
  };

  // 🎯 TANGKAP GOOGLE MAPS ENGINE PENCARIAN LANGSUNG SECARA DINAMIS
  const handleGoogleSearchFallback = () => {
    if (!userCoords) return;
    const queryKeyword = category === 'gym' ? 'gym+terdekat' : 'makanan+sehat+terdekat';
    const googleFallbackUrl = `https://www.google.com/maps/search/${queryKeyword}/@${userCoords.lat},${userCoords.lon},14z`;
    window.open(googleFallbackUrl, '_blank');
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-[#EDEAF6] p-4 select-none flex flex-col gap-3">
      {/* TOMBOL TAB KATEGORI */}
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

      {/* FRAME PETA MAPS */}
      <div className="w-full h-[225px] bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden relative z-10">
        <div ref={mapRef} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex items-center justify-center font-mono text-xs text-[#EDEAF6]/60 gap-2">
            <Loader2 className="animate-spin text-[#7C5CFF]" size={16} />
            <span>Memindai Geografis Wilayah...</span>
          </div>
        )}
      </div>

      {/* NOTIFIKASI STATUS */}
      {statusMsg && (
        <div className="p-3 bg-[#100E16] border border-[#211D2C] rounded-lg text-xs font-mono text-[#EDEAF6]/60 flex items-center gap-2">
          <AlertCircle size={14} className="text-[#7C5CFF]" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* DAFTAR KARTU JURUSAN TEMPAT ATAU FALLBACK ENGINE */}
      <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[calc(100vh-340px)]">
        {!loading && places.length === 0 && userCoords && (
          <div className="p-6 bg-[#100E16] border border-[#211D2C] border-dashed rounded-xl text-center space-y-4">
            <p className="font-body text-xs text-[#EDEAF6]/50 leading-relaxed">
              OpenStreetMap regional belum memetakan lokasi kategori ini di sekitar area lu. Pakai jalur pintas Google Maps satelit untuk akurasi instan:
            </p>
            <button
              type="button"
              onClick={handleGoogleSearchFallback}
              className="w-full py-3 bg-[#7C5CFF] text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,92,255,0.3)] hover:bg-[#684be3] active:scale-[0.98] transition-all"
            >
              <Search size={14} /> Cari via Google Maps Live
            </button>
          </div>
        )}

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
                  Jangkauan: {place.currentRadiusKM}KM
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLaunchGoogleMaps(place.lat, place.lon)}
              className="w-9 h-9 rounded-lg bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 hover:bg-[#7C5CFF] text-[#7C5CFF] hover:text-white flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
              title="Navigasi Arah Jalan"
            >
              <Navigation size={14} fill="currentColor" className="transform rotate-45" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
