import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Clock, Volume2, VolumeX } from 'lucide-react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

const ScrollbarStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .main-chat-container::-webkit-scrollbar { width: 6px !important; background: #100E16 !important; }
    .main-chat-container::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 4px !important; }
    .main-chat-container { scrollbar-width: thin !important; scrollbar-color: #7C5CFF #100E16 !important; }
    .faq-slider-container::-webkit-scrollbar { height: 6px !important; background: #100E16 !important; display: block !important; }
    .faq-slider-container::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 4px !important; }
    .faq-slider-container { scrollbar-width: thin !important; scrollbar-color: #7C5CFF #100E16 !important; overflow-x: auto !important; }
    .matrix-dropdown-container::-webkit-scrollbar { width: 6px !important; background: #100E16 !important; }
    .matrix-dropdown-container::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 4px !important; }
    .matrix-dropdown-container { scrollbar-width: thin !important; scrollbar-color: #7C5CFF #100E16 !important; }
  `}} />
)

const MASTER_34_CATEGORIES = [
  { name: 'Pemanasan (Warm-up)', tokoh_terkenal: 'Arnold Schwarzenegger: Otot yang dingin adalah otot yang rapuh. Pompa darah sebelum mengangkat besi beban berat.', apa_itu: 'Sesi latihan intensitas rendah di awal untuk meningkatkan suhu tubuh dan menyiapkan otot sebelum masuk ke latihan inti.', manfaatnya: 'Meningkatkan sirkulasi aliran darah ke seluruh tubuh, melumasi mobilitas sendi-sendi utama, serta mencegah kram mendadak.', tata_cara_atau_gerakan: 'Lakukan gerakan dinamis seperti arm circles (memutar lengan), leg swings (mengayun kaki), dan lunges tanpa beban selama 5-10 menit.', id_video: 'mUD2u-YVn7A' },
  { name: 'Push Up', tokoh_terkenal: 'Ade Rai: Otot dada, bahu, dan tricep dibangun dari dorongan beban tubuh yang konstan dan terkontrol.', apa_itu: 'Latihan beban tubuh (calisthenics) posisi telungkup fungsional dengan cara mendorong bobot badan ke atas menggunakan kekuatan lengan.', manfaatnya: 'Membangun kekuatan dan volume otot dada (pectoralis), deltoid bagian depan (bahu), dan otot lengan belakang (triceps).', tata_cara_atau_gerakan: 'Posisikan tubuh lurus seperti plank, turunkan dada secara perlahan hingga hampir menyentuh lantai dengan siku membentuk sudut 45 derajat, lalu dorong kuat kembali ke atas.', id_video: 'VZUDAOL2LI8' },
  { name: 'Squat', tokoh_terkenal: 'Tom Platz: Batas bawah squat adalah tempat di mana karakter mental asli seorang pria diuji.', apa_itu: 'Latihan compound tubuh bagian bawah yang meniru gerakan fundamental manusia saat hendak duduk dan berdiri kembali.', manfaatnya: 'Memperkuat rantai kekuatan otot paha depan (quadriceps), paha belakang (hamstring), bokong (glutes), serta melatih kekuatan tulang punggung.', tata_cara_atau_gerakan: 'Buka kaki selebar bahu, turunkan pinggul ke bawah dan ke belakang seolah hendak duduk hingga paha sejajar lantai, pastikan lutut tidak maju melebihi ujung jari kaki, lalu berdiri tegak kembali.', id_video: 'Xb2Lm40nlGo' },
  { name: 'Plank', tokoh_terkenal: 'David Goggins: Mengunci core dalam plank adalah perang statis melawan rasa ingin menyerah di dalam otak.', apa_itu: 'Latihan kekuatan isometrik statis yang mengharuskan Anda menahan satu posisi tubuh garis lurus dalam durasi waktu tertentu.', manfaatnya: 'Mengunci stabilitas seluruh dinding otot perut (core), memperkuat otot panggul bawah, serta memperbaiki postur tubuh bungkuk.', tata_cara_atau_gerakan: 'Tumpu bobot badan Anda pada kedua siku lengan bawah dan ujung jari kaki di atas matras, kunci otot perut dan bokong sekencang mungkin, pastikan posisi pinggul tidak naik atau merosot.', id_video: 'Gr1GtwTp_ko' },
  { name: 'Lunges', tokoh_terkenal: 'Ronnie Coleman: Angkatan unilateral membentuk keseimbangan kaki yang kokoh untuk menopang beban raksasa.', apa_itu: 'Latihan unilateral tubuh bagian bawah yang berfokus pada pelatihan satu kaki secara mandiri bergantian kaki kaki kiri dan kanan.', manfaatnya: 'Memperbaiki ketidakseimbangan kekuatan kaki kiri-kanan, meningkatkan stabilitas koordinasi tubuh, serta melatih fleksibilitas otot panggul.', tata_cara_atau_gerakan: 'Langkahkan kaki kanan jauh ke depan, turunkan lutut kaki kiri belakang hingga hampir menyentuh lantai dan membentuk sudut 90 derajat pada kedua kaki, dorong tumit depan untuk kembali ke posisi awal.', id_video: 'AJUh03WB8F4' },
  { name: 'Meditasi', tokoh_terkenal: 'Bruce Lee: Kosongkan pikiranmu, jadilah tanpa bentuk seperti air. Tenang di dalam badai latihan.', apa_itu: 'Praktik relaksasi mental terarah untuk melatih fokus pikiran, kedalaman pernapasan, dan memicu ketenangan sistem saraf.', manfaatnya: 'Menurunkan hormon stres (kortisol) dengan cepat pasca latihan berat, menenangkan detak jantung, dan mempertajam fokus mind-muscle connection.', tata_cara_atau_gerakan: 'Duduk bersila dengan punggung tegak namun rileks, pejamkan mata Anda, atur ritme napas dalam lewat hidung, dan pusatkan perhatian penuh hanya pada hembusan napas Anda.', id_video: '2sJyBfDZpe4' },
  { name: 'Pola Tidur (Rest)', tokoh_terkenal: 'Dorian Yates: Otot tidak tumbuh di gym. Otot Anda tumbuh saat tidur pulas di dalam kegelapan kamar.', apa_itu: 'Fase pemulihan pasif total di mana tubuh melakukan perbaikan makro terhadap jaringan sel otot yang robek selama latihan fisik.', manfaatnya: 'Memicu pelepasan Hormon Pertumbuhan Manusia (HGH) secara alami, mempercepat pemulihan energi seluler, dan menghentikan katabolisme (penyusutan otot).', tata_cara_atau_gerakan: 'Matikan seluruh lampu kamar dan gadget 30 menit sebelum tidur, pastikan Anda mendapatkan tidur malam berkualitas tanpa interupsi selama 7 hingga 8 jam penuh.', id_video: '-dCHrqndWYs' },
  { name: 'Kardio / HIIT', tokoh_terkenal: 'Chris Bumstead: Jantung yang kuat memompa nutrisi lebih cepat ke sel-sel otot yang sedang robek.', apa_itu: 'Latihan kardiovaskular intensitas tinggi yang dikombinasikan dengan periode istirahat singkat secara berulang-ulang.', manfaatnya: 'Meningkatan kapasitas stamina fungsional (VO2 Max), mempercepat pembakaran deposit kalori/lemak tubuh, dan menyehatkan pembuluh darah.', tata_cara_atau_gerakan: 'Lakukan gerakan eksplosif seperti jumping jacks atau burpees selama 30 detik sekuat tenaga, disusul dengan istirahat pasif selama 15 detik, ulangi sirkuit ini sebanyak 4-5 siklus.', id_video: 'cbKkB3POqaY' }
]

function CategoryItem({ cat, index }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-[#211D2C]/40 pb-3 last:border-0">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full text-left font-mono text-xs text-accent font-black uppercase tracking-wider flex justify-between items-center py-1.5 hover:text-purple-400 transition-colors">
        <span>{index + 1}. {cat.name} <span className="text-text-dim font-normal normal-case ml-1">[silakan klik penjelasan dan videonya]</span></span>
        <span className="text-text-dim text-[10px]">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-2 pl-2.5 space-y-2 border-l border-[#7C5CFF]/40">
          <p className="font-body text-xs text-text-dim italic">"{cat.tokoh_terkenal}"</p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">{cat.name}:</strong> {cat.apa_itu}</p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Manfaatnya:</strong> {cat.manfaatnya}</p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed"><strong className="text-accent font-black">Tata Cara / Gerakan:</strong> {cat.tata_cara_atau_gerakan}</p>
          <div className="w-full mt-2 p-1 bg-[#100E16] border border-[#211D2C] rounded-lg overflow-hidden aspect-video">
            <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${cat.id_video}?playsinline=1&enablejsapi=1&rel=0`} title={cat.name} frameBorder="0" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanionAI({ userStats, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [liveTime, setLiveTime] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const messagesEndRef = useRef(null)

  const canvasContainerRef = useRef(null)
  const modelRef = useRef(null)
  const isTalkingRef = useRef(false)

  const activeUserName = userStats?.name || 'Hunter'
  const userStatsWithDynamicName = { ...userStats, name: activeUserName }
  const currentTier = getRankTier(userStats?.level || 1)
  
  const getDynamicGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs >= 0 && hrs < 4) return "Selamat pagi"
    if (hrs >= 4 && hrs < 8) return "Bangun dan waktunya bersinar"
    if (hrs >= 8 && hrs < 11) return "Selamat beraktivitas"
    if (hrs === 11 || hrs === 12 || hrs >= 13 && hrs < 15) return "Selamat siang"
    if (hrs >= 15 && hrs < 18) return "Selamat sore"
    return "Selamat malam"
  }

  useEffect(() => {
    if (!canvasContainerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#100E16')

    const width = canvasContainerRef.current.clientWidth
    const height = canvasContainerRef.current.clientHeight
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    
    // Settingan jarak pandang portrait universal yang pas buat model ReadyPlayerMe lokal
    camera.position.set(0, 1.45, 1.1)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    canvasContainerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight('#ffffff', 1.0)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight('#7C5CFF', 1.5)
    directionalLight.position.set(2, 4, 5)
    scene.add(directionalLight)

    const loader = new GLTFLoader()
    loader.load(
      '/uploads_files_6103604_C_SwordJKv2.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(0, 0, 0)
        
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        
        // Posisikan pivot tepat di tengah dada/wajah karakter cewek baru
        model.position.y = -center.y + (size.y / 6)

        scene.add(model)
        modelRef.current = model
      },
      undefined,
      (error) => { console.error('Gagal memuat model 3D Seolha:', error) }
    )

    let clock = new THREE.Clock()
    let animationId

    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      if (modelRef.current) {
        if (isTalkingRef.current) {
          modelRef.current.rotation.y = Math.sin(elapsedTime * 4) * 0.04
          modelRef.current.position.y += Math.sin(elapsedTime * 8) * 0.0005
        } else {
          modelRef.current.rotation.y = Math.sin(elapsedTime * 1.2) * 0.015
          modelRef.current.position.y += Math.sin(elapsedTime * 1.5) * 0.0001
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!canvasContainerRef.current) return
      const w = canvasContainerRef.current.clientWidth
      const h = canvasContainerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      if (canvasContainerRef.current && renderer.domElement) {
        canvasContainerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLiveTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const renderMessageText = (text) => {
    if (!text) return null
    return text.split('\n').map((line, idx) => {
      let processedLine = line
      
      const cleanRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
      const parts = []
      let lastIndex = 0
      let match
      const isBullet = line.trim().startsWith('* ')
      if (isBullet) processedLine = line.trim().substring(2)
      
      while ((match = cleanRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(...highlightNameInText(processedLine.substring(lastIndex, match.index)))
        }
        const boldText = match[1] || match[2]
        parts.push(<strong key={`bold-${match.index}`} className="text-accent font-black">{boldText}</strong>)
        lastIndex = cleanRegex.lastIndex
      }
      if (lastIndex < processedLine.length) {
        parts.push(...highlightNameInText(processedLine.substring(lastIndex)))
      }
      
      const content = parts.length > 0 ? parts : highlightNameInText(processedLine)
      
      if (isBullet) return <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]"><span className="text-accent text-xs mt-1.5">•</span><div className="flex-1 whitespace-pre-wrap leading-relaxed">{content}</div></div>
      return <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">{content}</p>
    })
  }

  const highlightNameInText = (textStr) => {
    if (typeof textStr !== 'string') return [textStr]
    if (!activeUserName || activeUserName === 'Hunter') return [textStr]
    
    const nameRegex = new RegExp(`\\b(${activeUserName})\\b`, 'gi')
    const finalParts = []
    let cursor = 0
    let nMatch
    
    while ((nMatch = nameRegex.exec(textStr)) !== null) {
      if (nMatch.index > cursor) finalParts.push(textStr.substring(cursor, nMatch.index))
      finalParts.push(<strong key={`name-${nMatch.index}`} className="text-accent font-black">{nMatch[1]}</strong>)
      cursor = nameRegex.lastIndex
    }
    if (cursor < textStr.length) finalParts.push(textStr.substring(cursor))
    return finalParts.length > 0 ? finalParts : [textStr]
  }

  const getTodayDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const speakText = (text) => {
    if (isMuted) return
    window.speechSynthesis.cancel()
    
    const cleanText = text.replace(/[*#_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'id-ID'
    utterance.rate = 1.05

    utterance.onstart = () => { isTalkingRef.current = true }
    utterance.onend = () => { isTalkingRef.current = false }
    utterance.onerror = () => { isTalkingRef.current = false }

    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const greetingText = getDynamicGreeting()
    const msg = `${greetingText}, ${activeUserName}. Seolha siap mendampingi latihan harian Anda hari ini. Ada target kasta RPG fisik yang ingin kita tembus bersama?`
    setMessages([{ sender: 'seolha', text: msg, mediaSources: null }])
    fetchDailyLimit()
    
    setTimeout(() => { speakText(msg) }, 600)
    return () => window.speechSynthesis.cancel()
  }, [currentTier, activeUserName])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (loading) isTalkingRef.current = true
  }, [loading])

  const fetchDailyLimit = async () => {
    try {
      const today = getTodayDateStr()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('ai_usage').select('count').eq('user_id', session.user.id).eq('date', today).single()
      if (data) setDailyCount(data.count)
    } catch (e) { console.error(e) }
  }

  const handleSend = async (e, customMsg = null, isFaq = false, isAllCategories = false) => {
    if (e) e.preventDefault()
    const msgToSend = customMsg || input
    if (!msgToSend.trim() || loading) return
    
    if (!isFaq && dailyCount >= 5) {
      const failMsg = `Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya, ${activeUserName}!`
      setMessages(prev => [...prev, { sender: 'user', text: msgToSend }, { sender: 'seolha', text: failMsg, mediaSources: null }])
      speakText(failMsg)
      if (!customMsg) setInput('')
      return
    }

    const newMessages = [...messages, { sender: 'user', text: msgToSend }]
    if (!customMsg) setInput('')
    setMessages(newMessages)
    setLoading(true)

    if (isAllCategories) {
      setTimeout(() => {
        const textCat = "Berikut adalah daftar matrix **34 KATEGORI LATIHAN LENGKAP**. Silakan klik tiap kategori untuk memuat video panduan dan penjelasannya:"
        setMessages(prev => [...prev, { sender: 'seolha', text: textCat, mediaSources: null, multiMedia: MASTER_34_CATEGORIES }])
        setLoading(false)
        speakText("Berikut adalah daftar matriks tiga puluh empat kategori latihan lengkap.")
      }, 600)
      return
    }

    if (isFaq) {
      let faqReply = ''
      let multiVideos = null
      const lowerText = msgToSend.toLowerCase()

      if (lowerText.includes('mulai dari mana')) {
        multiVideos = ['rN92rbUoQDE', 'vbJxymW5xj0']
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu, ${activeUserName}.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank sebanyak 3 kali seminggu. Berikut panduan video lokal pilihan Seolha:`
      } 
      else if (lowerText.includes('kardio atau angkat')) {
        multiVideos = ['2MoGxae-zyo', 'GY1JhB9BEkk']
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, ${activeUserName}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga stamina jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Kardio.`
      }
      else if (lowerText.includes('jenis & cara') || lowerText.includes('cara & jenis') || lowerText.includes('jenis latihan')) {
        multiVideos = ['UItWltVZZmE']
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, ${activeUserName}.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
      }
      else if (lowerText.includes('pola makan') || lowerText.includes('nutrisi')) {
        multiVideos = ['mzpDEPg7-3E']
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, ${activeUserName}.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
      }
      else if (lowerText.includes('pola tidur') || lowerText.includes('recovery')) {
        multiVideos = ['-lu1Nmttz4w']
        faqReply = `Ingat ini, ${activeUserName}: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
      }
      else if (lowerText.includes('kesalahan fatal')) {
        multiVideos = ['HtzSj0FEogk']
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, ${activeUserName}.\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Meniru program latihan atlet profesional tanpa fondasi dasar.`
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, mediaSources: multiVideos }])
        setLoading(false)
        speakText(faqReply)
      }, 500)
      return
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.filter(m => m.text && !m.text.includes('Gagal mendapatkan respon')).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })), 
          userStats: userStatsWithDynamicName 
        })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada progres lain yang mau kita diskusikan?'
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: null }])
        setDailyCount(prev => prev + 1)
        speakText(replyText)
      } else {
        const errData = await response.json().catch(() => ({}))
        const serverError = errData.error || 'Mohon periksa kembali status API Studio Key Anda.'
        const failText = `Gagal mendapatkan respon dari engine chat. (Detail: ${serverError})`
        setMessages(prev => [...prev, { sender: 'seolha', text: failText, media: null }])
        speakText("Sistem eror, mohon periksa kembali API key Anda.")
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke server Seolha terputus.', media: null }])
    } finally { 
      setLoading(false) 
    }
  }

  const handleToggleMute = () => {
    if (!isMuted) window.speechSynthesis.cancel()
    setIsMuted(!isMuted)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#000000] p-4 max-w-lg mx-auto select-none">
      <ScrollbarStyles />
      
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">Live VTuber Stream</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs text-text-high bg-[#100E16] px-2 py-0.5 border border-[#211D2C]">
            <Clock size={11} className="text-accent" />
            <span>{liveTime || '00:00'}</span>
          </div>
          <button onClick={handleToggleMute} className="p-1.5 hover:bg-border-hover rounded text-accent transition-colors">
            {isMuted ? <VolumeX size={15} className="text-text-dim" /> : <Volume2 size={15} />}
          </button>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-text-high bg-[#100E16] border border-[#7C5CFF]/30 px-2 py-1 rounded">
            <span>{5 - dailyCount}/5 Energi</span>
          </div>
          <div className="w-[1px] h-4 bg-[#211D2C]" />
          <button onClick={onClose} className="p-1 hover:bg-border-hover rounded text-text-dim transition-colors"><X size={18} /></button>
        </div>
      </div>

      <div className="mt-2.5 w-full bg-[#100E16] border border-[#211D2C] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(124,92,255,0.1)] flex flex-col">
        <div ref={canvasContainerRef} className="w-full aspect-[4/3] bg-[#100E16]" />
      </div>

      <div className="main-chat-container flex-1 overflow-y-auto py-3 space-y-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 font-body text-sm leading-relaxed ${m.sender === 'user' ? 'bg-accent text-white rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'bg-[#100E16] border border-[#211D2C] text-[#EDEAF6] rounded-tl-xl rounded-tr-xl rounded-br-xl'}`}>
              {m.sender === 'seolha' && <div className="font-mono text-[10px] text-accent font-bold uppercase mb-1 flex items-center gap-1"><Bot size={10} /> SEOLHA</div>}
              <div className="flex flex-col">{m.sender === 'seolha' ? renderMessageText(m.text) : <p className="whitespace-pre-wrap">{m.text}</p>}</div>
            </div>
            
            {m.sender === 'seolha' && m.mediaSources && Array.isArray(m.mediaSources) && (
              <div className="w-[85%] mt-2 space-y-3">
                {m.mediaSources.map((srcId, sIdx) => (
                  <div key={sIdx} className="w-full p-1 bg-[#100E16] border border-[#211D2C] rounded-lg shadow-xl overflow-hidden aspect-video">
                    <iframe className="w-full h-full rounded" src={`https://www.youtube.com/embed/${srcId}?playsinline=1&enablejsapi=1&rel=0`} title={`FAQ Video Guide ${sIdx}`} frameBorder="0" allowFullScreen />
                  </div>
                ))}
              </div>
            )}

            {m.sender === 'seolha' && m.multiMedia && Array.isArray(m.multiMedia) && (
              <div className="matrix-dropdown-container w-[85%] space-y-4 mt-3 max-h-[380px] overflow-y-auto p-3 bg-[#0A0A0E] border border-[#211D2C] rounded-lg">
                {m.multiMedia.map((vid, vIdx) => <CategoryItem key={vIdx} cat={vid} index={vIdx} />)}
              </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-[#100E16] border border-[#7CFF00]/0 p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-accent font-black tracking-wider shadow-[0_0_10px_rgba(124,92,255,0.1)]">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
              SEOLHA SEDANG BERPIKIR...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mb-2 bg-background pt-1.5">
        <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mb-1.5">FAQ — 0 ENERGI</div>
        <div className="faq-slider-container flex gap-2 overflow-x-auto pb-2 flex-nowrap" style={{ WebkitOverflowScrolling: 'touch' }}>
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
