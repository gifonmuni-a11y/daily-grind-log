import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

const ScrollbarStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .faq-slider-container::-webkit-scrollbar { height: 4px !important; background: #100E16 !important; }
    .faq-slider-container::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 2px !important; }
  `}} />
)

const LEGENDARY_QUOTES = [
  { id: 'legend_1', name: 'ADE RAI', quote: 'Kesehatan dan otot kuat bukan tujuan utama, melainkan modal dasar paling berharga untuk mencapai semua impian raksasamu.', mission: 'Latihan beban intens & jaga porsi makan hari ini tanpa jebol.' },
  { id: 'legend_2', name: 'ARNOLD SCHWARZENEGGER', quote: 'Satu-satunya cara untuk meruntuhkan batasan fisikmu adalah dengan terus menembus rasa sakit itu tanpa rasa takut.', mission: 'Tambah repetisi atau beban melebihi batas nyaman biasanya hari ini.' },
  { id: 'legend_3', name: 'DAVID GOGGINS', quote: 'Saat pikiranmu berkata sudah selesai, sebenarnya fisikmu baru menggunakan 40 persen kekuatan aslinya. Tetap keras!', mission: 'Selesaikan sesi latihan penuh hari ini tanpa menyerah di tengah jalan.' },
  { id: 'legend_4', name: 'DEDDY CORBUZIER', quote: 'Rasa malas itu bukan kepribadian, itu cuma alasan dari mental yang lemah. Bangun sekarang dan paksa dirimu ke medan latihan!', mission: 'Jangan tunda jam latihan, eksekusi log tepat waktu hari ini.' },
  { id: 'legend_5', name: 'CRISTIANO RONALDO', quote: 'Bakat tanpa kerja keras jangka panjang tidak akan pernah berarti apa-apa di panggung tertinggi dunia.', mission: 'Fokus penuh pada konsistensi gerakan dan ketepatan form eksekusi.' },
  { id: 'legend_6', name: 'DENNY SUMARGO', quote: 'Kemenangan sejati didapatkan saat kamu berhasil mengalahkan rasa ingin menyerah yang berisik di dalam kepalamu sendiri.', mission: 'Lawan rasa mager, lakukan minimal 15 menit conditioning harian.' },
  { id: 'legend_7', name: 'THE ROCK', quote: 'Sukses bukan tentang menjadi yang paling hebat dalam semalam, tapi tentang konsistensi kerja keras berdarah-darah setiap hari.', mission: 'Pertahankan dan amankan grafik streak harianmu jangan sampai pecah.' },
  { id: 'legend_8', name: 'BUNG KARNO', quote: 'Gantungkan cita-cita latihanmu setinggi langit! Jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.', mission: 'Set target log mingguan tertinggi dan catat sesi dengan performa terbaik.' }
]

const VALID_YOUTUBE_POOL = {
  mulai: ['GY1JhB9BEkk', 'cbKkB3POqaY', 'UItWltVZZmE', 'VaoV1PrU38I', 'rS89E7X922E'],
  kardio_angkat: ['cbKkB3POqaY', 'GY1JhB9BEkk', 'xY9mE_B2ZpM', '958b9Oun_Mo', 'UItWltVZZmE'],
  latihan: ['cbKkB3POqaY', 'GY1JhB9BEkk', 'UItWltVZZmE', 'OQz76N3SGoA', 'j68bWf6yG_Y'],
  makanan: ['mzpDEPg7-3E', 'xyQe5N6L2K8', 'Z_M-hC-3U_8', 'GY1JhB9BEkk', 'cbKkB3POqaY'],
  tidur: ['-lu1Nmttz4w', 't0kACis_dJE', '3e_tS3GZfH0', 'UItWltVZZmE', 'GY1JhB9BEkk'],
  kesalahan: ['rH447xP0INg', 'E3_vE68g0Gk', 'bI6Gg9rKNFY', 'cbKkB3POqaY', 'GY1JhB9BEkk']
}

// 🔥 LIST DATA AMAN MASTER 34 KATEGORI UTUH TANPA POTONGAN
const MASTER_34_CATEGORIES = [
  { name: 'Pemanasan (Warm-up)', benefit: 'Meningkatkan sirkulasi darah, elastisitas otot, dan kesiapan sistem saraf pusat.', risk: 'Kram otot mendadak, robeknya jaringan ligamen, dan performa latihan tidak maksimal.', id: 'Gc9m0sQ8Sxk' },
  { name: 'Push Up', benefit: 'Membangun kekuatan otot dada (pectoralis), lengan (triceps), dan bahu depan secara simultan.', risk: 'Ketidakseimbangan postur otot depan-belakang serta cedera sendi pergelangan tangan.', id: 'r3o1kOaG4P4' },
  { name: 'Squat', benefit: 'Memperkuat fondasi otot paha depan (quads), paha belakang (hamstrings), glutes, dan core harian.', risk: 'Beban berlebih pada tempurung lutut dan potensi cedera syaraf kejepit di pinggang bawah.', id: 'Gc9m0sQ8Sxk' },
  { name: 'Plank', benefit: 'Mengunci stabilitas seluruh dinding otot perut, core dalam, serta mengurangi nyeri punggung bawah.', risk: 'Otot punggung bawah melengkung paksa (hiperektensi) yang memicu cedera lumbal saraf.', id: 'ASV35q6m174' },
  { name: 'Lunges', benefit: 'Melatih keseimbangan unilateral, kekuatan paha secara mandiri, dan mobilitas sendi pinggul.', risk: 'Ketegangan tendon patella lutut dan risiko kehilangan keseimbangan jatuh ke samping.', id: 'QOVaHwmZ76c' },
  { name: 'Meditasi', benefit: 'Menurunkan gelombang stres kortisol, menenangkan sistem saraf, dan mempertajam koneksi pikiran-otot.', risk: 'Overthinking meningkat, kecemasan menumpuk di otak, dan mental mengalami fatigue parah.', id: '2sJyBfDZpe4' },
  { name: 'Pola Tidur (Rest)', benefit: 'Memicu pelepasan hormon pertumbuhan alami (HGH) untuk memperbaiki kerusakan sel makro otot.', risk: 'Katabolisme otot (otot menyusut), metabolisme hancur, dan penurunan fokus drastis.', id: 't0kACis_dJE' },
  { name: 'Kardio / HIIT', benefit: 'Meningkatkan kapasitas VO2 Max kerja jantung dan mempercepat pembakaran cadangan lemak tubuh.', risk: 'Kehilangan massa otot jika berlebih (overtraining) dan nyeri kronis persendian kaki.', id: 'kZDvg92tTMc' },
  { name: 'Pull Up', benefit: 'Membangun lebar sayap punggung (lats) secara maksimal serta memperkuat daya cengkeram tangan.', risk: 'Cedera robek tendon siku (golfer’s elbow) dan ketegangan berlebih pada otot trapezius leher.', id: 'DXL18E7QRbk' },
  { name: 'Leg Day (Kaki)', benefit: 'Memicu lonjakan hormon testosteron alami yang membantu pertumbuhan seluruh otot tubuh.', risk: 'Sindrom asimetri tubuh bagian bawah dan penurunan performa mobilitas harian.', id: 'QXtXEug0PLU' },
  { name: 'Upper Body (Tubuh Atas)', benefit: 'Membentuk postur tubuh V-Taper yang tegap dan meningkatkan daya dorong harian.', risk: 'Cedera rotator cuff bahu kronis akibat over-rotation beban statis.', id: '0zhvUV1bAVQ' },
  { name: 'Lower Body (Tubuh Bawah)', benefit: 'Memperkuat otot penopang berat badan utama serta menjaga densitas tulang kaki.', risk: 'Nyeri kronis sendi ankle kaki dan ketegangan urat tendon achilles belakang.', id: 'UEWEYeJGkLM' },
  { name: 'Full Body Workout', benefit: 'Meningkatkan efisiensi waktu latihan serta mengoptimalkan pembakaran kalori total harian.', risk: 'Kelelahan sistem saraf pusat secara masif jika intensitas diatur terlalu tinggi.', id: 'GViX8riaHX4' },
  { name: 'Olympic Lifting', benefit: 'Mengembangkan daya ledak eksponensial, koordinasi neuromuscular antar sendi, dan power atletis.', risk: 'Dislokasi sendi bahu total, cedera tulang belakang, dan robek otot rotator cuff.', id: 'VMaBfcRprAU' },
  { name: 'Boxing / Combat', benefit: 'Melatih refleks instan, ketangkasan gerak kaki, koordinasi tangan-mata, serta ketahanan mental.', risk: 'Cedera gegar otak ringan akibat impak pukulan berulang dan dislokasi pergelangan tangan.', id: '1JHVNzLkbUg' },
  { name: 'Sport-Specific Training', benefit: 'Mengunci performa mekanik tubuh sesuai cabang olahraga spesifik yang sedang ditekuni.', risk: 'Cedera overuse berulang pada satu bagian sendi tubuh akibat pola gerakan monoton.', id: 'Mo6B5EjfHGU' },
  { name: 'Martial Arts', benefit: 'Meningkatkan fleksibilitas dinamis tubuh, disiplin tinggi, serta pertahanan diri taktis.', risk: 'Robeknya otot hamstring akibat tendangan tanpa persiapan form yang benar.', id: 'bs7X3F-XYTc' },
  { name: 'Core/Abs Isolation', benefit: 'Menstabilkan rongga perut tengah untuk menopang angkatan beban compound berat.', risk: 'Ketegangan hip flexor berlebih yang menarik tulang belakang bawah menjadi condong.', id: 'Cnmy08JgakM' },
  { name: 'Powerlifting', benefit: 'Memaksimalkan batas kekuatan absolut pada tiga gerakan dasar: Squat, Bench, dan Deadlift.', risk: 'Robeknya otot dada pectoralis major, herniasi piringan sendi tulang belakang (HNP).', id: 'JBJqZKx7MLI' },
  { name: 'Calisthenics', benefit: 'Menguasai kontrol penuh bobot tubuh sendiri di ruang hampa dan membentuk lean muscle.', risk: 'Kapalan ekstrem telapak tangan hingga robek, serta cedera tendon pergelangan siku.', id: 'kuUZYUBHryw' },
  { name: 'Kettlebell Flow', benefit: 'Membangun kekuatan rantai posterior tubuh lewat gerakan ayunan balistik dinamis.', risk: 'Beban kejut merusak struktur sendi bahu jika teknik ayunan awal salah arah.', id: 'VCcar3MA07w' },
  { name: 'Chest Isolation (Dada)', benefit: 'Memadatkan volume ketebalan otot dada bagian atas, tengah, hingga bawah.', risk: 'Ketegangan sendi bahu depan akibat ruang gerak dorongan yang terlalu turun dalam.', id: 'KIl70ffF5FM' },
  { name: 'Back Isolation (Punggung)', benefit: 'Memperbaiki postur tubuh bungkuk akibat terlalu sering melihat HP/duduk bekerja.', risk: 'Salah urat belikat (rhomboid) kronis yang menyebabkan nyeri saat menarik napas.', id: '8LJ3Q3Fsrzs' },
  { name: 'Shoulders (Bahu)', benefit: 'Melebarkan dimensi pundak kiri-kanan agar postur pakaian terlihat tegak berisi.', risk: 'Impingement syndrome (jepitan tendon bahu) akibat salah form angkat lateral.', id: 'QVaijMZ2mp8' },
  { name: 'Arms (Lengan Bicep/Tricep)', benefit: 'Meningkatkan lingkar lengan atas guna menunjang kekuatan dorong dan tarik.', risk: 'Tendonitis akut pada area siku tangan akibat volume set isolasi berlebih.', id: 'rSohL4gWm9A' },
  { name: 'Glutes Isolation (Bokong)', benefit: 'Meningkatkan daya dorong panggul saat lari cepat dan menstabilkan area panggul.', risk: 'Ketegangan otot piriformis yang dapat menjepit jalur saraf skiatika kaki bawah.', id: '1T3v_leyDIE' },
  { name: 'Mobility Drills', benefit: 'Memperluas jangkauan gerak sendi (ROM) aktif sehingga angkatan beban bisa dalam.', risk: 'Hipermobilitas sendi yang longgar sehingga rawan lepas dari mangkok sendinya.', id: 'tg6zZF6pRg0' },
  { name: 'Stretching (Peregangan)', benefit: 'Mengendurkan simpul otot kaku pasca latihan berat agar aliran asam laktat lancar.', risk: 'Otot ditarik paksa saat kondisi masih dingin memicu robek mikroskopis.', id: 'itJE4neqDJw' },
  { name: 'Yoga', benefit: 'Menyatukan fokus pernapasan dalam, keseimbangan statis, dan elastisitas ligamen tubuh.', risk: 'Cedera sendi lutut atau leher jika memaksakan pose lanjutan tanpa bimbingan.', id: 'RvCntPg7oPE' },
  { name: 'Swimming (Berenang)', benefit: 'Melatih ketahanan paru-paru tanpa memberikan impak benturan keras pada sendi kaki.', risk: 'Kram perut hebat di dalam air terdalam serta iritasi saluran pernapasan kaporit.', id: 'IKWGF4kP8Cs' },
  { name: 'Running (Lari)', benefit: 'Membakar kalori masif secara murah serta memperkuat kepadatan tulang kaki bawah.', risk: 'Shin splints (nyeri tulang kering kaki) dan stress fracture akibat salah mendarat.', id: '6H8WLfyavWk' },
  { name: 'Cycling (Bersepeda)', benefit: 'Membangun ketahanan otot paha (quads) berulang tanpa merusak bantalan lutut.', risk: 'Nyeri punggung bawah akibat geometri duduk membungkuk terlalu lama di sadel.', id: 'ZiGE3-L4vyg' },
  { name: 'Recovery Sessions', benefit: 'Memulihkan kesiapan jaringan tubuh total guna menyambut siklus latihan berikutnya.', risk: 'Penumpukan sisa metabolisme sampah otot yang memicu delayed onset muscle soreness.', id: 'utAqR9-dmh0' },
  { name: 'Pendinginan (Cool-down)', benefit: 'Menurunkan detak jantung secara bertahap menuju normal agar tidak terjadi pooling blood.', risk: 'Pusing mendadak hingga pingsan akibat penurunan tekanan darah instan pasca sesi.', id: 'U9ENCvFf9yQ' }
]

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [isQuestClaimed, setIsQuestClaimed] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setLiveTime(`${hours}:${minutes}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 🛡️ RE-IMPLEMENTASI FILTRASI REFERENSI LU: Bintang ilang & teks di dalam ** jadi ungu premium
  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      let processedLine = line
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts = []
      let lastIndex = 0
      let match

      const isBullet = line.trim().startsWith('* ')
      if (isBullet) {
        processedLine = line.trim().substring(2)
      }

      while ((match = boldRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processedLine.substring(lastIndex, match.index))
        }
        parts.push(<strong key={match.index} className="text-accent font-black">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < processedLine.length) {
        parts.push(processedLine.substring(lastIndex))
      }

      const content = parts.length > 0 ? parts : processedLine

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]">
            <span className="text-accent text-xs mt-1.5">•</span>
            <div className="flex-1 whitespace-pre-wrap leading-relaxed">{content}</div>
          </div>
        )
      }

      return (
        <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">
          {content}
        </p>
      )
    })
  }

  const extractYoutubeId = (text) => {
    if (!text) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const matches = text.match(regExp)
    if (matches && matches[2].length === 11) return matches[2]
    return null
  }

  const getTodayDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    setMessages([
      { 
        sender: 'seolha', 
        text: `Selamat malam, ${currentTier}. Paling susah itu bukan latihannya — tapi keluar pintu dan mulai.`,
        media: null
      }
    ])
    fetchDailyLimit()
    checkQuestPersistence()
  }, [currentTier])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchDailyLimit = async () => {
    try {
      const today = getTodayDateStr()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('ai_usage').select('count').eq('user_id', session.user.id).eq('date', today).single()
      if (data) setDailyCount(data.count)
    } catch (e) { console.error(e) }
  }

  const checkQuestPersistence = () => {
    const today = getTodayDateStr()
    const savedClaim = localStorage.getItem(`claim_${today}_${LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id}`)
    if (savedClaim === 'true') setIsQuestClaimed(true)
  }

  const handleClaimLegendQuest = () => {
    if (isQuestClaimed) return
    const today = getTodayDateStr()
    localStorage.setItem(`claim_${today}_${LEGENDARY_QUOTES[new Date().getDate() % LEGENDARY_QUOTES.length].id}`, 'true')
    setIsQuestClaimed(true)
  }

  const handleSend = async (e, customMsg = null, isFaq = false, isAllCategories = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return

    if (!isFaq && dailyCount >= 5) {
      setMessages(prev => [...prev, 
        { sender: 'user', text: msgToSend },
        { sender: 'seolha', text: 'Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya!', media: null }
      ])
      if (!customMsg) setInput('')
      return
    }

    const newMessages = [...messages, { sender: 'user', text: msgToSend }]
    if (!customMsg) setInput('')
    setMessages(newMessages)
    setLoading(true)

    // 🔥 BLOK GENERATOR MATRIX: Loop teks deskripsi + nempel iFrame di bawah masing-masing item
    if (isAllCategories) {
      let bulkReply = "Berikut adalah daftar matrix **34 KATEGORI LATIHAN LENGKAP** beserta manfaat, risiko, dan video panduan eksekusinya, Trainer:\n\n"
      
      MASTER_34_CATEGORIES.forEach((cat, index) => {
        bulkReply += `${index + 1}. **${cat.name.toUpperCase()}**\n* **Manfaat:** ${cat.benefit}\n* **Risiko Jika Absen:** ${cat.risk}\n\n`
      })

      const videoPayloads = MASTER_34_CATEGORIES.map(cat => ({ name: cat.name, id: cat.id, benefit: cat.benefit, risk: cat.risk }))

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'seolha', 
          text: bulkReply, 
          media: null,
          multiMedia: videoPayloads 
        }])
        setLoading(false)
      }, 1000)
      return
    }

    if (isFaq) {
      let faqReply = ''
      let mediaAsset = null

      if (msgToSend.includes('Mulai dari mana')) {
        mediaAsset = { type: 'video', src: '7K37eH7fG34' }
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank sebanyak 3 kali seminggu. Berikut panduan video lokal pilihan Seolha:`
      } 
      else if (msgToSend.includes('Kardio atau angkat')) {
        mediaAsset = { type: 'video', src: 'gcNh17CkW64' }
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, ${currentTier}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga stamina jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Kardio.`
      }
      else if (msgToSend.includes('Jenis & Cara Latihan')) {
        mediaAsset = { type: 'video', src: 'UItWltVZZmE' }
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, ${currentTier}.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
      }
      else if (msgToSend.includes('Pola Makan & Nutrisi')) {
        mediaAsset = { type: 'video', src: '3_9yOQ83PjI' }
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, ${currentTier}.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
      }
      else if (msgToSend.includes('Pola Tidur & Recovery')) {
        mediaAsset = { type: 'video', src: 't0kACis_dJE' }
        faqReply = `Ingat ini, ${currentTier}: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
      }
      else if (msgToSend.includes('Kesalahan Fatal Pemula')) {
        mediaAsset = { type: 'video', src: 'ixkQaYn5eg0' }
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, ${currentTier}:\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Meniru program latihan atlet profesional tanpa fondasi dasar.`
      }

      setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, media: mediaAsset }])
      setLoading(false)
      return
    }

    try {
      const cleanInput = msgToSend.toLowerCase()
      const foundMatch = MASTER_34_CATEGORIES.find(cat => cleanInput.includes(cat.name.split(' ')[0].toLowerCase()))
      
      const formattedHistory = newMessages
        .filter((m, idx) => idx > 0 && !m.text.includes('Gagal mendapatkan respon'))
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedHistory, userStats })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada progres lain yang mau kita diskusikan?'
        const explicitId = extractYoutubeId(replyText)
        if (explicitId) {
          replyText = replyText.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/g, '')
        }
        
        let finalMedia = null
        if (explicitId) {
          finalMedia = { type: 'video', src: explicitId }
        } else if (foundMatch) {
          finalMedia = { type: 'video', src: foundMatch.id }
        }
        
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: finalMedia }])
        setDailyCount(prev => prev + 1)
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke Seolha terputus.', media: null }])
    } final { setLoading(false) }
  }

  const dayQuoteIndex = new Date().getDate() % LEGENDARY_QUOTES.length
  const todayQuote = LEGENDARY_QUOTES[dayQuoteIndex]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 max-w-lg mx-auto select-none">
      <ScrollbarStyles />
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">AI Companion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs text-text-high bg-[#100E16] px-2 py-0.5 border border-[#211D2C]">
            <Clock size={11} className="text-accent" />
            <span>{liveTime || '00:00'}</span>
          </div>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text-high bg-[#100E16] border border-[#7C5CFF]/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(124,92,255,0.05)]">
            <svg className="w-3.5 h-3.5 text-[#7C5CFF] fill-current" viewBox="0 0 24 24">
              <path d="M16 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm4 4h2v4h-2v-4z"/>
            </svg>
            <span>{5 - dailyCount}/5 Energi</span>
          </div>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <button onClick={onClose} className="p-1 hover:bg-border-hover rounded text-text-dim transition-colors"><X size={18} /></button>
        </div>
      </div>

      <div className="mt-2.5 p-2.5 bg-[#100E16] border border-[#211D2C] flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Quote size={11} className="text-accent" />
          <span className="font-mono text-[10px] text-accent font-bold tracking-wider uppercase">DAILY QUOTE: {todayQuote.name}</span>
        </div>
        <p className="font-body text-xs text-text-high italic leading-relaxed pl-1.5 border-l-2 border-[#211D2C]">"{todayQuote.quote}"</p>
        <button type="button" onClick={handleClaimLegendQuest} disabled={isQuestClaimed} className={`mt-1 w-full p-2 border text-left flex items-start gap-2.5 transition-all ${isQuestClaimed ? 'bg-emerald-950/20 border-emerald-500/40 opacity-80' : 'bg-[#0A0A0E] border-accent/30 hover:border-accent'}`}>
          {isQuestClaimed ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-accent/60 shrink-0 mt-0.5 flex items-center justify-center font-mono text-[8px] text-accent font-bold">!</div>}
          <div className="flex-1 min-w-0 font-mono text-[11px] leading-tight text-left">
            <div className={`font-bold mb-0.5 ${isQuestClaimed ? 'text-emerald-400' : 'text-text-high'}`}>{isQuestClaimed ? 'EVENT QUEST COMPLETED' : 'TERIMA EVENT QUEST'}</div>
            <p className="whitespace-normal break-words font-body text-[11px] leading-normal text-text-dim">Misi: {todayQuote.mission}</p>
          </div>
          <span className={`shrink-0 font-bold text-[11px] ${isQuestClaimed ? 'text-emerald-400' : 'text-accent'}`}>{isQuestClaimed ? 'DONE' : '+50 EXP'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-tl-xl rounded-tr-xl rounded-br-xl'}`}>
              {m.sender === 'seolha' && <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1"><Bot size={10} /> SEOLHA</div>}
              <div className="flex flex-col">{m.sender === 'seolha' ? renderMessageText(m.text) : <p className="whitespace-pre-wrap">{m.text}</p>}</div>
            </div>
            
            {m.sender === 'seolha' && m.media && (
              <div className="w-[85%] mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg shadow-xl overflow-hidden aspect-video">
                <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${m.media.src}?playsinline=1&enablejsapi=1&rel=0`} title="Inline Stream Guide" frameBorder="0" allowFullScreen />
              </div>
            )}

            {/* 🔥 LOOP EMBED MULTI-VIDEO PENJELASAN MATRIX 34 KATEGORI TANPA STUCK */}
            {m.sender === 'seolha' && m.multiMedia && Array.isArray(m.multiMedia) && (
              <div className="w-[85%] space-y-6 mt-3 max-h-[360px] overflow-y-auto p-2 bg-[#0A0A0E] border border-[#211D2C] rounded-lg">
                {m.multiMedia.map((vid, vIdx) => (
                  <div key={vIdx} className="border-b border-[#211D2C]/60 pb-4 last:border-0 flex flex-col gap-1.5">
                    <div className="font-mono text-xs text-accent font-black uppercase tracking-wider">{vIdx + 1}. {vid.name}</div>
                    <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Manfaat:</strong> {vid.benefit}</p>
                    <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Risiko Jika Absen:</strong> {vid.risk}</p>
                    <div className="w-full mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg overflow-hidden aspect-video">
                      <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${vid.id}?playsinline=1&enablejsapi=1&rel=0`} title={vid.name} frameBorder="0" allowFullScreen />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang memvalidasi komponen video...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mb-2 bg-background pt-1.5">
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-1.5">FAQ — 0 ENERGI</div>
        <div className="faq-slider-container flex gap-2 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          <button type="button" onClick={() => handleSend(null, 'Pemula mulai dari mana?', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Mulai dari mana?</button>
          <button type="button" onClick={() => handleSend(null, 'Kardio atau angkat beban?', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Kardio atau angkat?</button>
          <button type="button" onClick={() => handleSend(null, 'Jenis & Cara Latihan Pemula', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Cara & Jenis Latihan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Makan & Nutrisi Pemula', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Nutrisi & Makan</button>
          <button type="button" onClick={() => handleSend(null, 'Pola Tidur & Recovery Pemula', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Tidur & Recovery</button>
          <button type="button" onClick={() => handleSend(null, 'Kesalahan Fatal Pemula', true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-[#100E16] border border-[#211D2C] text-text-high font-mono tracking-wide uppercase hover:border-accent">Kesalahan Fatal</button>
          <button type="button" onClick={() => handleSend(null, 'Semua Kategori Matrix Latihan', false, true)} className="flex-shrink-0 w-[150px] text-center text-xs px-2.5 py-2 bg-accent/20 border border-accent text-accent font-mono tracking-wide uppercase font-black hover:bg-accent hover:text-white transition-all">SEMUA KATEGORI</button>
        </div>
      </div>

      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white"><Send size={16} /></button>
      </form>
    </div>
  )
}
