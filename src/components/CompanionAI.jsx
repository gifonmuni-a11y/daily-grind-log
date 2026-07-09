import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2, Clock, Volume2, VolumeX } from 'lucide-react'
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

const AVATAR_LINKS = {
  diam: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Public/entry-images/diam.gif',
  ngomong: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Public/entry-images/ngomong.gif',
  mikir: 'https://eekeixvvrspyguawqmnl.supabase.co/storage/v1/object/public/Public/entry-images/mikir.gif'
}

const MASTER_34_CATEGORIES = [
  { name: 'Pemanasan (Warm-up)', tokoh_terkenal: 'Arnold Schwarzenegger: Otot yang dingin adalah otot yang rapuh. Pompa darah sebelum mengangkat besi beban berat.', apa_itu: 'Sesi latihan intensitas rendah di awal untuk meningkatkan suhu tubuh dan menyiapkan otot sebelum masuk ke latihan inti.', manfaatnya: 'Meningkatkan sirkulasi aliran darah ke seluruh tubuh, melumasi mobilitas sendi-sendi utama, serta mencegah kram mendadak.', tata_cara_atau_gerakan: 'Lakukan gerakan dinamis seperti arm circles (memutar lengan), leg swings (mengayun kaki), and lunges tanpa beban selama 5-10 menit.', id_video: 'mUD2u-YVn7A' },
  { name: 'Push Up', tokoh_terkenal: 'Ade Rai: Otot dada, bahu, dan tricep dibangun dari dorongan beban tubuh yang konstan dan terkontrol.', apa_itu: 'Latihan beban tubuh (calisthenics) posisi telungkup fungsional dengan cara mendorong bobot badan ke atas menggunakan kekuatan lengan.', manfaatnya: 'Membangun kekuatan dan volume otot dada (pectoralis), deltoid bagian depan (bahu), and otot lengan belakang (triceps).', tata_cara_atau_gerakan: 'Posisikan tubuh lurus seperti plank, turunkan dada secara perlahan hingga hampir menyentuh lantai dengan siku membentuk sudut 45 derajat, lalu dorong kuat kembali ke atas.', id_video: 'VZUDAOL2LI8' },
  { name: 'Squat', tokoh_terkenal: 'Tom Platz: Batas bawah squat adalah tempat di mana karakter mental asli seorang pria diuji.', apa_itu: 'Latihan compound tubuh bagian bawah yang meniru gerakan fundamental manusia saat hendak duduk dan berdiri kembali.', manfaatnya: 'Memperkuat rantai kekuatan otot paha depan (quadriceps), paha belakang (hamstring), bokong (glutes), serta melatih kekuatan tulang punggung.', tata_cara_atau_gerakan: 'Buka kaki selebar bahu, turunkan pinggul ke bawah dan ke belakang seolah hendak duduk hingga paha sejajar lantai, pastikan lutut tidak maju melebihi ujung jari kaki, lalu berdiri tegak kembali.', id_video: 'Xb2Lm40nlGo' },
  { name: 'Plank', tokoh_terkenal: 'David Goggins: Mengunci core dalam plank adalah perang statis melawan rasa ingin menyerah di dalam otak.', apa_itu: 'Latihan kekuatan isometrik statis yang mengharuskan Anda menahan satu posisi tubuh garis lurus dalam durasi waktu tertentu.', manfaatnya: 'Mengunci stabilitas seluruh dinding otot perut (core), memperkuat otot panggul bawah, serta memperbaiki postur tubuh bungkuk.', tata_cara_atau_gerakan: 'Tumpu bobot badan Anda pada kedua siku lengan bawah dan ujung jari kaki di atas matras, kunci otot perut dan bokong sekencang mungkin, pastikan posisi pinggul tidak naik atau merosot.', id_video: 'Gr1GtwTp_ko' },
  { name: 'Lunges', tokoh_terkenal: 'Ronnie Coleman: Angkatan unilateral membentuk keseimbangan kaki yang kokoh untuk menopang beban raksasa.', apa_itu: 'Latihan unilateral tubuh bagian bawah yang berfokus pada pelatihan satu kaki secara mandiri bergantian kaki kaki kiri dan kanan.', manfaatnya: 'Memperbaiki ketidakseimbangan kekuatan kaki kiri-kanan, meningkatkan stabilitas koordinasi tubuh, serta melatih fleksibilitas otot panggul.', tata_cara_atau_gerakan: 'Langkahkan kaki kanan jauh ke depan, turunkan lutut kaki kiri belakang hingga hampir menyentuh lantai dan membentuk sudut 90 derajat pada kedua kaki, dorong tumit depan untuk kembali ke posisi awal.', id_video: 'AJUh03WB8F4' },
  { name: 'Meditasi', tokoh_terkenal: 'Bruce Lee: Kosongkan pikiranmu, jadilah tanpa bentuk seperti air. Tenang di dalam badai latihan.', apa_itu: 'Praktik relaksasi mental terarah untuk melatih fokus pikiran, kedalaman pernapasan, dan memicu ketenangan sistem saraf.', manfaatnya: 'Menurunkan hormon stres (kortisol) dengan cepat pasca latihan berat, menenangkan detak jantung, dan mempertajam fokus mind-muscle connection.', tata_cara_atau_gerakan: 'Duduk bersila dengan punggung tegak namun rileks, pejamkan mata Anda, atur ritme napas dalam lewat hidung, dan pusatkan perhatian penuh hanya pada hembusan napas Anda.', id_video: '2sJyBfDZpe4' },
  { name: 'Pola Tidur (Rest)', tokoh_terkenal: 'Dorian Yates: Otot tidak tumbuh di gym. Otot Anda tumbuh saat tidur pulas di dalam kegelapan kamar.', apa_itu: 'Fase pemulihan pasif total di mana tubuh melakukan perbaikan makro terhadap jaringan sel otot yang robek selama latihan fisik.', manfaatnya: 'Memicu pelepasan Hormon Pertumbuhan Manusia (HGH) secara alami, mempercepat pemulihan energi seluler, dan menghentikan katabolisme (penyusutan otot).', tata_cara_atau_gerakan: 'Matikan seluruh lampu kamar dan gadget 30 menit sebelum tidur, pastikan Anda mendapatkan tidur malam berkualitas tanpa interupsi selama 7 hingga 8 jam penuh.', id_video: '-dCHrqndWYs' },
  { name: 'Kardio / HIIT', tokoh_terkenal: 'Chris Bumstead: Jantung yang kuat memompa nutrisi lebih cepat ke sel-sel otot yang sedang robek.', apa_itu: 'Latihan kardiovaskular intensitas tinggi yang dikombinasikan dengan periode istirahat singkat secara berulang-ulang.', manfaatnya: 'Meningkatkan kapasitas stamina fungsional (VO2 Max), mempercepat pembakaran deposit kalori/lemak tubuh, dan menyehatkan pembuluh darah.', tata_cara_atau_gerakan: 'Lakukan gerakan eksplosif seperti jumping jacks atau burpees selama 30 detik sekuat tenaga, disusul dengan istirahat pasif selama 15 detik, ulangi sirkuit ini sebanyak 4-5 siklus.', id_video: 'cbKkB3POqaY' },
  { name: 'Pull Up', tokoh_terkenal: 'Hanma Yujiro: Punggung lebar seperti iblis dibangun dari tarikan konsisten menembus batas gravitasi.', apa_itu: 'Latihan fungsional kebugaran tubuh bagian atas dengan menarik bobot seluruh badan ke atas bar horizontal.', manfaatnya: 'Membangun lebar otot punggung sayap (latissimus dorsi), ketebalan otot traps, serta meningkatkan kekuatan bicep.', tata_cara_atau_gerakan: 'Gantung pada bar dengan genggaman lebar, kunci core, tarik tubuh ke atas secara eksplosif hingga dada mendekati bar, lalu turunkan tubuh terkontrol.', id_video: 'eGo4IYlbE5g' },
  { name: 'Dips', tokoh_terkenal: 'Lazar Angelov: Dada bawah yang tajam dan tricep yang tebal adalah mahakarya dari rutinitas dips paralel.', apa_itu: 'Latihan compound fungsional mendorong bobot tubuh ke atas menggunakan bantuan dua bilah bar sejajar.', manfaatnya: 'Memahat definisi otot dada bagian bawah (pectoralis), mempertebal otot tricep lengan belakang, dan melatih stabilitas bahu.', tata_cara_atau_gerakan: 'Pegang bar paralel, angkat tubuh hingga lengan lurus, turunkan badan perlahan dengan condong ke depan hingga siku membentuk sudut 90 derajat, lalu dorong kembali ke atas.', id_video: '2XdUui76dgo' },
  { name: 'Diamond Push Up', tokoh_terkenal: 'Frank Medrano: Merapatkan tangan dalam dorongan melatih kekuatan tricep hingga sekeras berlian sejati.', apa_itu: 'Variasi latihan push up tingkat lanjut dengan memposisikan kedua telapak tangan merapat tepat di bawah dada.', manfaatnya: 'Mengisolasi dan memaksimalkan kontraksi pada otot triceps serta membentuk garis pemisah otot dada bagian dalam.', tata_cara_atau_gerakan: 'Posisikan jempol dan telunjuk tangan kanan-kiri menyatu membentuk pola berlian di lantai, turunkan dada secara perlahan hingga menyentuh tangan, lalu dorong kuat ke atas.', id_video: 'pDN7F_8pIec' },
  { name: 'Chin Up', tokoh_terkenal: 'Jeff Cavaliere: Mengubah arah cengkeraman tangan adalah cara termurah untuk meledakkan volume bicep secara masif.', apa_itu: 'Variasi latihan pull up dengan posisi telapak tangan menghadap ke dalam ke arah wajah (supinated grip).', manfaatnya: 'Meningkatkan keterlibatan puncak kontraksi otot bicep secara ekstrem sambil tetap melatih otot punggung bagian atas.', tata_cara_atau_gerakan: 'Gantung pada bar dengan telapak tangan menghadap ke wajah selebar bahu, tarik tubuh ke atas secara vertical hingga dagu melewati bar, lalu turunkan perlahan.', id_video: 'mRznU6pgez0' },
  { name: 'Calf Raises', tokoh_terkenal: 'Arnold Schwarzenegger: Jangan menyembunyikan kelemahan betismu. Siksa mereka dengan kontraksi penuh setiap hari.', apa_itu: 'Latihan isolasi tubuh bagian bawah untuk mengencangkan dan membangun volume otot betis menggunakan berat badan.', manfaatnya: 'Memperkuat struktur otot betis, meningkatkan daya pegas lompatan kaki, serta menopang stabilitas pergelangan kaki.', tata_cara_atau_gerakan: 'Berdiri tegak, angkat tumit kaki setinggi mungkin hingga bobot tubuh bertumpu penuh pada ujung jari kaki, remas otot betis di puncak gerakan, lalu turunkan perlahan.', id_video: 'gwLzBJYoWlU' },
  { name: 'Leg Raise', tokoh_terkenal: 'Bruce Lee: Perut yang rata dan kuat adalah jangkar utama dari keseimbangan tubuh seorang petarung sejati.', apa_itu: 'Latihan kekuatan perut bawah dengan cara mengangkat kedua kaki secara bersamaan dalam posisi berbaring atau menggantung.', manfaatnya: 'Menargetkan serat otot perut bagian bawah (lower abs), memperkuat otot flexor panggul, dan melatih ketahanan core.', tata_cara_atau_gerakan: 'Berbaring terlentang dengan tangan di samping, angkat kedua kaki lurus ke atas hingga membentuk sudut 90 derajat tanpa menekuk lutut, lalu turunkan perlahan tanpa menyentuh lantai.', id_video: 'JB2oyawG9KI' },
  { name: 'Crunch', tokoh_terkenal: 'Cristiano Ronaldo: Enam kotak di perut tidak datang dari keajaiban, melainkan dari ribuan repetisi crunch terkontrol.', apa_itu: 'Latihan core fungsional dengan melakukan tekukan perut pendek untuk mengisolasi kontraksi dinding perut atas.', manfaatnya: 'Memperjelas guratan otot perut bagian atas (rectus abdominis) dan membangun daya tahan kekuatan otot inti depan.', tata_cara_atau_gerakan: 'Berbaring dengan lutut ditekuk, letakkan tangan di belakang kepala, angkat bahu dan punggung atas sedikit dari lantai menggunakan kekuatan perut, tahan sekilas, lalu turunkan kembali.', id_video: 'Xyd_fa5zoEU' },
  { name: 'Wall Sit', tokoh_terkenal: 'David Goggins: Saat pahamu mulai terbakar membara bersandar di dinding, di situlah perang mental otak dimulai.', apa_itu: 'Latihan kekuatan isometrik statis menahan beban tubuh bagian bawah dengan bersandar pada permukaan dinding lurus.', manfaatnya: 'Meningkatkan ketahanan otot paha depan (quadriceps), memperkuat tendon lutut, serta melatih fokus ketahanan mental.', tata_cara_atau_gerakan: 'Sandarkan punggung tegak pada dinding, turunkan pantat hingga paha sejajar lantai membentuk sudut 90 derajat layaknya duduk di kursi, tahan posisi diam selama mungkin.', id_video: 'y-wV4Hypqf0' },
  { name: 'Jumping Jack', tokoh_terkenal: 'Son Goku: Nyalakan mesin energi tubuhmu dengan lompatan ritmis untuk membakar habis semua batas stamina.', apa_itu: 'Latihan kardiovaskular plyometrik dasar seluruh tubuh yang menggabungkan gerakan melompat membuka kaki dan tangan.', manfaatnya: 'Meningkatkan detak metabolisme jantung dengan cepat, membakar deposit kalori, dan melatih koordinasi motorik tubuh.', tata_cara_atau_gerakan: 'Berdiri tegak, lompat sambil membuka kedua kaki lebar ke samping bersamaan dengan menepuk kedua tangan di atas kepala, lalu lompat kembali ke posisi semula.', id_video: 'UpH7rm0cYbM' },
  { name: 'Burpees', tokoh_terkenal: 'Georges St-Pierre: Jika kamu ingin menguji stamina fungsional sejati, lakukan burpees sampai paru-parumu berteriak.', apa_itu: 'Latihan kalistenik sirkuit seluruh tubuh yang mengombinasikan gerakan squat, push up, dan lompatan vertikal eksplosif.', manfaatnya: 'Meningkatkan kapasitas VO2 Max jantung secara ekstrem, membakar tumpukan kalori dengan cepat, dan melatih daya ledak otot.', tata_cara_atau_gerakan: 'Dari posisi berdiri tegak, turun ke posisi squat, lempar kedua kaki ke belakang ke posisi plank, lakukan satu push up, tarik kaki kembali ke depan, lalu melompat tinggi.', id_video: 'dZfeV7UAq60' },
  { name: 'Mountain Climber', tokoh_terkenal: 'Khabib Nurmagomedov: Berlari secara horizontal di atas lantai akan mengunci daya tahan core dan kecepatan gerak kaki.', apa_itu: 'Latihan ketangkasan dinamis dalam posisi push up dengan menggerakkan lutut maju mundur secara cepat bergantian.', manfaatnya: 'Melatih kekuatan isometrik bahu dan core, membakar lemak tubuh secara berkala, serta melatih fleksibilitas panggul.', tata_cara_atau_gerakan: 'Ambil posisi push up, dorong lutut kanan maju ke arah dada secepat mungkin, lalu kembalikan posisi sambil mendorong lutut kiri ke dada seolah sedang mendaki.', id_video: 'cnyTQDSE884' },
  { name: 'Russian Twist', tokoh_terkenal: 'Fedor Emelianenko: Kekuatan putaran lingkar perut adalah modal utama untuk menghasilkan bantingan tubuh yang kokoh.', apa_itu: 'Latihan core rotasional dengan cara memutar batang tubuh ke kiri dan kanan dalam posisi duduk setengah gantung.', manfaatnya: 'Memperkuat otot perut bagian samping (obliques), menstabilkan rotasi tulang belakang, dan mengencangkan lingkar pinggang.', tata_cara_atau_gerakan: 'Duduk dengan lutut ditekuk, angkat kaki sedikit dari lantai, condongkan punggung ke belakang, lalu putar genggaman tangan dan dada ke kiri dan kanan bergantian.', id_video: 'wkD8rjkS_R8' },
  { name: 'Glute Bridge', tokoh_terkenal: 'Bret Contreras: Rantai kekuatan punggung bawah yang kokoh berpusat dari kekuatan bokong yang diaktifkan sempurna.', apa_itu: 'Latihan penguatan rantai posterior dengan cara mendorong pinggul ke atas langit dalam posisi berbaring terlentang.', manfaatnya: 'Mengisolasi dan melatih otot bokong (glutes), mengurangi risiko nyeri punggung bawah, serta memperkuat paha belakang.', tata_cara_atau_gerakan: 'Berbaring telentang, tekuk lutut dengan telapak kaki rata di lantai, dorong pinggul ke atas hingga tubuh lurus dari bahu ke lutut, remas bokong di puncak gerakan.', id_video: 'wPM8co452_A' },
  { name: 'Superman Hold', tokoh_terkenal: 'Idris Elba: Jaga rantai otot punggung belakang tetap kencang demi menjaga postur tubuh yang tegap berwibawa.', apa_itu: 'Latihan isometrik statis mengangkat lengan depan dan kaki belakang secara bersamaan dalam posisi telungkup.', manfaatnya: 'Memperkuat seluruh rantai otot punggung belakang (erector spinae), glutes, dan menyeimbangkan postur tubuh bungkuk.', tata_cara_atau_gerakan: 'Berbaring tengkurap, luruskan tangan ke depan dan kaki ke belakang, angkat dada, tangan, dan paha secara serentak dari lantai, tahan posisi melayang tersebut.', id_video: 'z6PJMT2y8GQ' },
  { name: 'Side Plank', tokoh_terkenal: 'Conor McGregor: Keseimbangan lateral perut menjaga tubuhmu tetap kokoh berdiri saat menerima benturan dari samping.', apa_itu: 'Variasi latihan stabilitas core statis miring dengan bertumpu penuh pada satu siku lengan dan sisi samping kaki.',
  manfaatnya: 'Memperkuat otot perut samping mendalam (obliques), melatih stabilitas lateral panggul, serta memperkuat otot bahu.', tata_cara_atau_gerakan: 'Berbaring miring, tumpu badan pada satu siku lengan bawah, angkat pinggul ke atas hingga tubuh membentuk garis lurus dari kepala ke kaki, tahan posisi statis.', id_video: 'NXr4Fwku60o' },
  { name: 'High Knees', tokoh_terkenal: 'Usain Bolt: Mengangkat lutut setinggi dada secara eksplosif adalah kunci utama untuk melatih kecepatan kaki.', apa_itu: 'Latihan kardio dinamis intensitas tinggi berupa gerakan lari di tempat dengan mengangkat lutut hingga setinggi pinggang.', manfaatnya: 'Memompa kapasitas stamina fungsional jantung, memperkuat otot paha depan, dan meningkatkan kelincahan langkah kaki.', tata_cara_atau_gerakan: 'Berlari di tempat secara intensif, angkat lutut bergantian setinggi mungkin hingga minimal sejajar dengan pinggul secara konstan dengan ayunan tangan cepat.', id_video: 'ZZZw0aWvd_0' },
  { name: 'Shadow Boxing', tokoh_terkenal: 'Mike Tyson: Bertarunglah melawan bayanganmu sendiri untuk mengasah kecepatan visual otot dan refleks insting.', apa_itu: 'Praktik melayangkan kombinasi pukulan terarah ke udara kosong untuk melatih koordinasi gerak fisik dinamis.', manfaatnya: 'Meningkatkan mobilitas sendi bahu, melatih kekuatan rotasi core, serta membangun ketahanan kardio fungsional.', tata_cara_atau_gerakan: 'Ambil posisi stance bertarung, lepaskan kombinasi pukulan jab, straight, hook, dan uppercut secara berulang dikombinasikan dengan gerakan kaki menghindar.', id_video: 'q86mALbL9wY' },
  { name: 'Pendinginan (Cooldown)', tokoh_terkenal: 'Phil Heath: Sesi pendinginan mengembalikan sirkulasi darah normal dan mengunci pemulihan makro jaringan sel otot.', apa_itu: 'Fase peregangan statis intensitas rendah di akhir program latihan fisik untuk menurunkan detak jantung secara bertahap.', manfaatnya: 'Mengurangi penumpukan asam laktat pemicu pegal, mencegah otot kaku, dan menenangkan ketegangan sistem saraf.', tata_cara_atau_gerakan: 'Lakukan gerakan peregangan statis pada seluruh kelompok otot utama yang telah dilatih selama 10-15 detik per gerakan secara perlahan dan rileks.', id_video: '5MrKSlgA_C4' },
  { name: 'Minum Air (Hidrasi)', tokoh_terkenal: 'Bruce Lee: Jadilah seperti air yang mengalir penuh daya. Sel otot yang terhidrasi adalah sel otot yang kuat.', apa_itu: 'Praktik menjaga keseimbangan cairan tubuh dengan mengonsumsi air mineral berkualitas secara berkala.', manfaatnya: 'Meningkatkan volume seluler, melumasi mobilitas persendian, serta mengoptimalkan transportasi nutrisi pasca latihan.', tata_cara_atau_gerakan: 'Minum air putih minimal 2-3 liter per hari secara konsisten, serta konsumsi 2-3 teguk air segar di sela-sela waktu istirahat antar set latihan.', id_video: '26fR6v53MQQ' },
  { name: 'Stretching Statis', tokoh_terkenal: 'Yuri Boyka: Fleksibilitas tubuh tingkat tinggi adalah perisai utama agar otot tidak robek akibat beban kejut mendadak.', apa_itu: 'Metode peregangan otot statis dengan cara menahan posisi regang maksimal kelompok otot dalam durasi tertentu.', manfaatnya: 'Memperpanjang jaringan otot elastis, meningkatkan jangkauan gerak sendi (ROM), dan mempercepat relaksasi otot.', tata_cara_atau_gerakan: 'Tarik lengan atau kaki hingga otot terasa meregang namun tetap nyaman, tahan posisi statis tersebut tanpa memantul selama 15-30 detik penuh.', id_video: 'H58vbeVscC8' },
  { name: 'Inverted Row', tokoh_terkenal: 'Frank Medrano: Tarik bobot tubuhmu secara horizontal jika kamu ingin membangun ketebalan punggung tengah sejati.', apa_itu: 'Latihan menarik tubuh bagian atas secara horizontal menggunakan tumpuan tiang bar rendah yang sejajar di bawah dada.', manfaatnya: 'Menebalkan otot punggung bagian tengah (rhomboids dan traps) serta membangun fondasi kekuatan genggaman tangan.', tata_cara_atau_gerakan: 'Berbaring di bawah bar rendah, genggam bar selebar bahu, luruskan seluruh tubuh dengan tumit menumpu di lantai, lalu tarik dada Anda hingga menyentuh bar.', id_video: 'e7S83SgUvAw' },
  { name: 'Bear Crawl', tokoh_terkenal: 'Khabib Nurmagomedov: Merangkak meniru gerakan beruang akan mengaktifkan seluruh sendi tubuh secara serentak.', apa_itu: 'Latihan mobilitas dinamis merangkak di atas lantai dengan menjaga posisi lutut tetap menggantung.', manfaatnya: 'Membangun kekuatan fungsional core secara dinamis, melatih koordinasi silang motorik saraf, dan memperkuat otot bahu.', tata_cara_atau_gerakan: 'Ambil posisi merangkak bertumpu pada telapak tangan dan ujung jari kaki, angkat lutut sedikit dari lantai, lalu melangkahlah maju mundur bergantian kaki-tangan.', id_video: 'A9EitwFp8M8' },
  { name: 'Hindu Push Up', tokoh_terkenal: 'Great Gama: Gerakan pusaran vertikal melatih fleksibilitas tulang punggung sekaligus melipatgandakan kekuatan dorong.', apa_itu: 'Variasi push up tradisional India kuno yang menggabungkan gerakan menukik melingkar dinamis dari posisi pinggul tinggi.', manfaatnya: 'Membangun kekuatan fungsional sendi bahu, memperpanjang kelenturan otot dada, serta meregangkan otot pinggul belakang.', tata_cara_atau_gerakan: 'Mulai dengan posisi pinggul diangkat tinggi ke atas (downward dog), tukikkan dada meluncur dekat lantai, lalu dorong lengan tegak hingga dada mendongak ke langit.', id_video: '4m4kX9G-H_I' },
  { name: 'Pistol Squat', tokoh_terkenal: 'Yuri Boyka: Angkatan jongkok satu kaki mandiri adalah bukti mutlak dari keseimbangan kasta fisik tertinggi.', apa_itu: 'Latihan compound tingkat lanjut berupa gerakan jongkok penuh secara sepihak (unilateral) bertumpu pada satu kaki.', manfaatnya: 'Melatih kekuatan ekstrem otot paha depan (quadriceps) secara sepihak, melatih keseimbangan saraf pusat, dan kelenturan panggul.', tata_cara_atau_gerakan: 'Berdiri tegak dengan satu kaki, luruskan kaki satunya lurus ke depan, turunkan pinggul perlahan hingga bokong mendekati tumit, lalu dorong kembali ke atas.', id_video: 'vpWp67W3eB4' },
  { name: 'Crab Walk', tokoh_terkenal: 'Conor McGregor: Berjalan terbalik membuka ketegangan dada depan sekaligus melatih sabuk otot bahu belakang.', apa_itu: 'Latihan mobilitas dinamis merangkak di atas lantai dengan posisi tubuh menghadap ke atas langit secara terbalik.', manfaatnya: 'Membuka kelenturan otot dada bagian depan, memperkuat otot tricep statis, serta melatih koordinasi core bagian belakang.', tata_cara_atau_gerakan: 'Duduk di lantai, posisikan kedua tangan di belakang pinggul, angkat pantat tinggi hingga tubuh terangkat, lalu mulailah berjalan maju mundur dengan tangan dan kaki.', id_video: 'eF92wFp6_G0' },
  { name: 'Hollow Body Hold', tokoh_terkenal: 'Gymnastics Elite: Kunci dari keindahan kalistenik tingkat tinggi adalah kemampuan mengunci perut melengkung sempurna.', apa_itu: 'Latihan kekuatan isometrik statis menahan posisi tubuh melengkung seperti pisang dengan punggung bawah menempel matras.', manfaatnya: 'Membangun kekuatan dinding perut depan secara maksimal sebagai fondasi utama gerakan handstand dan l-sit.', tata_cara_atau_gerakan: 'Berbaring terlentang, angkat kedua lengan lurus ke belakang kepala dan kaki lurus ke depan, angkat sedikit bahu hingga seluruh otot perut mengunci ketat di lantai.', id_video: 'LlDNef_ZdBk' }
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

export default function CompanionAI({ userStats, profile, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [liveTime, setLiveTime] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [avatarState, setAvatarState] = useState('diam')
  const messagesEndRef = useRef(null)

  const userName = profile?.name || 'Trainer'
  const userStatsWithProfile = { ...userStats, name: userName }
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
        if (match.index > lastIndex) parts.push(processedLine.substring(lastIndex, match.index))
        const boldText = match[1] || match[2]
        parts.push(<strong key={match.index} className="text-accent font-black">{boldText}</strong>)
        lastIndex = cleanRegex.lastIndex
      }
      if (lastIndex < processedLine.length) parts.push(processedLine.substring(lastIndex))
      const content = parts.length > 0 ? parts : processedLine
      
      if (isBullet) return <div key={idx} className="flex items-start gap-2 my-1 pl-1 font-body text-sm text-[#EDEAF6]"><span className="text-accent text-xs mt-1.5">•</span><div className="flex-1 whitespace-pre-wrap leading-relaxed">{content}</div></div>
      return <p key={idx} className="whitespace-pre-wrap font-body text-sm text-[#EDEAF6] leading-relaxed my-1">{content}</p>
    })
  }

  const getTodayDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const speakText = (text, customEndState = null) => {
    if (isMuted) return
    window.speechSynthesis.cancel()
    
    const cleanText = text.replace(/[*#_]/g, '')
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'id-ID'
    utterance.rate = 1.05

    utterance.onstart = () => setAvatarState('ngomong')
    utterance.onend = () => setAvatarState(customEndState || (loading ? 'mikir' : 'diam'))
    utterance.onerror = () => setAvatarState(customEndState || (loading ? 'mikir' : 'diam'))

    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const greetingText = getDynamicGreeting()
    const msg = `${greetingText}, ${userName}. Seolha siap mendampingi latihan harian Anda hari ini. Ada target kasta RPG fisik yang ingin kita tembus bersama?`
    setMessages([{ sender: 'seolha', text: msg, mediaSources: null }])
    fetchDailyLimit()
    
    setTimeout(() => { speakText(msg) }, 600)
    return () => window.speechSynthesis.cancel()
  }, [currentTier, userName])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (loading) {
      setAvatarState('mikir')
    }
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
      const failMsg = `Energi aku sudah habis untuk hari ini (Batas 5 pertanyaan telah tercapai). Kita obrol lagi besok ya, ${userName}!`
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
      }, 1500)
      return
    }

    if (isFaq) {
      let faqReply = ''
      let multiVideos = null
      const lowerText = msgToSend.toLowerCase()

      if (lowerText.includes('mulai dari mana')) {
        multiVideos = ['rN92rbUoQDE', 'vbJxymW5xj0']
        faqReply = `Sebagai seorang ${currentTier}, langkah awal terbaik adalah membangun fondasi konsistensi tanpa memikirkan beban berat dulu, ${userName}.\n\nFokuslah pada latihan beban seluruh tubuh (Full-Body Workout) menggunakan berat badan sendiri seperti Squat, Push-up, dan Plank sebanyak 3 kali seminggu. Berikut panduan video lokal pilihan Seolha:`
      } 
      else if (lowerText.includes('kardio atau angkat')) {
        multiVideos = ['2MoGxae-zyo', 'GY1JhB9BEkk']
        faqReply = `Kardio dan Angkat Beban memiliki peran masing-masing, ${userName}.\n\n1. **Angkat Beban:** Wajib diutamakan untuk merobek otot lama agar tumbuh menjadi massa otot baru yang padat.\n2. **Kardio:** Menjaga stamina jantung.\n\nSaran eksekusi: Dahulukan Angkat Beban selagi energi penuh, lalu tutup dengan 15 menit Kardio.`
      }
      else if (lowerText.includes('jenis & cara') || lowerText.includes('cara & jenis') || lowerText.includes('jenis latihan')) {
        multiVideos = ['UItWltVZZmE']
        faqReply = `Untuk pemula, persiapkan mental untuk menguasai gerakan dasar dengan form yang sempurna, ${userName}.\n\n* **Jenis Latihan Utama:** Gerakan Compound seperti Push-Up (dada/tricep), Pull-Up/Inverted Row (punggung/bicep), dan Squat (kaki).\n* **Cara Latihan:** Lakukan 3 set per gerakan dengan repetisi terkontrol (8-12 repetisi). Istirahat 1-2 menit antar set. Jaga otot inti (core) selalu terkunci rapat.`
      }
      else if (lowerText.includes('pola makan') || lowerText.includes('nutrisi')) {
        multiVideos = ['mzpDEPg7-3E']
        faqReply = `Nutrisi adalah 70% penentu keberhasilan progres RPG fisikmu, ${userName}.\n\n* **Bulking (Naik Berat Otot):** Surplus kalori bersih dari sumber makanan utuh.\n* **Cutting (Turun Lemak):** Defisit kalori terkontrol.\n* **Kebutuhan Protein:** Konsumsi 1.5x - 2x berat badan gram protein harian. Maksimalkan opsi murah lokal: Dada ayam, telur ayam, tempe, tahu, dan ikan kembung. Hindari gorengan minyak berlebih.`
      }
      else if (lowerText.includes('pola tidur') || lowerText.includes('recovery')) {
        multiVideos = ['-lu1Nmttz4w']
        faqReply = `Ingat ini, ${userName}: Otot tidak bertumbuh saat kamu mengangkat beban di gym, melainkan saat kamu tidur nyenyak.\n\n* **Durasi Mandatori:** 7-8 jam per hari secara konsisten.\n* **Manfaat Deep Sleep:** Mempercepat sintesis protein dan memicu pelepasan Growth Hormone (HGH) secara maksimal untuk memulihkan jaringan otot yang rusak.`
      }
      else if (lowerText.includes('kesalahan fatal')) {
        multiVideos = ['HtzSj0FEogk']
        faqReply = `Hindari 4 dosa besar pemula ini agar terhindar dari cedera kronis, ${userName}.\n\n1. **Ego Lifting:** Memaksa beban terlalu berat padahal form gerakan berantakan.\n2. **Kurang Konsisten:** Berhenti latihan hanya karena otot belum kelihatan dalam 2 minggu.\n3. **Mengabaikan Nutrisi:** Mengira latihan keras bisa menutupi pola makan berantakan/begadang.\n4. **Asal Tiru:** Meniru program latihan atlet profesional tanpa fondasi dasar.`
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { sender: 'seolha', text: faqReply, mediaSources: multiVideos }])
        setLoading(false)
        speakText(faqReply)
      }, 1500)
      return
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.filter(m => m.text && !m.text.includes('Silakan coba lagi')).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })), 
          userStats: userStatsWithProfile 
        })
      })

      if (response.ok) {
        const resData = await response.json()
        let replyText = resData.reply || 'Ada progres lain yang mau kita diskusikan?'
        setMessages(prev => [...prev, { sender: 'seolha', text: replyText, media: null }])
        setDailyCount(prev => prev + 1)
        speakText(replyText)
      } else {
        const failText = "Silakan coba lagi, banyak orang yang lagi bertanya"
        setMessages(prev => [...prev, { sender: 'seolha', text: failText, media: null }])
        speakText(failText)
      }
    } catch (err) {
      const failText = "Silakan coba lagi, banyak orang yang lagi bertanya"
      setMessages(prev => [...prev, { sender: 'seolha', text: failText, media: null }])
      speakText(failText)
    } finally { 
      setLoading(false) 
    }
  }

  const handleToggleMute = () => {
    if (!isMuted) window.speechSynthesis.cancel()
    setIsMuted(!isMuted)
  }

  const handleAvatarTap = () => {
    const interactiveTexts = [
      `Jangan menyentuhku sembarangan, ${userName}! Fokus kembali pada log latihanmu.`,
      "Sentuhanmu tidak akan meningkatkan stat STR milikmu, Hunter.",
      "Ada yang mengganjal dalam pikiranmu? Katakan saja langsung lewat text input."
    ]
    const randomIdx = Math.floor(Math.random() * interactiveTexts.length)
    const reply = interactiveTexts[randomIdx]
    
    setMessages(prev => [...prev, { sender: 'seolha', text: `*[SYSTEM NOTIFICATION: Anda menyentuh asisten Seolha]*\n\n"${reply}"`, mediaSources: null }])
    speakText(reply)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#000000] p-4 max-w-lg mx-auto select-none">
      <ScrollbarStyles />
      
      {/* HEADER UTAMA */}
      <div className="flex items-center justify-between pb-2 border-b border-[#211D2C]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="font-display font-bold text-text-high tracking-wider">Seolha</span>
          <span className="font-mono text-[10px] text-text-dim uppercase">AI Mentor</span>
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

      {/* AVATAR CONTAINER */}
      <div className="mt-2.5 flex flex-col items-center justify-center p-2 bg-[#100E16] border border-[#211D2C] rounded-lg relative overflow-hidden">
        <div onClick={handleAvatarTap} className="w-24 h-24 rounded-full border-2 border-accent/40 bg-black/60 overflow-hidden cursor-pointer active:scale-95 transition-transform flex items-center justify-center shadow-[0_0_15px_rgba(124,92,255,0.15)]">
          <img src={AVATAR_LINKS[avatarState]} alt="Seolha State" className="w-full h-full object-cover" />
        </div>
        <div className="mt-1 font-mono text-[9px] text-text-dim uppercase tracking-widest bg-black/40 px-2 py-1.5 border border-[#211D2C] rounded">
          Status: <span className="text-accent font-black">{avatarState}</span>
        </div>
      </div>

      {/* AREA TEXT ROOM CHAT */}
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
          <div className="flex justify-start">
            <div className="bg-[#100E16] border border-[#211D2C] p-3 rounded-xl flex items-center gap-2 font-mono text-xs text-text-dim">
              <Loader2 size={12} className="animate-spin text-accent" />
              Seolha sedang berpikir...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FAQ SLIDER BAR */}
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

      {/* INPUT FORM */}
      <form onSubmit={(e) => handleSend(e)} className="pt-2 border-t border-[#211D2C] flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya Seolha..." className="flex-1 bg-[#0A0A0E] border border-[#211D2C] px-4 py-2.5 text-sm text-text-high focus:outline-none focus:border-accent" />
        <button type="submit" disabled={loading || !input.trim()} className="w-11 h-11 bg-accent flex items-center justify-center text-white"><Send size={16} /></button>
      </form>
    </div>
  )
}
