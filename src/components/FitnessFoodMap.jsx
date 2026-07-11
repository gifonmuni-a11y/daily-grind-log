import React, { useState, useEffect } from 'react';
import { Dumbbell, Utensils, MapPin, Loader2, AlertCircle, Search, BookOpen, Calculator, ChevronRight } from 'lucide-react';

// ==================== DATA CODEX BERGAMBAR (MINIMAL 10 GYM & 10 FOOD) ====================
const GYM_EQUIPMENT = [
  { name: 'Dumbbell', function: 'Melatih otot dada, bahu, lengan (bicep/tricep), dan punggung secara isolasi.', beginner: '3 Set x 12 Reps (Beban: 4 - 8 kg)', pro: '4 Set x 8 Reps (Beban: 16 - 32+ kg)', img: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Barbell', function: 'Gerakan compound untuk squat, bench press, dan deadlift menambah massa otot total.', beginner: '3 Set x 8 Reps (Stik Kosong atau +5 kg)', pro: '5 Set x 5 Reps (Beban: 60 - 120+ kg)', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=60' },
  { name: 'Treadmill', function: 'Membakar kalori lemak tubuh dan melatih kekuatan kardiovaskular (jantung).', beginner: 'Jalan cepat / Jogging santai (Durasi: 15 - 20 menit)', pro: 'HIIT Sprints Intervals (Durasi: 30 - 45 menit)', img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&auto=format&fit=crop&q=60' },
  { name: 'Smith Machine', function: 'Squat atau press dengan jalur lintasan besi yang aman terkunci untuk menjaga form tubuh.', beginner: '3 Set x 10 Reps (Fokus kestabilan gerakan)', pro: '4 Set x 8 Reps (Beban maksimal tanpa spotter)', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=60' },
  { name: 'Cable Machine', function: 'Memberikan tekanan konstan pada otot sepanjang gerakan (Chest Flyes / Pushdown).', beginner: '3 Set x 12 Reps (Beban: 2 - 3 slot lempengan)', pro: '4 Set x 15 Reps (Drop sets sampai failure)', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=60' },
  { name: 'Leg Press', function: 'Menghancurkan otot paha (quadriceps) dan bokong tanpa membebani tulang belakang.', beginner: '3 Set x 10 Reps (Beban penuh: 40 - 60 kg)', pro: '4 Set x 8 Reps (Beban badak: 150 - 300+ kg)', img: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&auto=format&fit=crop&q=60' },
  { name: 'Lat Pulldown', function: 'Membentuk otot punggung bagian atas agar terlihat lebar berbentuk V-Taper.', beginner: '3 Set x 12 Reps (Beban postur: 25 - 35 kg)', pro: '4 Set x 10 Reps (Beban berat berat: 60 - 90 kg)', img: 'https://images.unsplash.com/photo-1605296867304-46d5465a25f1?w=400&auto=format&fit=crop&q=60' },
  { name: 'Pec Deck Machine', function: 'Mengisolasi otot dada bagian tengah secara maksimal untuk efek pam dada yang tebal.', beginner: '3 Set x 12 Reps (Fokus remasan otot dada)', pro: '4 Set x 12 Reps (Beban hipertrofi tinggi)', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=60' },
  { name: 'Kettlebell', function: 'Meningkatkan kekuatan fungsional tubuh, daya ledak, serta stabilitas core.', beginner: '3 Set x 15 Reps Kettlebell Swings (8 - 12 kg)', pro: '4 Set x 10 Reps Clean & Press (20 - 28+ kg)', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sepeda Statis', function: 'Latihan kardio rendah benturan yang aman untuk lutut sekaligus mengencangkan kaki.', beginner: 'Gowesan santai konstan (Durasi: 20 - 30 menit)', pro: 'Interval kayuhan berat (Durasi: 45 menit)', img: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=400&auto=format&fit=crop&q=60' }
];

const HEALTHY_FOOD = [
  { name: 'Dada Ayam Fillet', lowBudget: 'Direbus dengan bawang putih geprek, garam, lada hitam. Murah, tinggi protein bebas minyak.', richBudget: 'Dimasak pakai Air Fryer diolesi mentega zaitun (olive oil), rosemary segar, lemon juice.', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&auto=format&fit=crop&q=60' },
  { name: 'Telur Ayam Kampung', lowBudget: 'Direbus matang atau setengah matang 2-3 butir sehari. Sumber protein termurah sejagat raya.', richBudget: 'Dibuat telur dadar putih telur organik dengan campuran jamur portobello dan bayam Jepang.', img: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&auto=format&fit=crop&q=60' },
  { name: 'Ikan Salmon', lowBudget: 'Diganti ikan kembung lokal segar (nutrisi Omega-3 hampir setara salmon tapi harga merakyat).', richBudget: 'Pan-seared Norwegian Salmon dengan saus mentega bawang putih dan taburan wijen organik.', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60' },
  { name: 'Tahu & Tempe fresh', lowBudget: 'Dikukus atau dipanggang teflon tanpa minyak. Karbo dan protein nabati super hemat.', richBudget: 'Dibuat steak tempe bumbu barbeque zaitun disajikan dengan salad asparagus segar.', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sayur Brokoli Hijau', lowBudget: 'Dipotong kecil lalu dikukus 5 menit bersama garam dapur. Menjaga serat alami tubuh.', richBudget: 'Brokoli organik ditumis ringan menggunakan minyak kelapa premium dan udang kupas laut dalam.', img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=60' },
  { name: 'Oatmeal / Gandum Utuh', lowBudget: 'Diseduh air panas biasa ditambah pisang lokal potongan kecil sebagai pemanis alami.', richBudget: 'Rolled Oats organik dimasak susu almond, topping chia seeds, buah blueberry, madu asli.', img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&auto=format&fit=crop&q=60' },
  { name: 'Beras Merah / Hitam', lowBudget: 'Dimasak di rice cooker biasa dicampur sedikit beras putih agar tekstur tidak terlalu seret.', richBudget: 'Beras organik hitam aromatik disajikan dengan taburan bawang bombay karamel zaitun.', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Jus Alpukat Murni', lowBudget: 'Alpukat mentega dikerok blender air es, gunakan sedikit susu kental manis di pinggiran gelas.', richBudget: 'Alpukat organik diblender kental dengan susu UHT low-fat dan pemanis alami tetes stevia.', img: 'https://images.unsplash.com/photo-1554998171-89445e31c52b?w=400&auto=format&fit=crop&q=60' },
  { name: 'Infused Water Detoks', lowBudget: 'Air matang galon di dalam botol diisi potongan timun dan jeruk nipis terjangkau pasar.', richBudget: 'Air mineral premium pH tinggi diisi irisan strawberry impor, lemon California, daun mint segar.', img: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&auto=format&fit=crop&q=60' },
  { name: 'Teh Hijau Murni', lowBudget: 'Teh hijau celup lokal seduh air panas tanpa gula sama sekali. Bagus untuk bakar lemak harian.', richBudget: 'Matcha bubuk murni kualitas upacara (ceremonial grade) Jepang diseduh air hangat suam-suam kuku.', img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&auto=format&fit=crop&q=60' }
];

export default function FitnessFoodMap() {
  const [subTab, setSubTab] = useState('maps'); // 'maps', 'codex', 'matrix'
  const [mapCategory, setMapCategory] = useState('gym'); // 'gym' atau 'food'
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [geoError, setGeoError] = useState('');

  // STATE KALKULATOR KALORI (MATRIX)
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('pria');
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState(1.465); // Default berolahraga 4-5 kali seminggu sesuai gambar
  const [calResult, setCalResult] = useState(null);

  // Efek Ambil GPS HP Perangkat
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGeoError('');
          setGeoLoading(false);
        },
        () => {
          setGeoError('Akses GPS ditolak. Tolong aktifkan izin lokasi di pengaturan HP lu.');
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setGeoError('Browser HP lu tidak mendukung pendeteksian lokasi GPS.');
      setGeoLoading(false);
    }
  }, []);

  // Handler hitung kalori berbasis persamaan terakurat Mifflin-St Jeor
  const calculateCalories = (e) => {
    e.preventDefault();
    let bmr = 0;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (gender === 'pria') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    const tdee = bmr * parseFloat(activity);
    setCalResult({
      bmr: Math.round(bmr),
      maintenance: Math.round(tdee),
      loss: Math.round(tdee - 500),
      extremeLoss: Math.round(tdee - 1000),
      gain: Math.round(tdee + 500)
    });
  };

  const getGoogleMapsEmbedUrl = () => {
    if (!userCoords) return '';
    const keyword = mapCategory === 'gym' ? 'gym+fitness' : 'makanan+sehat+restoran';
    return `https://maps.google.com/maps?q=${keyword}&sll=${userCoords.lat},${userCoords.lon}&z=14&output=embed`;
  };

  return (
    <div className="w-full min-h-screen bg-[#000000] text-[#EDEAF6] px-4 pt-2 pb-32 select-none flex flex-col gap-4">
      
      {/* 🧭 NAVIGASI SUB-TAB UTAMA (MAPS, CODEX, MATRIX) */}
      <div className="flex bg-[#100E16] p-1 border border-[#211D2C] rounded-xl z-10 sticky top-0 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setSubTab('maps')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${
            subTab === 'maps' ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.3)]' : 'text-[#EDEAF6]/40'
          }`}
        >
          <MapPin size={13} /> Radar Peta
        </button>
        <button
          type="button"
          onClick={() => setSubTab('codex')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${
            subTab === 'codex' ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.3)]' : 'text-[#EDEAF6]/40'
          }`}
        >
          <BookOpen size={13} /> Codex Data
        </button>
        <button
          type="button"
          onClick={() => setSubTab('matrix')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${
            subTab === 'matrix' ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.3)]' : 'text-[#EDEAF6]/40'
          }`}
        >
          <Calculator size={13} /> Kalkulator
        </button>
      </div>

      {/* ==================== SUB-TAB 1: GOOGLE LIVE MAPS ==================== */}
      {subTab === 'maps' && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-2 bg-[#0A0A0E] p-1 border border-[#211D2C] rounded-lg">
            <button
              type="button"
              onClick={() => setMapCategory('gym')}
              className={`flex-1 py-2 text-[10px] font-mono uppercase font-bold transition-all ${
                mapCategory === 'gym' ? 'text-white border-b-2 border-[#7C5CFF]' : 'text-[#EDEAF6]/30'
              }`}
            >
              Cari Gym Terdekat
            </button>
            <button
              type="button"
              onClick={() => setMapCategory('food')}
              className={`flex-1 py-2 text-[10px] font-mono uppercase font-bold transition-all ${
                mapCategory === 'food' ? 'text-white border-b-2 border-[#7C5CFF]' : 'text-[#EDEAF6]/30'
              }`}
            >
              Cari Kuliner Sehat
            </button>
          </div>

          <div className="w-full h-[400px] bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden relative shadow-[0_0_25px_rgba(124,92,255,0.03)]">
            {geoLoading && (
              <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center font-mono text-xs text-[#EDEAF6]/60 gap-2">
                <Loader2 className="animate-spin text-[#7C5CFF]" size={20} />
                <span>Menghubungkan Satelit Google Maps...</span>
              </div>
            )}
            {geoError && (
              <div className="absolute inset-0 bg-black p-4 z-20 flex flex-col items-center justify-center text-center font-mono text-xs text-[#EDEAF6]/60 gap-2">
                <AlertCircle className="text-[#7C5CFF]" size={20} />
                <span>{geoError}</span>
              </div>
            )}
            {userCoords && (
              <iframe
                title="Google Live Engine"
                className="w-full h-full border-0 invert-[0.91] hue-rotate-[180deg] contrast-[1.2] sat-[0.85]"
                src={getGoogleMapsEmbedUrl()}
                allowFullScreen=""
                allow="geolocation"
                loading="lazy"
              />
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: CODEX ENSIKLOPEDIA DATA ==================== */}
      {subTab === 'codex' && (
        <div className="flex flex-col gap-6">
          {/* SEKTOR PERALATAN GYM */}
          <div>
            <div className="flex items-center gap-2 mb-3 border-l-4 border-[#7C5CFF] pl-2">
              <Dumbbell size={16} className="text-[#7C5CFF]" />
              <h3 className="font-mono text-xs uppercase tracking-widest font-black text-white">10 Panduan Alat Gym</h3>
            </div>
            <div className="space-y-3">
              {GYM_EQUIPMENT.map((item, idx) => (
                <div key={idx} className="bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden flex flex-col sm:flex-row gap-3 p-3">
                  <img src={item.img} alt={item.name} className="w-full sm:w-24 h-24 object-cover rounded-lg bg-[#0A0A0E] border border-[#211D2C] flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-mono uppercase font-black text-[#7C5CFF] tracking-wide">{idx + 1}. {item.name}</h4>
                      <p className="text-[10px] text-[#EDEAF6]/50 mt-1 leading-relaxed">{item.function}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#211D2C]/40 pt-2 text-[9px] font-mono">
                      <div>
                        <span className="text-emerald-400 block font-bold">🟢 PEMULA:</span>
                        <span className="text-[#EDEAF6]/60">{item.beginner}</span>
                      </div>
                      <div>
                        <span className="text-purple-400 block font-bold">🔥 SUHU (PRO):</span>
                        <span className="text-[#EDEAF6]/60">{item.pro}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEKTOR DIET NUTRISI */}
          <div>
            <div className="flex items-center gap-2 mb-3 border-l-4 border-[#7C5CFF] pl-2">
              <Utensils size={16} className="text-[#7C5CFF]" />
              <h3 className="font-mono text-xs uppercase tracking-widest font-black text-white">10 Pilihan Makanan & Minuman Sehat</h3>
            </div>
            <div className="space-y-3">
              {HEALTHY_FOOD.map((item, idx) => (
                <div key={idx} className="bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden flex flex-col sm:flex-row gap-3 p-3">
                  <img src={item.img} alt={item.name} className="w-full sm:w-24 h-24 object-cover rounded-lg bg-[#0A0A0E] border border-[#211D2C] flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <h4 className="text-xs font-mono uppercase font-black text-[#7C5CFF] tracking-wide">{idx + 1}. {item.name}</h4>
                    <div className="mt-2 space-y-1.5 text-[10px] font-body">
                      <div className="bg-black/40 border border-[#211D2C] p-2 rounded-md">
                        <span className="font-mono text-[9px] text-amber-500 font-bold block mb-0.5">🪙 OPSI LOW BUDGET:</span>
                        <p className="text-[#EDEAF6]/70 text-[9px] leading-relaxed">{item.lowBudget}</p>
                      </div>
                      <div className="bg-black/40 border border-[#211D2C] p-2 rounded-md">
                        <span className="font-mono text-[9px] text-violet-400 font-bold block mb-0.5">👑 OPSI SULTAN / KAYA:</span>
                        <p className="text-[#EDEAF6]/70 text-[9px] leading-relaxed">{item.richBudget}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: KALKULATOR KALORI METRIK ==================== */}
      {subTab === 'matrix' && (
        <div className="bg-[#100E16] border border-[#211D2C] rounded-xl p-4 flex flex-col gap-4">
          <div className="border-b border-[#211D2C] pb-2">
            <h3 className="font-mono text-xs uppercase font-black text-white tracking-widest">Kalkulator Kalori (Satuan Metrik)</h3>
            <p className="text-[10px] text-[#EDEAF6]/40 font-mono mt-0.5">Menggunakan Algoritma Akurasi Mifflin-St Jeor</p>
          </div>

          <form onSubmit={calculateCalories} className="space-y-3.5 text-xs font-mono">
            {/* INPUT USIA */}
            <div className="flex flex-col gap-1">
              <label className="text-[#EDEAF6]/60 uppercase text-[10px]">Usia (15 - 80 tahun):</label>
              <input 
                type="number" min="15" max="80" required value={age} 
                onChange={(e) => setAge(e.target.value)} 
                className="bg-black border border-[#211D2C] p-2.5 rounded-lg text-white font-mono focus:border-[#7C5CFF] outline-none" 
              />
            </div>

            {/* INPUT JENIS KELAMIN */}
            <div className="flex flex-col gap-1">
              <label className="text-[#EDEAF6]/60 uppercase text-[10px]">Jenis Kelamin:</label>
              <div className="flex gap-4 p-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value="pria" checked={gender === 'pria'} onChange={() => setGender('pria')} className="accent-[#7C5CFF]" />
                  <span>Pria</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value="perempuan" checked={gender === 'perempuan'} onChange={() => setGender('perempuan')} className="accent-[#7C5CFF]" />
                  <span>Perempuan</span>
                </label>
              </div>
            </div>

            {/* INPUT TINGGI BADAN */}
            <div className="flex flex-col gap-1">
              <label className="text-[#EDEAF6]/60 uppercase text-[10px]">Tinggi Badan (cm):</label>
              <input 
                type="number" min="50" max="250" required value={height} 
                onChange={(e) => setHeight(e.target.value)} 
                className="bg-black border border-[#211D2C] p-2.5 rounded-lg text-white font-mono focus:border-[#7C5CFF] outline-none" 
              />
            </div>

            {/* INPUT BERAT BADAN */}
            <div className="flex flex-col gap-1">
              <label className="text-[#EDEAF6]/60 uppercase text-[10px]">Berat Badan (kg):</label>
              <input 
                type="number" min="20" max="300" required value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                className="bg-black border border-[#211D2C] p-2.5 rounded-lg text-white font-mono focus:border-[#7C5CFF] outline-none" 
              />
            </div>

            {/* INPUT TINGKAT AKTIVITAS */}
            <div className="flex flex-col gap-1">
              <label className="text-[#EDEAF6]/60 uppercase text-[10px]">Tingkat Aktivitas Fisik Harian:</label>
              <div className="bg-black border border-[#211D2C] rounded-lg p-2.5 space-y-2 text-[10px]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.0" checked={activity === 1.0} onChange={() => setActivity(1.0)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Tingkat Metabolisme Basal (BMR)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.2" checked={activity === 1.2} onChange={() => setActivity(1.2)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Sedikit atau tidak ada olahraga sama sekali</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.375" checked={activity === 1.375} onChange={() => setActivity(1.375)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Berolahraga Ringan (1-3 kali seminggu)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.465" checked={activity === 1.465} onChange={() => setActivity(1.465)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Berolahraga Sedang (4-5 kali seminggu)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.725" checked={activity === 1.725} onChange={() => setActivity(1.725)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Olahraga harian / olahraga intensif (3-4 kali seminggu)</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="radio" name="act" value="1.9" checked={activity === 1.9} onChange={() => setActivity(1.9)} className="mt-0.5 accent-[#7C5CFF]" />
                  <span>Latihan sangat intensif (6-7 kali seminggu)</span>
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-[#7C5CFF] text-white font-mono uppercase font-black rounded-lg shadow-[0_0_15px_rgba(124,92,255,0.35)] active:scale-[0.99] transition-all mt-2 text-center"
            >
              Hitung Energi Harian
            </button>
          </form>

          {/* RENDERING HASIL MATRIKS ENERGI */}
          {calResult && (
            <div className="mt-4 bg-black border border-[#211D2C] rounded-xl p-3 space-y-2.5 font-mono text-[10px]">
              <div className="border-b border-[#211D2C] pb-1.5 flex justify-between text-[#EDEAF6]/40 uppercase text-[9px]">
                <span>Status Kebutuhan</span>
                <span>Jumlah Energi</span>
              </div>
              <div className="flex justify-between items-center bg-[#100E16] p-2 border border-[#211D2C]/60 rounded">
                <span>Metabolisme Basal (BMR):</span>
                <span className="text-[#7C5CFF] font-black">{calResult.bmr} kkal/hari</span>
              </div>
              <div className="flex justify-between items-center bg-[#100E16] p-2 border border-[#211D2C]/60 rounded">
                <span>Mempertahankan Berat Badan (TDEE):</span>
                <span className="text-white font-black">{calResult.maintenance} kkal/hari</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-950/40 p-2 border border-emerald-900/40 rounded">
                <span className="text-emerald-400">Turun Berat Badan (-500 kkal):</span>
                <span className="text-emerald-400 font-black">{calResult.loss} kkal/hari</span>
              </div>
              <div className="flex justify-between items-center bg-amber-950/40 p-2 border border-amber-900/40 rounded">
                <span className="text-amber-400">Turun Berat Ekstrim (-1000 kkal):</span>
                <span className="text-amber-400 font-black">{calResult.extremeLoss} kkal/hari</span>
              </div>
              <div className="flex justify-between items-center bg-purple-950/40 p-2 border border-purple-900/40 rounded">
                <span className="text-purple-400">Naik Berat Badan (+500 kkal):</span>
                <span className="text-purple-400 font-black">{calResult.gain} kkal/hari</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
