import React, { useState, useEffect } from 'react';
import { Dumbbell, Utensils, MapPin, Loader2, BookOpen, Calculator, ArrowLeft, ShieldCheck, Flame, Scale, ChevronDown } from 'lucide-react';

// ... (KEEP GYM_EQUIPMENT, HEALTHY_FOOD, FOOD_NUTRITION_BASE, ACTIVITY_OPTIONS SEPERTI SEMULA) ...
const GYM_EQUIPMENT = [
  { name: 'Dumbbell', function: 'Melatih otot dada, bahu, lengan (bicep/tricep), dan punggung secara isolasi.', beginner: '3 Set x 12 Reps (Beban: 4 - 8 kg)', pro: '4 Set x 8 Reps (Beban: 16 - 32+ kg)', img: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Barbell', function: 'Gerakan compound untuk squat, bench press, dan deadlift menambah massa otot total.', beginner: '3 Set x 8 Reps (Stik Kosong atau +5 kg)', pro: '5 Set x 5 Reps (Beban: 60 - 120+ kg)', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=60' },
  { name: 'Treadmill', function: 'Membakar kalori lemak tubuh dan melatih kekuatan kardiovaskular (jantung).', beginner: 'Jalan cepat (Durasi: 15 - 20 menit)', pro: 'HIIT Sprints Intervals (Durasi: 30 - 45 menit)', img: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&auto=format&fit=crop&q=60' },
  { name: 'Smith Machine', function: 'Squat atau press dengan jalur lintasan besi yang aman terkunci untuk menjaga form tubuh.', beginner: '3 Set x 10 Reps (Fokus kestabilan gerakan)', pro: '4 Set x 8 Reps (Beban maksimal tanpa spotter)', img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&auto=format&fit=crop&q=60' },
  { name: 'Cable Machine', function: 'Memberikan tekanan konstan pada otot sepanjang gerakan (Chest Flyes / Pushdown).', beginner: '3 Set x 12 Reps (Beban: 2 - 3 slot lempengan)', pro: '4 Set x 15 Reps (Drop sets sampai failure)', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&auto=format&fit=crop&q=60' },
  { name: 'Leg Press', function: 'Menghancurkan otot paha (quadriceps) dan bokong tanpa membebani tulang belakang.', beginner: '3 Set x 10 Reps (Beban penuh: 40 - 60 kg)', pro: '4 Set x 8 Reps (Beban badak: 150 - 300+ kg)', img: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&auto=format&fit=crop&q=60' },
  { name: 'Lat Pulldown', function: 'Membentuk otot punggung bagian atas agar terlihat lebar berbentuk V-Taper.', beginner: '3 Set x 12 Reps (Beban postur: 25 - 35 kg)', pro: '4 Set x 10 Reps (Beban berat: 60 - 90 kg)', img: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&auto=format&fit=crop&q=60' },
  { name: 'Pec Deck Machine', function: 'Mengisolasi otot dada bagian tengah secara maksimal untuk efek pam dada yang tebal.', beginner: '3 Set x 12 Reps (Fokus remasan otot dada)', pro: '4 Set x 12 Reps (Beban hipertrofi tinggi)', img: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=60' },
  { name: 'Kettlebell', function: 'Meningkatkan kekuatan fungsional tubuh, daya ledak, serta stabilitas core.', beginner: '3 Set x 15 Reps Swings (8 - 12 kg)', pro: '4 Set x 10 Reps Clean & Press (20 - 28+ kg)', img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sepeda Statis', function: 'Latihan kardio rendah benturan yang aman untuk lutut sekaligus mengencangkan kaki.', beginner: 'Gowesan santai konstan (Durasi: 20 - 30 menit)', pro: 'Interval kayuhan berat (Durasi: 45 menit)', img: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=400&auto=format&fit=crop&q=60' }
];

const HEALTHY_FOOD = [
  { name: 'Dada Ayam Fillet', lowBudget: 'Direbus dengan bawang putih geprek, garam, lada hitam. Murah, tinggi protein bebas minyak.', richBudget: 'Dimasak pakai Air Fryer diolesi mentega zaitun (olive oil), rosemary segar, lemon juice.', img: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&auto=format&fit=crop&q=60' },
  { name: 'Telur Ayam Kampung', lowBudget: 'Direbus matang atau setengah matang 2-3 butir sehari. Sumber protein termurah sejagat raya.', richBudget: 'Dibuat telur dadar putih telur organik dengan campuran jamur portobello dan bayam Jepang.', img: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&auto=format&fit=crop&q=60' },
  { name: 'Ikan Salmon / Kembung', lowBudget: 'Diganti ikan kembung lokal segar (nutrisi Omega-3 hampir setara salmon tapi harga merakyat).', richBudget: 'Pan-seared Norwegian Salmon dengan saus mentega bawang putih dan taburan wijen organik.', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60' },
  { name: 'Tahu & Tempe Fresh', lowBudget: 'Dikukus atau dipanggang teflon tanpa minyak. Karbo dan protein nabati super hemat.', richBudget: 'Dibuat steak tempe bumbu barbeque zaitun disajikan dengan salad asparagus segar.', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Sayur Brokoli Hijau', lowBudget: 'Dipotong kecil lalu dikukus 5 menit bersama garam dapur. Menjaga serat alami tubuh.', richBudget: 'Brokoli organik ditumis ringan menggunakan minyak kelapa premium dan udang kupas laut dalam.', img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&auto=format&fit=crop&q=60' },
  { name: 'Oatmeal / Gandum Utuh', lowBudget: 'Diseduh air panas biasa ditambah pisang lokal potongan kecil sebagai pemanis alami.', richBudget: 'Rolled Oats organik dimasak susu almond, topping chia seeds, buah blueberry, madu asli.', img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&auto=format&fit=crop&q=60' },
  { name: 'Beras Merah / Hitam', lowBudget: 'Dimasak di rice cooker biasa dicampur sedikit beras putih agar tekstur tidak terlalu seret.', richBudget: 'Beras organik hitam aromatik disajikan dengan taburan bawang bombay karamel zaitun.', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=60' },
  { name: 'Jus Alpukat Murni', lowBudget: 'Alpukat mentega dikerok blender air es, gunakan sedikit susu kental manis di pinggiran gelas.', richBudget: 'Alpukat organik diblender kental dengan susu UHT low-fat and pemanis alami tetes stevia.', img: 'https://images.unsplash.com/photo-1554998171-89445e31c52b?w=400&auto=format&fit=crop&q=60' },
  { name: 'Infused Water Detoks', lowBudget: 'Air matang galon di dalam botol diisi potongan timun dan jeruk nipis terjangkau pasar.', richBudget: 'Air mineral premium pH tinggi diisi irisan strawberry impor, lemon California, daun mint segar.', img: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=400&auto=format&fit=crop&q=60' },
  { name: 'Teh Hijau Murni', lowBudget: 'Teh hijau celup lokal seduh air panas tanpa gula sama sekali. Bagus untuk bakar lemak harian.', richBudget: 'Matcha bubuk murni kualitas upacara (ceremonial grade) Jepang diseduh air hangat suam-suam kuku.', img: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&auto=format&fit=crop&q=60' }
];

const FOOD_NUTRITION_BASE = [
  { id: '1', name: 'Dada Ayam (Matang)', caloriesPerGram: 2.38, proteinPerGram: 0.31 },
  { id: '2', name: 'Telur Ayam (Utuh/Butir ~50g)', caloriesPerGram: 1.56, proteinPerGram: 0.13 },
  { id: '3', name: 'Ikan Salmon (Matang)', caloriesPerGram: 2.06, proteinPerGram: 0.22 },
  { id: '4', name: 'Ikan Kembung (Matang)', caloriesPerGram: 2.38, proteinPerGram: 0.22 },
  { id: '5', name: 'Nasi Putih (Matang)', caloriesPerGram: 1.30, proteinPerGram: 0.027 },
  { id: '6', name: 'Nasi Merah (Matang)', caloriesPerGram: 1.11, proteinPerGram: 0.026 },
  { id: '7', name: 'Tempe Murni (Kukus)', caloriesPerGram: 1.96, proteinPerGram: 0.20 },
  { id: '8', name: 'Tahu Putih', caloriesPerGram: 0.76, proteinPerGram: 0.08 },
  { id: '9', name: 'Brokoli Hijau (Kukus)', caloriesPerGram: 0.35, proteinPerGram: 0.024 },
  { id: '10', name: 'Daging Sapi (Masak Tanpa Lemak)', caloriesPerGram: 2.50, proteinPerGram: 0.26 }
];

const ACTIVITY_OPTIONS = [
  { value: 1.0, label: 'Tingkat Metabolisme Basal (BMR)' },
  { value: 1.2, label: 'Sedikit atau tidak ada olahraga sama sekali' },
  { value: 1.375, label: 'Berolahraga 1-3 kali seminggu' },
  { value: 1.465, label: 'Berolahraga 4-5 kali seminggu' },
  { value: 1.55, label: 'Olahraga harian atau olahraga intensif 3-4 kali seminggu' },
  { value: 1.725, label: 'Latihan intensif 6-7 kali seminggu' },
  { value: 1.9, label: 'Olahraga yang sangat intens setiap hari, atau pekerjaan fisik' }
];

export default function FitnessFoodMap({ onBackToHome }) {
  const [subTab, setSubTab] = useState('maps'); 
  const [mapCategory, setMapCategory] = useState('gym'); 
  const [activeQuery, setActiveQuery] = useState('gym terdekat');
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);
  
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('pria');
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(65);
  const [activity, setActivity] = useState(1.465); 
  const [calResult, setCalResult] = useState(null);
  const [showActivitySelector, setShowActivitySelector] = useState(false);

  const [selectedFoodId, setSelectedFoodId] = useState('1');
  const [foodWeight, setFoodWeight] = useState(100);
  const [foodResult, setFoodResult] = useState(null);
  const [showFoodSelector, setShowFoodSelector] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setGeoLoading(false);
        },
        () => {
          setUserCoords({ lat: -6.2000, lon: 106.8166 });
          setGeoLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, []);

  const calculateCalories = (e) => {
    e.preventDefault();
    let bmr = 0;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (gender === 'pria') bmr = 10 * w + 6.25 * h - 5 * a + 5;
    else bmr = 10 * w + 6.25 * h - 5 * a - 161;

    const tdee = bmr * parseFloat(activity);
    setCalResult({
      bmr: Math.round(bmr),
      maintenance: Math.round(tdee),
      loss: Math.round(tdee - 500),
      gain: Math.round(tdee + 500)
    });
  };

  const handleFoodCalculate = (e) => {
    e.preventDefault();
    const foodItem = FOOD_NUTRITION_BASE.find(f => f.id === selectedFoodId);
    if (!foodItem) return;
    const grams = parseFloat(foodWeight) || 0;
    setFoodResult({
      name: foodItem.name,
      weight: grams,
      totalCalories: Math.round(grams * foodItem.caloriesPerGram),
      totalProtein: (grams * foodItem.proteinPerGram).toFixed(1)
    });
  };

  const currentFoodItem = FOOD_NUTRITION_BASE.find(f => f.id === selectedFoodId);
  const currentActivityItem = ACTIVITY_OPTIONS.find(a => a.value === parseFloat(activity)) || ACTIVITY_OPTIONS[3];

  return (
    <div className="w-full text-[#EDEAF6] px-4 pt-2 select-none flex flex-col gap-4 pb-36">
      
      <div className="flex items-center gap-3 bg-[#100E16] border border-[#211D2C] p-3 rounded-xl shadow-lg relative">
        <div className="absolute -top-[1px] -left-[1px] w-2.5 h-2.5 border-t-2 border-l-2 border-[#7C5CFF] z-40" />
        <div className="absolute -top-[1px] -right-[1px] w-2.5 h-2.5 border-t-2 border-r-2 border-[#7C5CFF] z-40" />
        <div className="absolute -bottom-[1px] -left-[1px] w-2.5 h-2.5 border-b-2 border-l-2 border-[#7C5CFF] z-40" />
        <div className="absolute -bottom-[1px] -right-[1px] w-2.5 h-2.5 border-b-2 border-r-2 border-[#7C5CFF] z-40" />
        
        <button type="button" onClick={onBackToHome} className="w-8 h-8 rounded-lg bg-[#211D2C] border border-[#312C42] flex items-center justify-center text-[#7C5CFF] active:scale-95 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-col">
          <span className="font-display font-bold text-sm uppercase text-white tracking-widest">Radar Fitur Utama</span>
          <span className="text-[9px] font-mono text-[#EDEAF6]/40">Kembali melatih log harian</span>
        </div>
      </div>

      <div className="flex bg-[#100E16] p-1 border border-[#211D2C] rounded-xl sticky top-0 backdrop-blur-md z-10 shadow-lg">
        <button type="button" onClick={() => setSubTab('maps')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${subTab === 'maps' ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/40'}`}><MapPin size={12} /> Radar Peta</button>
        <button type="button" onClick={() => setSubTab('codex')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${subTab === 'codex' ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/40'}`}><BookOpen size={12} /> Codex Data</button>
        <button type="button" onClick={() => setSubTab('matrix')} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-mono uppercase tracking-wider font-black transition-all rounded-lg ${subTab === 'matrix' ? 'bg-[#7C5CFF] text-white' : 'text-[#EDEAF6]/40'}`}><Calculator size={12} /> Kalkulator</button>
      </div>

      {subTab === 'maps' && (
        <div className="flex flex-col gap-3">
          {/* 🎯 MAP MINI: Diperkecil tingginya ke h-[280px] */}
          <div className="w-full h-[280px] bg-[#100E16] border border-[#211D2C] rounded-xl overflow-hidden relative">
            <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#7C5CFF] z-40" />
            <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-[#7C5CFF] z-40" />
            <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-[#7C5CFF] z-40" />
            <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#7C5CFF] z-40" />
            {geoLoading && <div className="absolute inset-0 bg-black z-20 flex flex-col items-center justify-center font-mono text-xs text-[#EDEAF6]/60"><Loader2 className="animate-spin text-[#7C5CFF]" size={20} /></div>}
            {userCoords && <iframe title="Google Live" className="w-full h-full border-0 invert-[0.91] hue-rotate-[180deg] contrast-[1.2] sat-[0.85]" src={`https://maps.google.com/maps?q=${encodeURIComponent(activeQuery)}&ll=${userCoords.lat},${userCoords.lon}&z=15&output=embed`} loading="lazy" />}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Gym Controls */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-bold text-[#8B8696] font-mono tracking-widest pl-1">Cari Gym</span>
              <div className="grid grid-cols-2 gap-2">
                {['gym terdekat', 'gym fitness'].map(q => (
                  <button key={q} onClick={() => { setMapCategory('gym'); setActiveQuery(q); }} className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${activeQuery === q ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white' : 'bg-[#100E16] border-[#211D2C] text-[#EDEAF6]/60'}`}>{q}</button>
                ))}
              </div>
            </div>
            {/* Food Controls */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-bold text-[#8B8696] font-mono tracking-widest pl-1">Cari Kuliner Sehat</span>
              <div className="grid grid-cols-1 gap-2">
                {['kuliner sehat', 'makanan sehat terdekat', 'makanan sehat restoran'].map(q => (
                  <button key={q} onClick={() => { setMapCategory('food'); setActiveQuery(q); }} className={`py-2 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${activeQuery === q ? 'bg-[#7C5CFF]/20 border-[#7C5CFF] text-white' : 'bg-[#100E16] border-[#211D2C] text-[#EDEAF6]/60'}`}>{q}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CODEX & MATRIX (BIARKAN SAMA SEPERTI KODE SEBELUMNYA) */}
      {subTab === 'codex' && (
        <div className="flex flex-col gap-6">
          {/* ... (isi codex tetap sama) ... */}
        </div>
      )}
      
      {subTab === 'matrix' && (
        <div className="flex flex-col gap-4">
          {/* ... (isi matrix tetap sama dengan activity selector yang sudah saya tambahkan di atas) ... */}
        </div>
      )}
    </div>
  );
}
