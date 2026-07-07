import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Quote, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { getRankTier } from '../lib/expSystem'

const ScrollbarStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .faq-slider-container::-webkit-scrollbar { height: 4px !important; background: #100E16 !important; }
    .faq-slider-container::-webkit-scrollbar-thumb { background: #7C5CFF !important; border-radius: 2px !important; }
    .matrix-dropdown-container::-webkit-scrollbar { width: 4px !important; background: #0A0A0E !important; }
    .matrix-dropdown-container::-webkit-scrollbar-thumb { background: #211D2C !important; border-radius: 2px !important; }
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

const MASTER_34_CATEGORIES = [
  {
    name: 'Pemanasan (Warm-up)',
    tokoh_terkenal: 'Arnold Schwarzenegger: Otot yang dingin adalah otot yang rapuh. Pompa darah sebelum mengangkat besi beban berat.',
    apa_itu: 'Sesi latihan intensitas rendah di awal untuk meningkatkan suhu tubuh dan menyiapkan otot sebelum masuk ke latihan inti.',
    manfaatnya: 'Meningkatkan sirkulasi aliran darah ke seluruh tubuh, melumasi mobilitas sendi-sendi utama, serta mencegah kram mendadak.',
    tata_cara_atau_gerakan: 'Lakukan gerakan dinamis seperti arm circles (memutar lengan), leg swings (mengayun kaki), dan lunges tanpa beban selama 5-10 menit.',
    id_video: 'mUD2u-YVn7A'
  },
  {
    name: 'Push Up',
    tokoh_terkenal: 'Ade Rai: Otot dada, bahu, and tricep dibangun dari dorongan beban tubuh yang konstan dan terkontrol.',
    apa_itu: 'Latihan beban tubuh (calisthenics) posisi telungkup fungsional dengan cara mendorong bobot badan ke atas menggunakan kekuatan lengan.',
    manfaatnya: 'Membangun kekuatan dan volume otot dada (pectoralis), deltoid bagian depan (bahu), dan otot lengan belakang (triceps).',
    tata_cara_atau_gerakan: 'Posisikan tubuh lurus seperti plank, turunkan dada secara perlahan hingga hampir menyentuh lantai dengan siku membentuk sudut 45 derajat, lalu dorong kuat kembali ke atas.',
    id_video: 'VZUDAOL2LI8'
  },
  {
    name: 'Squat',
    tokoh_terkenal: 'Tom Platz: Batas bawah squat adalah tempat di mana karakter mental asli seorang pria diuji.',
    apa_itu: 'Latihan compound tubuh bagian bawah yang meniru gerakan fundamental manusia saat hendak duduk dan berdiri kembali.',
    manfaatnya: 'Memperkuat rantai kekuatan otot paha depan (quadriceps), paha belakang (hamstring), bokong (glutes), serta melatih kekuatan tulang punggung.',
    tata_cara_atau_gerakan: 'Buka kaki selebar bahu, turunkan pinggul ke bawah dan ke belakang seolah hendak duduk hingga paha sejajar lantai, pastikan lutut tidak maju melebihi ujung jari kaki, lalu berdiri tegak kembali.',
    id_video: 'Xb2Lm40nlGo'
  },
  {
    name: 'Plank',
    tokoh_terkenal: 'David Goggins: Mengunci core dalam plank adalah perang statis melawan rasa ingin menyerah di dalam otak.',
    apa_itu: 'Latihan kekuatan isometrik statis yang mengharuskan Anda menahan satu posisi tubuh garis lurus dalam durasi waktu tertentu.',
    manfaatnya: 'Mengunci stabilitas seluruh dinding otot perut (core), memperkuat otot panggul bawah, serta memperbaiki postur tubuh bungkuk.',
    tata_cara_atau_gerakan: 'Tumpu bobot badan Anda pada kedua siku lengan bawah dan ujung jari kaki di atas matras, kunci otot perut dan bokong sekencang mungkin, pastikan posisi pinggul tidak naik atau merosot.',
    id_video: 'Gr1GtwTp_ko'
  },
  {
    name: 'Lunges',
    tokoh_terkenal: 'Ronnie Coleman: Angkatan unilateral membentuk keseimbangan kaki yang kokoh untuk menopang beban raksasa.',
    apa_itu: 'Latihan unilateral tubuh bagian bawah yang berfokus pada pelatihan satu kaki secara mandiri bergantian kaki kiri dan kanan.',
    manfaatnya: 'Memperbaiki ketidakseimbangan kekuatan kaki kiri-kanan, meningkatkan stabilitas koordinasi tubuh, serta melatih fleksibilitas otot panggul.',
    tata_cara_atau_gerakan: 'Langkahkan kaki kanan jauh ke depan, turunkan lutut kaki kiri belakang hingga hampir menyentuh lantai dan membentuk sudut 90 derajat pada kedua kaki, dorong tumit depan untuk kembali ke posisi awal.',
    id_video: 'AJUh03WB8F4'
  },
  {
    name: 'Meditasi',
    tokoh_terkenal: 'Bruce Lee: Kosongkan pikiranmu, jadilah tanpa bentuk seperti air. Tenang di dalam badai latihan.',
    apa_itu: 'Praktik relaksasi mental terarah untuk melatih fokus pikiran, kedalaman pernapasan, dan memicu ketenangan sistem saraf.',
    manfaatnya: 'Menurunkan hormon stres (kortisol) dengan cepat pasca latihan berat, menenangkan detak jantung, dan mempertajam fokus mind-muscle connection.',
    tata_cara_atau_gerakan: 'Duduk bersila dengan punggung tegak namun rileks, pejamkan mata Anda, atur ritme napas dalam lewat hidung, dan pusatkan perhatian penuh hanya pada hembusan napas Anda.',
    id_video: '2sJyBfDZpe4'
  },
  {
    name: 'Pola Tidur (Rest)',
    tokoh_terkenal: 'Dorian Yates: Otot tidak tumbuh di gym. Otot Anda tumbuh saat tidur pulas di dalam kegelapan kamar.',
    apa_itu: 'Fase pemulihan pasif total di mana tubuh melakukan perbaikan makro terhadap jaringan sel otot yang robek selama latihan fisik.',
    manfaatnya: 'Memicu pelepasan Hormon Pertumbuhan Manusia (HGH) secara alami, mempercepat pemulihan energi seluler, dan menghentikan katabolisme (penyusutan otot).',
    tata_cara_atau_gerakan: 'Matikan seluruh lampu kamar dan gadget 30 menit sebelum tidur, pastikan Anda mendapatkan tidur malam berkualitas tanpa interupsi selama 7 hingga 8 jam penuh.',
    id_video: '-dCHrqndWYs'
  },
  {
    name: 'Kardio / HIIT',
    tokoh_terkenal: 'Chris Bumstead: Jantung yang kuat memompa nutrisi lebih cepat ke sel-sel otot yang sedang robek.',
    apa_itu: 'Latihan kardiovaskular intensitas tinggi yang dikombinasikan dengan periode istirahat singkat secara berulang-ulang.',
    manfaatnya: 'Meningkatkan kapasitas stamina fungsional (VO2 Max), mempercepat pembakaran deposit kalori/lemak tubuh, dan menyehatkan pembuluh darah.',
    tata_cara_atau_gerakan: 'Lakukan gerakan eksplosif seperti jumping jacks atau burpees selama 30 detik sekuat tenaga, disusul dengan istirahat pasif selama 15 detik, ulangi sirkuit ini sebanyak 4-5 siklus.',
    id_video: 'cbKkB3POqaY'
  },
  {
    name: 'Pull Up',
    tokoh_terkenal: 'Jay Cutler: Lebar punggung V-Taper ditentukan dari seberapa sering Anda menarik dagu melewati palang.',
    apa_itu: 'Latihan kekuatan tubuh bagian atas (upper body pull) menggunakan palang horizontal tinggi untuk mengangkat seluruh bobot tubuh.',
    manfaatnya: 'Membangun lebar sayap punggung (latissimus dorsi), memperkuat otot belikat (rhomboids), serta melatih kekuatan genggaman tangan (forearms).',
    tata_cara_atau_gerakan: 'Genggam palang pull-up sedikit lebih lebar dari bahu, gantungkan tubuh, tarik badan Anda ke atas menggunakan otot punggung hingga dada mendekati bar dan dagu melewati palang, turunkan perlahan.',
    id_video: 'DXL18E7QRbk'
  },
  {
    name: 'Leg Day (Kaki)',
    tokoh_terkenal: 'Branch Warren: Jangan pernah melewati latihan kaki, karena dari sanalah pondasi testosteron tubuh Anda berasal.',
    apa_itu: 'Sesi latihan angkat beban komprehensif yang didedikasikan penuh untuk memicu perkembangan seluruh kelompok otot tubuh bawah.',
    manfaatnya: 'Memicu lonjakan hormon anabolik alami tubuh (seperti testosteron) yang krusial untuk mempercepat laju pertumbuhan seluruh otot tubuh Anda.',
    tata_cara_atau_gerakan: 'Gabungkan gerakan dasar beban berat seperti Barbell Squat, dilanjutkan dengan mesin isolasi seperti Leg Press, Leg Extension, dan Seated Calf Raises.',
    id_video: 'QXtXEug0PLU'
  },
  {
    name: 'Upper Body',
    tokoh_terkenal: 'Phil Heath: Keseimbangan visual tubuh atas membutuhkan detail kontraksi penuh di setiap sudut repetisi.',
    apa_itu: 'Sesi latihan gabungan terpadu yang menargetkan seluruh arsitektur kelompok otot di atas garis pinggang.',
    manfaatnya: 'Membentuk postur tubuh bagian atas yang simetris, berdimensi tegap, serta meningkatkan kapasitas kekuatan dorong dan tarik.',
    tata_cara_atau_gerakan: 'Susun variasi menu latihan bangku (Bench Press), tarikan punggung (Lat Pulldown), dan dorongan bahu (Overhead Dumbbell Press) secara berurutan dalam satu hari latihan.',
    id_video: '0zhvUV1bAVQ'
  },
  {
    name: 'Lower Body',
    tokoh_terkenal: 'Kai Greene: Hubungkan pikiranmu dengan serat otot kaki, rasakan setiap tekanan beban mengoyak seratnya.',
    apa_itu: 'Program latihan terfokus khusus untuk membangun kekuatan struktural paha, bokong, pinggul, dan betis.',
    manfaatnya: 'Memperkuat densitas (kepadatan) tulang kaki penopang tubuh utama serta menjaga stabilitas gerak atletik harian.',
    tata_cara_atau_gerakan: 'Fokus pada latihan pola gerakan engsel panggul dan dorongan kaki seperti Romanian Deadlifts, Goblet Squats, dan Glute Bridges menggunakan beban tambahan.',
    id_video: 'UEWEYeJGkLM'
  },
  {
    name: 'Full Body Workout',
    tokoh_terkenal: 'Mike Mentzer: Intensitas tinggi dalam waktu singkat merangsang seluruh serat otot untuk berkembang maksimal.',
    apa_itu: 'Metode latihan efisien tinggi yang merangsang seluruh kelompok otot besar tubuh dalam satu sesi tunggal.',
    manfaatnya: 'Sangat menghemat waktu latihan harian, mengoptimalkan metabolisme pembakaran kalori total, dan melatih kebugaran tubuh secara menyeluruh.',
    tata_cara_atau_gerakan: 'Pilih satu gerakan compound utama untuk setiap bagian tubuh: Squat (kaki), Incline Bench Press (dada), dan Barbell Row (punggung), lakukan sebanyak 3-4 set masing-masing.',
    id_video: 'GViX8riaHX4'
  },
  {
    name: 'Olympic Lifting',
    tokoh_terkenal: 'Lu Xiaojun: Kekuatan tanpa kecepatan tidak akan bisa menempatkan barbel raksasa di atas kepala Anda.',
    apa_itu: 'Cabang olahraga angkat besi kompetitif teknis tinggi yang berfokus pada perpindahan beban dari lantai ke atas kepala dengan daya ledak.',
    manfaatnya: 'Mengembangkan daya ledak (explosive power) eksponensial otot, koordinasi saraf-otot, dan mobilitas fungsional sendi tingkat lanjut.',
    tata_cara_atau_gerakan: 'Pelajari fase penarikan barbel dari lantai (first pull), fase akselerasi pinggul (triple extension), hingga fase menangkap barbel di atas kepala pada gerakan Snatch dan Clean & Jerk.',
    id_video: 'VMaBfcRprAU'
  },
  {
    name: 'Boxing / Combat',
    tokoh_terkenal: 'Mike Tyson: Semua orang punya rencana sampai sebuah pukulan telak mendarat di mulut mereka.',
    apa_itu: 'Latihan seni bela diri berbasis pukulan pukulan presisi dan pergerakan kaki taktis untuk pengkondisian fisik.',
    manfaatnya: 'Melatih refleks instan sistem saraf, ketangkasan gerak kaki (footwork), koordinasi mata-tangan, serta membakar kalori dalam jumlah masif.',
    tata_cara_atau_gerakan: 'Lakukan kombinasi pukulan fundamental: Jab, Cross, Hook, dan Upper-cut dipadukan dengan gerakan menghindar (weaving) di depan samsak atau cermin (shadow boxing).',
    id_video: '3u6lojo40a8'
  },
  {
    name: 'Sport-Specific Training',
    tokoh_terkenal: 'Lee Haney: Jadilah spesialis di bidang Anda, latih mekanika gerak sendi secara presisi tanpa celah.',
    apa_itu: 'Program pengkondisian fisik yang dirancang secara khusus untuk mendukung kebutuhan mekanik gerakan satu cabang olahraga tertentu.',
    manfaatnya: 'Meningkatkan performa tanding secara spesifik pada cabang olahraga yang ditekuni dan meminimalkan risiko cedera akibat gerakan berulang.',
    tata_cara_atau_gerakan: 'Analisis gerakan dominan olahraga Anda (misal gerakan melompat untuk basket), lalu latih kekuatan otot penggeraknya menggunakan beban bebas (seperti Trap Bar Deadlift untuk lompatan).',
    id_video: 'Mo6B5EjfHGU'
  },
  {
    name: 'Martial Arts',
    tokoh_terkenal: 'Ip Man: Latihan bukan untuk pamer kekuatan, melainkan untuk menaklukkan ego diri sendiri di atas matras.',
    apa_itu: 'Sistem latihan fisik bela diri terstruktur yang mencakup teknik kuncian, tendangan, pertahanan diri, dan disiplin mental.',
    manfaatnya: 'Meningkatkan fleksibilitas dinamis otot tubuh, keseimbangan postur, serta membentuk pertahanan diri taktis yang responsif.',
    tata_cara_atau_gerakan: 'Latih posisi kuda-kuda dasar yang kokoh, transisi perpindahan berat badan saat menangkis, serta eksekusi tendangan depan secara berulang dengan form yang benar.',
    id_video: 'bs7X3F-XYTc'
  },
  {
    name: 'Core/Abs Isolation',
    tokoh_terkenal: 'Sergi Constance: Otot perut dikeraskan di ruang latihan lewat core compression dan dikunci rapat.',
    apa_itu: 'Latihan isolasi terfokus yang menargetkan kelompok otot perut bagian depan (six pack) dan otot perut samping (obliques).',
    manfaatnya: 'Membentuk estetika otot perut yang kering dan tajam, serta menstabilkan rongga perut tengah untuk menahan angkatan compound berat.',
    tata_cara_atau_gerakan: 'Lakukan gerakan fleksi perut seperti Hanging Leg Raises (mengangkat kaki menggantung), Cable Crunch, dan Russian Twist menggunakan plate beban ringan.',
    id_video: 'Cnmy08JgakM'
  },
  {
    name: 'Powerlifting',
    tokoh_terkenal: 'Eddie Hall: Ketika beban terasa ingin meremukkan tulangmu, di sanalah kekuatan mental sejatimu bekerja.',
    apa_itu: 'Cabang olahraga kekuatan absolut yang berfokus pada upaya mengangkat beban seberat mungkin dalam satu repetisi maksimal (1RM).',
    manfaatnya: 'Memaksimalkan batas kekuatan absolut sistem saraf dan otot pada tiga gerakan fundamental utama: Squat, Bench Press, dan Deadlift.',
    tata_cara_atau_gerakan: 'Gunakan program latihan berbasis persentase beban berat (rentang 1-5 repetisi per set) dengan fokus pada teknik angkatan mati (Deadlift) konvensional atau sumo dari lantai.',
    id_video: 'JBJqZKx7MLI'
  },
  {
    name: 'Calisthenics',
    tokoh_terkenal: 'Hannibal For King: Batasan fisikmu adalah ilusi yang diciptakan oleh otakmu sendiri. Tarik tubuhmu.',
    apa_itu: 'Sistem latihan kekuatan yang murni memanfaatkan berat badan sendiri sebagai media resistensi utama tanpa menggunakan mesin gym.',
    manfaatnya: 'Membentuk massa otot yang kering (lean muscle), meningkatkan kontrol penuh tubuh terhadap gravitasi, dan menguatkan jaringan ikat sendi.',
    tata_cara_atau_gerakan: 'Latih gerakan fundamental tingkat lanjut pada palang besi atau parallette bars seperti Chest-to-Bar Pull Ups, Parallel Dips, dan senam lantai L-Sit.',
    id_video: 'kuUZYUBHryw'
  },
  {
    name: 'Kettlebell Flow',
    tokoh_terkenal: 'Pavel Tsatsouline: Ayunan kettlebell adalah jembatan utama yang menghubungkan kekuatan dengan ketahanan.',
    apa_itu: 'Latihan fungsional dinamis menggunakan bola besi berhandle (kettlebell) dengan rangkaian gerakan yang mengalir konstan tanpa henti.',
    manfaatnya: 'Membangun kekuatan rantai posterior tubuh (punggung bawah dan bokong), melatih stamina kardio, dan memperkuat daya cengkeram tangan.',
    tata_cara_atau_gerakan: 'Lakukan gerakan Kettlebell Swing (ayunan) dasar dari celah kaki hingga setinggi dada, lalu transisikan secara mulus ke gerakan Clean dan Overhead Press.',
    id_video: 'VCcar3MA07w'
  },
  {
    name: 'Chest Isolation (Dada)',
    tokoh_terkenal: 'Lazar Angelov: Bentuk dada yang penuh membutuhkan kontraksi padat dari berbagai sudut bangku latihan.',
    apa_itu: 'Latihan terfokus yang dirancang untuk mengisolasi ketegangan pada otot dada tanpa membagi beban kerja ke otot bahu atau tricep.',
    manfaatnya: 'Memadatkan volume ketebalan serat otot dada bagian atas (upper chest), dada tengah, hingga membentuk garis dada bawah yang tegas.',
    tata_cara_atau_gerakan: 'Duduk di bangku incline atau datar, lakukan gerakan memeluk/meremas dada menggunakan sepasang dumbbell (Dumbbell Flyes) atau mesin kabel (Cable Crossover).',
    id_video: 'KIl70ffF5FM'
  },
  {
    name: 'Back Isolation (Punggung)',
    tokoh_terkenal: 'Frank Zane: Estetika punggung tidak hanya soal lebar sayap, melainkan detail guratan otot belikat.',
    apa_itu: 'Latihan isolasi tarikan yang difokuskan untuk melatih kedalaman tekstur, ketebalan, dan guratan otot punggung tengah.',
    manfaatnya: 'Memperbaiki postur tubuh yang bungkuk akibat terlalu sering duduk bekerja depan laptop, serta melebarkan bentuk tubuh V-Taper.',
    tata_cara_atau_gerakan: 'Posisikan dada menempel pada bantalan kursi (Chest-Supported Row), genggam handle beban, tarik ke arah perut bawah dengan merapatkan belikat ke belakang, tahan kontraksi 1 detik.',
    id_video: '8LJ3Q3Fsrzs'
  },
  {
    name: 'Shoulders (Bahu)',
    tokoh_terkenal: 'Larry Scott: Bahu berdimensi bulat peluru membuat ilusi pinggang Anda terlihat jauh lebih ramping.',
    apa_itu: 'Latihan beban terarah yang menargetkan tiga kepala otot deltoid (bahu depan, bahu samping, dan bahu belakang).',
    manfaatnya: 'Melebarkan dimensi pundak kiri-kanan agar postur tubuh terlihat tegap berisi saat menggunakan pakaian, serta menyeimbangkan sendi lengan atas.',
    tata_cara_atau_gerakan: 'Lakukan angkatan Dumbbell Lateral Raise (mengangkat lengan ke samping badan hingga sejajar bahu) untuk menargetkan deltoid samping agar bahu terlihat bulat peluru.',
    id_video: 'QVaijMZ2mp8'
  },
  {
    name: 'Arms (Lengan Bicep/Tricep)',
    tokoh_terkenal: 'Rich Piana: Jangan harap lengan Anda membesar jika Anda tidak memaksa darah mengalir penuh ke ototnya.',
    apa_itu: 'Sesi latihan terisolasi yang menargetkan kelompok otot lengan atas bagian depan (biceps) dan otot lengan atas bagian belakang (triceps).',
    manfaatnya: 'Meningkatkan lingkar dimensi lengan tangan, serta menambah kekuatan dorong dan tarik untuk mendukung latihan compound lainnya.',
    tata_cara_atau_gerakan: 'Lakukan variasi Bicep Curl menggunakan kabel atau barbel, lalu pasangkan langsung dengan gerakan Tricep Overhead Extension menggunakan dumbbell tunggal.',
    id_video: 'rSohL4gWm9A'
  },
  {
    name: 'Glutes Isolation (Bokong)',
    tokoh_terkenal: 'Amanda Latona: Otot bokong yang kuat adalah motor utama penggerak daya ledak tubuh bawah.',
    apa_itu: 'Latihan isolasi yang dirancang untuk mengaktifkan, memperkuat, dan mengencangkan kelompok otot pantat (gluteus maximus, medius, minimus).',
    manfaatnya: 'Meningkatkan daya dorong panggul saat berlari cepat, menstabilkan posisi panggul bawah, serta melindung punggung bawah dari cedera.',
    tata_cara_atau_gerakan: 'Tempatkan punggung atas di tepi bangku flat, letakkan barbel di atas panggul, lalu dorong panggul ke atas (Barbell Hip Thrust) hingga sejajar lutut sembari meremas otot bokong.',
    id_video: '1T3v_leyDIE'
  },
  {
    name: 'Mobility Drills',
    tokoh_terkenal: 'Kelly Starrett: Tubuh yang kuat tanpa mobilitas sendi yang fleksibel hanyalah sebuah mesin yang rusak.',
    apa_itu: 'Latihan gerakan aktif untuk meningkatkan kapasitas fleksibilitas kapsul sendi dan memperluas jarak jangkauan gerak fungsional tubuh.',
    manfaatnya: 'Memperluas Range of Motion (ROM) aktif sendi sehingga angkatan beban compound di gym bisa dilakukan secara dalam dan sempurna.',
    tata_cara_atau_gerakan: 'Lakukan posisi Deep Squat Hold (menahan posisi jongkok paling bawah) selama 1 menit sembari mendorong lutut ke luar menggunakan kedua siku tangan.',
    id_video: 'tg6zZF6pRg0'
  },
  {
    name: 'Stretching (Peregangan)',
    tokoh_terkenal: 'Flex Wheeler: Elastisitas jaringan ikat pasca latihan mempercepat pembuangan limbah sisa metabolisme.',
    apa_itu: 'Gerakan menahan regangan serat otot secara statis di akhir sesi latihan untuk mengembalikan panjang jaringan otot ke kondisi semula.',
    manfaatnya: 'Mengendurkan simpul-simpul kaku pada otot pasca dihantam latihan berat, serta melancarkan pembuangan asam laktat penyebab pegal.',
    tata_cara_atau_gerakan: 'Duduk di matras dengan meluruskan kedua kaki ke depan, raih ujung jari kaki menggunakan tangan (Seated Forward Fold) dan tahan posisi regangan selama 20-30 detik.',
    id_video: 'itJE4neqDJw'
  },
  {
    name: 'Yoga',
    tokoh_terkenal: 'Kino MacGregor: Yoga adalah perjalanan spiritual yang dieksekusi melalui ketahanan fisik dan nafas.',
    apa_itu: 'Sistem penyelarasan postur tubuh statis/dinamis yang dikombinasikan dengan teknik kontrol pernapasan dalam demi harmoni fisik dan mental.',
    manfaatnya: 'Meningkatkan elastisitas ligamen tubuh secara ekstrem, memperbaiki keseimbangan statis, dan melatih ketenangan fokus pikiran.',
    tata_cara_atau_gerakan: 'Ikuti transisi pose mengalir (Vinyasa Flow) secara perlahan, mulai dari posisi Downward-Facing Dog, transisi ke Cobra Pose, hingga diakhiri dengan Child’s Pose.',
    id_video: 'RvCntPg7oPE'
  },
  {
    name: 'Swimming (Berenang)',
    tokoh_terkenal: 'Michael Phelps: Di dalam air tidak ada benturan sendi, yang ada hanya resistensi hampa udara.',
    apa_itu: 'Olahraga akuatik seluruh tubuh dengan cara menggerakkan lengan dan kaki untuk meluncur membelah resistensi air di kolam.',
    manfaatnya: 'Melatih kapasitas vitalitas paru-paru dan jantung secara optimal tanpa memberikan risiko impak benturan keras pada sendi-sendi kaki.',
    tata_cara_atau_gerakan: 'Lakukan kayuhan lengan bergantian ke depan dipadukan dengan gerakan tendangan kaki lurus (flutter kick) menggunakan gaya bebas sepanjang lintasan kolam.',
    id_video: 'IKWGF4kP8Cs'
  },
  {
    name: 'Running (Lari)',
    tokoh_terkenal: 'Eliud Kipchoge: Berlari bukan hanya soal kaki, melainkan disiplin menjaga ritme konstan jantung.',
    apa_itu: 'Aktivitas kardio intensitas menengah-tinggi dengan melangkah cepat di mana ada momen kedua kaki melayang di udara secara bergantian.',
    manfaatnya: 'Membakar kalori dalam jumlah masif secara praktis, memperkuat kepadatan tulang kaki bawah, serta melatih daya tahan stamina kardiovaskular.',
    tata_cara_atau_gerakan: 'Mulailah dengan joging santai, pertahankan postur tubuh tegak, pandangan lurus ke depan, tekuk siku 90 derajat, dan pastikan mendarat menggunakan area tengah kaki.',
    id_video: '6H8WLfyavWk'
  },
  {
    name: 'Cycling (Bersepeda)',
    tokoh_terkenal: 'Eddy Merckx: Latih terus paha Anda sampai rasa terbakar itu berubah menjadi tenaga kayuhan murni.',
    apa_itu: 'Olahraga ketahanan aerobik tubuh bagian bawah dengan cara mengayuh pedal sepeda jalanan atau sepeda stasioner di dalam ruangan.',
    manfaatnya: 'Membangun ketahanan daya tahan otot paha depan secara konstan tanpa memberikan tekanan stres berlebih pada bantalan sendi lutut.',
    tata_cara_atau_gerakan: 'Atur tinggi sadel sepeda agar kaki sedikit menekuk (sudut 15 derajat) di titik kayuhan terendah, pertahankan kayuhan konstan pada kecepatan irama (cadence) 80-90 RPM.',
    id_video: 'ZiGE3-L4vyg'
  },
  {
    name: 'Recovery Sessions',
    tokoh_terkenal: 'Hafthor Bjornsson: Makan, tidur, dan hidrasi yang tepat di hari pemulihan menentukan bobot angkatan.',
    apa_itu: 'Sesi aktivitas fisik intensitas sangat ringan yang terencana pada hari istirahat untuk menstimulasi sirkulasi pemulihan tubuh.',
    manfaatnya: 'Mempercepat pembersihan zat sisa metabolisme otot, mengurangi intensitas pegal akut (DOMS), dan mengembalikan kesiapan sistem saraf pusat.',
    tata_cara_atau_gerakan: 'Lakukan jalan kaki santai di alam terbuka selama 20 menit atau gunakan silinder busa (Foam Roller) untuk memijat perlahan kelompok otot yang terasa kaku.',
    id_video: 'utAqR9-dmh0'
  },
  {
    name: 'Pendinginan (Cool-down)',
    tokoh_terkenal: 'Reg Park: Tenangkan sistem tubuh Anda sebelum meninggalkan area gym agar aliran darah seimbang.',
    apa_itu: 'Fase penutup latihan fisik dengan cara menurunkan intensitas gerakan secara bertahap menuju kondisi tubuh rileks semula.',
    manfaatnya: 'Menurnkan detak jantung kembali ke batas normal secara perlahan, serta mencegah terjadinya penumpukan darah mendadak di area kaki (blood pooling).',
    tata_cara_atau_gerakan: 'Lakukan jalan lambat di tempat selama 2 sampai 3 menit, dilanjutkan dengan teknik penarikan napas dalam secara rileks sembari meluruskan tangan ke atas.',
    id_video: 'COO2S7lPBzA'
  }
]

function CategoryItem({ cat, index }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-[#211D2C]/40 pb-3 last:border-0">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left font-mono text-xs text-accent font-black uppercase tracking-wider flex justify-between items-center py-1.5 hover:text-purple-400 transition-colors"
      >
        <span>{index + 1}. {cat.name} <span className="text-text-dim font-normal normal-case ml-1">[silakan klik penjelasan dan videonya]</span></span>
        <span className="text-text-dim text-[10px]">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 pl-2.5 space-y-2 border-l border-[#7C5CFF]/40">
          <p className="font-body text-xs text-text-dim italic">"{cat.tokoh_terkenal}"</p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed">
            <strong className="text-accent font-black">{cat.name}:</strong> {cat.apa_itu}
          </p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed">
            <strong className="text-accent font-black">Manfaatnya:</strong> {cat.manfaatnya}
          </p>
          <p className="font-body text-xs text-[#EDEAF6] leading-relaxed">
            <strong className="text-accent font-black">Tata Cara / Gerakan:</strong> {cat.tata_cara_atau_gerakan}
          </p>
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
  const [isQuestClaimed, setIsQuestClaimed] = useState(false)
  const [liveTime, setLiveTime] = useState('')
  const messagesEndRef = useRef(null)

  const currentTier = getRankTier(userStats?.level || 1)
  
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

  const getTodayDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  useEffect(() => {
    const greetingText = getDynamicGreeting()
    setMessages([
      { 
        sender: 'seolha', 
        text: `${greetingText}, Trainer. Ada yang bisa saya bantu untuk menemani sesi latihan harian Anda?`,
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

    if (isAllCategories) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'seolha', 
          text: "Berikut adalah daftar matrix **34 KATEGORI LATIHAN LENGKAP**. Silakan klik tiap kategori untuk memuat video panduan dan penjelasannya:", 
          media: null,
          multiMedia: MASTER_34_CATEGORIES 
        }])
        setLoading(false)
      }, 600)
      return
    }

    // 🟢 PEMULIHAN TOTAL LOGIKA FAQ & RESTORE ID VIDEO PILIHAN LU 100%
    if (isFaq) {
      let faqReply = ''
      let mediaAsset = null
      const lowerText = msgToSend.toLowerCase()

      if (lowerText.includes('mulai dari mana')) {
        mediaAsset = { type: 'video', src: '7K37eH7fG34' }
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank sebanyak 3 kali seminggu. Berikut panduan video lokal pilihan Seolha:`
      } 
      else if (lowerText.includes('kardio atau angkat')) {
        mediaAsset = { type: 'video', src: 'gcNh17CkW64' }
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, ${currentTier}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga stamina jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Kardio.`
      }
      else if (lowerText.includes('jenis & cara latihan')) {
        mediaAsset = { type: 'video', src: 'UItWltVZZmE' }
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, ${currentTier}.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
      }
      else if (lowerText.includes('pola makan') || lowerText.includes('nutrisi')) {
        mediaAsset = { type: 'video', src: '3_9yOQ83PjI' }
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, ${currentTier}.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
      }
      else if (lowerText.includes('pola tidur') || lowerText.includes('recovery')) {
        mediaAsset = { type: 'video', src: 't0kACis_dJE' }
        faqReply = `Ingat ini, ${currentTier}: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
      }
      else if (lowerText.includes('kesalahan fatal')) {
        mediaAsset = { type: 'video', src: 'ixkQaYn5eg0' }
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, ${currentTier}.\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Meniru program latihan atlet profesional tanpa fondasi dasar.`
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, media: mediaAsset }])
        setLoading(false)
      }, 500)
      return
    }

    // 🟢 AMAN 100%: MENYELARASKAN PAYLOAD SESUAI DENGAN PARAMETER BACKEND LU
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.filter(m => m.text && !m.text.includes('Gagal mendapatkan respon')), 
          userStats: userStats 
        })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada progres lain yang mau kita diskusikan?'
        
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: null }])
        setDailyCount(prev => prev + 1)
      } else {
        setMessages(prev => [...prev, { sender: 'seolha', text: 'Gagal mendapatkan respon dari engine chat. Mohon periksa kembali status API Studio Key Anda.', media: null }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'seolha', text: 'Koneksi ke server Seolha terputus.', media: null }])
    } final { 
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

            {m.sender === 'seolha' && m.multiMedia && Array.isArray(m.multiMedia) && (
              <div className="matrix-dropdown-container w-[85%] space-y-4 mt-3 max-h-[380px] overflow-y-auto p-3 bg-[#0A0A0E] border border-[#211D2C] rounded-lg">
                {m.multiMedia.map((vid, vIdx) => (
                  <CategoryItem key={vIdx} cat={vid} index={vIdx} />
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
