export function buildDummyEntries(userId, maxDayNumber) {
  const now = new Date()
  const daysAgo = (n) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return d.toISOString()
  }

  const samples = [
    {
      title: 'Push Day - Chest & Triceps',
      note: 'PR bench press 60kg x 5. Fokus tempo, kontrol negatif lebih lama.',
      duration: '75 menit',
      rank: 'S',
      category: 'Push',
      daysAgo: 0,
    },
    {
      title: 'Pull Day - Back & Biceps',
      note: 'Deadlift terasa berat, tapi form tetap terjaga.',
      duration: '60 menit',
      rank: 'A',
      category: 'Pull',
      daysAgo: 1,
    },
    {
      title: 'Leg Day',
      note: 'Squat 5x5, agak lemas karena kurang tidur.',
      duration: '50 menit',
      rank: 'B',
      category: 'Legs',
      daysAgo: 2,
    },
    {
      title: 'Cardio - Lari Pagi',
      note: '5K, pace santai buat recovery.',
      duration: '30 menit',
      rank: 'C',
      category: 'Cardio',
      daysAgo: 3,
    },
    {
      title: 'Core & Mobility',
      note: 'Sesi ringan, banyak distraksi jadi kurang fokus.',
      duration: '25 menit',
      rank: 'D',
      category: 'Core/Abs',
      daysAgo: 4,
    },
  ]

  return samples.map((s, i) => ({
    user_id: userId,
    title: s.title,
    note: s.note,
    duration: s.duration,
    rank: s.rank,
    category: s.category,
    day_number: maxDayNumber + samples.length - i,
    entry_date: daysAgo(s.daysAgo),
    image_url: null,
  }))
}
