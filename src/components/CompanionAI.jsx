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

// 🟢 DAFTAR MATRIX 34 KATEGORI LATIHAN UTUH DENGAN VALIDASI ID VIDEO RESMI PWA LU
const MASTER_34_CATEGORIES = [
  { name: 'Pemanasan (Warm-up)', quote: 'Arnold Schwarzenegger: Otot yang dingin adalah otot yang rapuh. Pompa darah sebelum mengangkat besi beban berat.', benefit: 'Meningkatkan sirkulasi darah, mobilitas sendi, elastisitas otot, dan kesiapan sistem saraf pusat.', risk: 'Kram mendadak, robeknya jaringan ligamen tendon, dan performa latihan tidak maksimal.', id: 'GY1JhB9BEkk' },
  { name: 'Push Up', quote: 'Ade Rai: Otot dada, bahu, dan tricep dibangun dari dorongan beban tubuh yang konstan dan terkontrol.', benefit: 'Membangun kekuatan dan volume otot dada (pectoralis), lengan bawah (triceps), dan deltoid depan.', risk: 'Ketidakseimbangan postur dada-belakang serta peradangan sendi engsel pergelangan tangan.', id: 'cbKkB3POqaY' },
  { name: 'Squat', quote: 'Tom Platz: Batas bawah squat adalah tempat di mana karakter mental asli seorang pria diuji.', benefit: 'Memperkuat rantai kekuatan paha depan (quads), hamstring, otot bokong (glutes), dan stabilitas core.', risk: 'Beban kompresi berlebih merusak tempurung lutut dan potensi herniasi bantalan tulang belakang.', id: 'UItWltVZZmE' },
  { name: 'Plank', quote: 'David Goggins: Mengunci core dalam plank adalah perang statis melawan rasa ingin menyerah di dalam otak.', benefit: 'Mengunci stabilitas dinding otot perut transversal, memperkuat panggul, dan memangkas nyeri punggung.', risk: 'Otot lumbal bawah melengkung paksa (hiperekstensi) memicu jepitan saraf tulang belakang.', id: 'VaoV1PrU38I' },
  { name: 'Lunges', quote: 'Ronnie Coleman: Angkatan unilateral membentuk keseimbangan kaki yang kokoh untuk menopang beban raksasa.', benefit: 'Melatih keseimbangan otot kaki secara mandiri kiri-kanan serta meningkatkan mobilitas sendi pinggul.', risk: 'Ketegangan akut tendon patella lutut dan risiko dislokasi engsel pergelangan kaki.', id: 'rS89E7X922E' },
  { name: 'Meditasi', quote: 'Bruce Lee: Kosongkan pikiranmu, jadilah tanpa bentuk seperti air. Tenang di dalam badai latihan.', benefit: 'Menurunkan hormon stres kortisol, menenangkan sistem syaraf pusat, dan menajamkan mind-muscle connection.', risk: 'Overthinking berlebih jika dilakukan tanpa regulasi nafas yang fokus dan teratur.', id: '2sJyBfDZpe4' },
  { name: 'Pola Tidur (Rest)', quote: 'Dorian Yates: Otot tidak tumbuh di gym. Otot Anda tumbuh saat tidur pulas di dalam kegelapan kamar.', benefit: 'Memicu sintesis protein makro, pelepasan hormon pertumbuhan alami (HGH), dan pemulihan sel otot.', risk: 'Katabolisme jaringan otot (penyusutan), rusaknya sistem metabolisme, dan penurunan fokus drastis.', id: 't0kACis_dJE' },
  { name: 'Kardio / HIIT', quote: 'Chris Bumstead: Jantung yang kuat memompa nutrisi lebih cepat ke sel-sel otot yang sedang robek.', benefit: 'Meningkatkan kapasitas stamina VO2 Max kerja jantung dan mempercepat pembakaran deposit lemak.', risk: 'Kehilangan massa jaringan otot berharga (overtraining) dan inflamasi kronis sendi lutut.', id: 'kZDvg92tTMc' },
  { name: 'Pull Up', quote: 'Jay Cutler: Lebar punggung V-Taper ditentukan dari seberapa sering Anda menarik dagu melewati palang.', benefit: 'Membangun lebar sayap punggung (lats), otot belikat (rhomboid), serta kekuatan cengkeraman tangan.', risk: 'Cedera robek tendon siku dalam (golfer’s elbow) dan ketegangan kaku otot trapezius leher.', id: 'cbKkB3POqaY' },
  { name: 'Leg Day (Kaki)', quote: 'Branch Warren: Jangan pernah melewati latihan kaki, karena dari sanalah pondasi testosteron tubuh Anda berasal.', benefit: 'Memicu anabolisme alami tubuh untuk mempercepat laju pertumbuhan seluruh lingkar otot.', risk: 'Symmetry flaw bagian tubuh bawah dan ketegangan urat tendon achilles kaki.', id: 'UItWltVZZmE' },
  { name: 'Upper Body', quote: 'Phil Heath: Keseimbangan visual tubuh atas membutuhkan detail kontraksi penuh di setiap sudut repetisi.', benefit: 'Membentuk postur dada, punggung, dan bahu yang simetris serta meningkatkan kekuatan dorong.', risk: 'Cedera robek sendi putar rotator cuff bahu akibat beban angkat yang dipaksa lepas form.', id: 'GY1JhB9BEkk' },
  { name: 'Lower Body', quote: 'Kai Greene: Hubungkan pikiranmu dengan serat otot kaki, rasakan setiap tekanan beban mengoyak seratnya.', benefit: 'Memperkuat struktur tulang kaki penopang tubuh utama serta menjaga stabilitas gerak harian.', risk: 'Nyeri kronis persendian ankle bawah dan ketegangan berlebih pada ligamen lutut dalam.', id: 'UItWltVZZmE' },
  { name: 'Full Body Workout', quote: 'Mike Mentzer: Intensitas tinggi dalam waktu singkat merangsang seluruh serat otot untuk berkembang maksimal.', benefit: 'Mengoptimalkan efisiensi waktu latihan serta merangsang metabolisme pembakaran kalori total harian.', risk: 'Kelelahan sistem saraf pusat secara masif jika intensitas diatur terlalu tinggi.', id: 'cbKkB3POqaY' },
  { name: 'Olympic Lifting', quote: 'Lu Xiaojun: Kekuatan tanpa kecepatan tidak akan bisa menempatkan barbel raksasa di atas kepala Anda.', benefit: 'Mengembangkan daya ledak eksponensial, koordinasi neuromuscular antar sendi, dan power atletis.', risk: 'Dislokasi sendi bahu total, cedera tulang belakang, dan robek otot rotator cuff.', id: 'VaoV1PrU38I' },
  { name: 'Boxing / Combat', quote: 'Mike Tyson: Semua orang punya rencana sampai sebuah pukulan telak mendarat di mulut mereka.', benefit: 'Melatih refleks instan, ketangkasan gerak kaki, koordinasi tangan-mata, serta ketahanan mental.', risk: 'Cedera gegar otak ringan akibat impak pukulan berulang dan dislokasi pergelangan tangan.', id: 'rS89E7X922E' },
  { name: 'Sport-Specific Training', quote: 'Lee Haney: Jadilah spesialis di bidang Anda, latih mekanika gerak sendi secara presisi tanpa celah.', benefit: 'Mengunci performa mekanik tubuh sesuai cabang olahraga spesifik yang sedang ditekuni.', risk: 'Cedera overuse berulang pada satu bagian sendi tubuh akibat pola gerakan monoton.', id: 'GY1JhB9BEkk' },
  { name: 'Martial Arts', quote: 'Ip Man: Latihan bukan untuk pamer kekuatan, melainkan untuk menaklukkan ego diri sendiri di atas matras.', benefit: 'Meningkatkan fleksibilitas dinamis tubuh, disiplin tinggi, serta pertahanan diri taktis.', risk: 'Robeknya otot hamstring akibat tendangan tanpa persiapan form yang benar.', id: 'cbKkB3POqaY' },
  { name: 'Core/Abs Isolation', quote: 'Sergi Constance: Otot perut dikeraskan di ruang latihan lewat core compression dan dikunci rapat.', benefit: 'Menstabilkan rongga perut tengah untuk menopang angkatan beban compound berat.', risk: 'Ketegangan hip flexor berlebih yang menarik tulang belakang bawah menjadi condong.', id: 'VaoV1PrU38I' },
  { name: 'Powerlifting', quote: 'Eddie Hall: Ketika beban terasa ingin meremukkan tulangmu, di sanalah kekuatan mental sejatimu bekerja.', benefit: 'Memaksimalkan batas kekuatan absolut pada tiga gerakan dasar: Squat, Bench, dan Deadlift.', risk: 'Robeknya otot dada pectoralis major, herniasi piringan sendi tulang belakang (HNP).', id: 'UItWltVZZmE' },
  { name: 'Calisthenics', quote: 'Hannibal For King: Batasan fisikmu adalah ilusi yang diciptakan oleh otakmu sendiri. Tarik tubuhmu.', benefit: 'Menguasai kontrol penuh bobot tubuh sendiri di ruang hampa dan membentuk lean muscle.', risk: 'Kapalan ekstrem telapak tangan hingga robek, serta cedera tendon pergelangan siku.', id: 'cbKkB3POqaY' },
  { name: 'Kettlebell Flow', quote: 'Pavel Tsatsouline: Ayunan kettlebell adalah jembatan utama yang menghubungkan kekuatan dengan ketahanan.', benefit: 'Membangun kekuatan rantai posterior tubuh lewat gerakan ayunan balistik dinamis.', risk: 'Beban kejut merusak struktur sendi bahu jika teknik ayunan awal salah arah.', id: 'rS89E7X922E' },
  { name: 'Chest Isolation (Dada)', quote: 'Lazar Angelov: Bentuk dada yang penuh membutuhkan kontraksi padat dari berbagai sudut bangku latihan.', benefit: 'Memadatkan volume ketebalan otot dada bagian atas, tengah, hingga bawah.', risk: 'Ketegangan sendi bahu depan akibat ruang gerak dorongan yang terlalu turun dalam.', id: 'cbKkB3POqaY' },
  { name: 'Back Isolation (Punggung)', quote: 'Frank Zane: Estetika punggung tidak hanya soal lebar sayap, melainkan detail guratan otot belikat.', benefit: 'Memperbaiki postur tubuh bungkuk akibat terlalu sering melihat HP/duduk bekerja.', risk: 'Salah urat belikat (rhomboid) kronis yang menyebabkan nyeri saat menarik napas.', id: 'GY1JhB9BEkk' },
  { name: 'Shoulders (Bahu)', quote: 'Larry Scott: Bahu berdimensi bulat peluru membuat ilusi pinggang Anda terlihat jauh lebih ramping.', benefit: 'Melebarkan dimensi pundak kiri-kanan agar postur pakaian terlihat tegak berisi.', risk: 'Impingement syndrome (jepitan tendon bahu) akibat salah form angkat lateral.', id: 'UItWltVZZmE' },
  { name: 'Arms (Lengan Bicep/Tricep)', quote: 'Rich Piana: Jangan harap lengan Anda membesar jika Anda tidak memaksa darah mengalir penuh ke ototnya.', benefit: 'Meningkatkan lingkar lengan atas guna menunjang kekuatan dorong dan tarik.', risk: 'Tendonitis akut pada area siku tangan akibat volume set isolasi berlebih.', id: 'rS89E7X922E' },
  { name: 'Glutes Isolation (Bokong)', quote: 'Amanda Latona: Otot bokong yang kuat adalah motor utama penggerak daya ledak tubuh bawah.', benefit: 'Meningkatkan daya dorong panggul saat lari cepat dan menstabilkan area panggul.', risk: 'Ketegangan otot piriformis yang dapat menjepit jalur saraf skiatika kaki bawah.', id: 'UItWltVZZmE' },
  { name: 'Mobility Drills', quote: 'Kelly Starrett: Tubuh yang kuat tanpa mobilitas sendi yang fleksibel hanyalah sebuah mesin yang rusak.', benefit: 'Memperluas jangkauan gerak sendi (ROM) aktif sehingga angkatan beban bisa dalam.', risk: 'Hipermobilitas sendi yang longgar sehingga rawan lepas dari mangkok sendinya.', id: 'GY1JhB9BEkk' },
  { name: 'Stretching (Peregangan)', quote: 'Flex Wheeler: Elastisitas jaringan ikat pasca latihan mempercepat pembuangan limbah sisa metabolisme.', benefit: 'Mengendurkan simpul otot kaku pasca latihan berat agar aliran asam laktat lancar.', risk: 'Otot ditarik paksa saat kondisi masih dingin memicu robek mikroskopis.', id: 'cbKkB3POqaY' },
  { name: 'Yoga', quote: 'Kino MacGregor: Yoga adalah perjalanan spiritual yang dieksekusi melalui ketahanan fisik dan nafas.', benefit: 'Menyatukan fokus pernapasan dalam, keseimbangan statis, dan elastisitas ligamen tubuh.', risk: 'Cedera sendi lutut atau leher jika memaksakan pose lanjutan tanpa bimbingan.', id: 'UItWltVZZmE' },
  { name: 'Swimming (Berenang)', quote: 'Michael Phelps: Di dalam air tidak ada benturan sendi, yang ada hanya resistensi hampa udara.', benefit: 'Melatih ketahanan paru-paru tanpa memberikan impak benturan keras pada sendi kaki.', risk: 'Kram perut hebat di dalam air terdalam serta iritasi saluran pernapasan kaporit.', id: 'VaoV1PrU38I' },
  { name: 'Running (Lari)', quote: 'Eliud Kipchoge: Berlari bukan hanya soal kaki, melainkan disiplin menjaga ritme konstan jantung.', benefit: 'Membakar kalori masif secara murah serta memperkuat kepadatan tulang kaki bawah.', risk: 'Shin splints (nyeri tulang kering kaki) dan stress fracture akibat salah mendarat.', id: 'kZDvg92tTMc' },
  { name: 'Cycling (Bersepeda)', quote: 'Eddy Merckx: Latih terus paha Anda sampai rasa terbakar itu berubah menjadi tenaga kayuhan murni.', benefit: 'Membangun ketahanan otot paha (quads) berulang tanpa merusak bantalan lutut.', risk: 'Nyeri punggung bawah akibat geometri duduk membungkuk terlalu lama di sadel.', id: 't0kACis_dJE' },
  { name: 'Recovery Sessions', quote: 'Hafthor Bjornsson: Makan, tidur, dan hidrasi yang tepat di hari pemulihan menentukan bobot angkatan.', benefit: 'Memulihkan kesiapan jaringan tubuh total guna menyambut siklus latihan berikutnya.', risk: 'Penumpukan sisa metabolisme sampah otot yang memicu delayed onset muscle soreness.', id: '-lu1Nmttz4w' },
  { name: 'Pendinginan (Cool-down)', quote: 'Reg Park: Tenangkan sistem tubuh Anda sebelum meninggalkan area gym agar aliran darah seimbang.', benefit: 'Menurunkan detak jantung secara bertahap menuju normal agar tidak terjadi pooling blood.', risk: 'Pusing mendadak hingga pingsan akibat penurunan tekanan darah instan pasca sesi.', id: 'rH447xP0INg' }
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

  // 🟢 LOGIKA GREETING ASLI RACIKAN SINKRONISASI LU
  const getDynamicGreeting = () => {
    const now = new Date()
    const hrs = now.getHours()
    if (hrs >= 0 && hrs < 4) return "Selamat pagi"
    if (hrs >= 4 && hrs < 8) return "Bangun dan waktunya bersinar"
    if (hrs >= 8 && hrs < 11) return "Selamat beraktivitas"
    if (hrs === 11) return "Selamat siang"
    if (hrs === 12) return "Selamat istirahat"
    if (hrs >= 13 && hrs < 15) return "Selamat siang"
    if (hrs >= 15 && hrs < 18) return "Selamat sore"
    return "Selamat malam"
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // 🛡️ PARSER REFERENSI ASLI LU: Bintang disembunyikan rapi, teks otomatis jadi ungu text-accent font-black
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
    const greetingText = getDynamicGreeting()
    setMessages([
      { 
        sender: 'seolha', 
        text: `${greetingText}, Trainer. Ada yang bisa saya bantu untuk menemani latihan hari ini?`,
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

    // 🟢 LINEAR RENDERING: Mengirim payload individual lengkap per kategori dengan video di bawahnya langsung
    if (isAllCategories) {
      let bulkReply = "Berikut adalah daftar matrix **34 KATEGORI LATIHAN LENGKAP** beserta analisis filosofi tokoh, manfaat, dan risiko kombinasinya, Trainer:\n\n"

      MASTER_34_CATEGORIES.forEach((cat, index) => {
        bulkReply += `${index + 1}. **${cat.name.toUpperCase()}**\n\n`
      })

      const videoPayloads = MASTER_34_CATEGORIES.map(cat => ({
        name: cat.name,
        id: cat.id,
        quote: cat.quote,
        benefit: cat.benefit,
        risk: cat.risk
      }))

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'seolha', 
          text: bulkReply, 
          media: null,
          multiMedia: videoPayloads 
        }])
        setLoading(false)
      }, 800)
      return
    }

    // 🛡️ PERBAIKAN TOTAL FAQ 0 ENERGI: Respon instan tanpa delay validasi external, mengunci ID video valid
    if (isFaq) {
      let faqReply = ''
      let mediaAsset = null
      const lowerText = msgToSend.toLowerCase()

      if (lowerText.includes('mulai dari mana')) {
        faqReply = `Sebagai seorang Trainer, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu.\n\nFokuslah pada latihan beban seluruh tubuh (**Full-Body Workout**) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank sebanyak 3 kali seminggu. Berikut panduan video lokal pilihan Seolha:`
        mediaAsset = { type: 'video', src: 'GY1JhB9BEkk' }
      } 
      else if (lowerText.includes('kardio atau angkat')) {
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, Trainer.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga stamina jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Latihan Kardio.`
        mediaAsset = { type: 'video', src: 'cbKkB3POqaY' }
      }
      else if (lowerText.includes('jenis & cara latihan')) {
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, Trainer.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
        mediaAsset = { type: 'video', src: 'UItWltVZZmE' }
      }
      else if (lowerText.includes('pola makan') || lowerText.includes('nutrisi')) {
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, Trainer.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
        mediaAsset = { type: 'video', src: 'mzpDEPg7-3E' }
      }
      else if (lowerText.includes('pola tidur') || lowerText.includes('recovery')) {
        faqReply = `Ingat ini, Trainer: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
        mediaAsset = { type: 'video', src: '-lu1Nmttz4w' }
      }
      else if (lowerText.includes('kesalahan fatal')) {
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, Trainer:\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Meniru program latihan atlet profesional tanpa fondasi dasar.`
        mediaAsset = { type: 'video', src: 'rH447xP0INg' }
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, media: mediaAsset }])
        setLoading(false)
      }, 600)
      return
    }

    try {
      const cleanInput = msgToSend.toLowerCase()
      const foundMatch = MASTER_34_CATEGORIES.find(cat => cleanInput.includes(cat.name.split(' ')[0].toLowerCase()))

      const formattedHistory = newMessages
        .filter((m) => m.text && typeof m.text === 'string' && !m.text.includes('Gagal mendapatkan respon'))
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
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat. Mohon periksa kembali status API Studio Key Anda.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke server Seolha terputus.', media: null }])
    } finally { 
      setLoading(false) 
    }
  }

  const dayQuoteIndex = new Date().getDate() % LEGENDARY_QUOTES.length
  const todayQuote = LEGENDARY_QUOTES[dayQuoteIndex]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#000000] p-4 max-w-lg mx-auto select-none">
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

            {/* 🟢 LINEAR RENDERING JALUR MATRIX 34 KATEGORI: Konten deskripsi tokoh bersambung iFrame video murni tepat di bawahnya */}
            {m.sender === 'seolha' && m.multiMedia && Array.isArray(m.multiMedia) && (
              <div className="w-[85%] space-y-6 mt-3 max-h-[380px] overflow-y-auto p-3 bg-[#0A0A0E] border border-[#211D2C] rounded-lg">
                {m.multiMedia.map((vid, vIdx) => (
                  <div key={vIdx} className="border-b border-[#211D2C]/60 pb-5 last:border-0 flex flex-col gap-1.5">
                    <div className="font-mono text-xs text-accent font-black uppercase tracking-wider">{vIdx + 1}. {vid.name}</div>
                    <p className="font-body text-xs text-text-dim italic">"{vid.quote}"</p>
                    <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Manfaat:</strong> {vid.benefit}</p>
                    <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Risiko Ekstrem:</strong> {vid.risk}</p>
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
              Seolha sedang berpikir...
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
