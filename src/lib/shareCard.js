function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = url
  })
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh
  if (imgRatio > boxRatio) {
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export async function generateShareCard({ profile, entry, level, streak }) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')

  const bg = '#0A0A0E'
  const panel = '#100E16'
  const border = '#211D2C'
  const accent = '#7C5CFF'
  const accentJade = '#2DD4BF'
  const textHigh = '#EDEAF6'
  const textMuted = '#8B8696'
  const rankColors = { S: '#7C5CFF', A: '#2DD4BF', B: '#4ADE80', C: '#FACC15', D: '#FB923C', E: '#F87171' }

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1920)

  const drawCornerBrackets = (x, y, w, h, size = 24, color = accent) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y)
    ctx.moveTo(x + w - size, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + size)
    ctx.moveTo(x, y + h - size); ctx.lineTo(x, y + h); ctx.lineTo(x + size, y + h)
    ctx.moveTo(x + w - size, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - size)
    ctx.stroke()
  }

  ctx.fillStyle = panel
  ctx.fillRect(60, 80, 960, 1760)
  drawCornerBrackets(60, 80, 960, 1760, 32)

  ctx.font = '700 72px Rajdhani, sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'center'
  ctx.fillText('DAILY GRIND LOG', 540, 200)

  ctx.font = '500 36px Inter, sans-serif'
  ctx.fillStyle = textMuted
  ctx.fillText('Training Record', 540, 260)

  let contentY = 320
  let imageLoadFailed = false

  if (entry.image_url) {
    try {
      const img = await loadImage(entry.image_url)
      const imgX = 120, imgW = 840, imgH = 420
      drawImageCover(ctx, img, imgX, contentY, imgW, imgH)
      drawCornerBrackets(imgX, contentY, imgW, imgH, 24, accent)
      contentY += imgH + 40
    } catch (e) {
      console.error('Gagal memuat gambar entry untuk share card (CORS/network):', e)
      imageLoadFailed = true
    }
  }

  const rankColor = rankColors[entry.rank] || accent
  const rankBoxY = contentY
  ctx.fillStyle = rankColor + '33'
  ctx.fillRect(120, rankBoxY, 840, 200)
  drawCornerBrackets(120, rankBoxY, 840, 200, 20, rankColor)

  ctx.font = '700 120px Rajdhani, sans-serif'
  ctx.fillStyle = rankColor
  ctx.textAlign = 'center'
  ctx.fillText(entry.rank, 540, rankBoxY + 150)

  ctx.font = '600 52px Rajdhani, sans-serif'
  ctx.fillStyle = textHigh
  ctx.textAlign = 'center'
  const titleY = rankBoxY + 260
  const titleLines = wrapText(ctx, entry.title, 800, '600 52px Rajdhani, sans-serif')
  titleLines.forEach((line, i) => {
    ctx.fillText(line, 540, titleY + i * 60)
  })

  const statsY = titleY + 60 + (titleLines.length - 1) * 60
  const stats = [
    { label: 'DAY', value: `#${entry.day_number}` },
    { label: 'CATEGORY', value: entry.category },
    { label: 'DURATION', value: entry.duration || '—' },
  ]

  stats.forEach((stat, i) => {
    const x = 120 + i * 300
    ctx.fillStyle = border
    ctx.fillRect(x, statsY, 260, 120)
    ctx.font = '500 28px JetBrains Mono, monospace'
    ctx.fillStyle = textMuted
    ctx.textAlign = 'center'
    ctx.fillText(stat.label, x + 130, statsY + 42)
    ctx.font = '600 38px JetBrains Mono, monospace'
    ctx.fillStyle = textHigh
    ctx.fillText(stat.value, x + 130, statsY + 95)
  })

  let noteBottomY = statsY + 160
  if (entry.note) {
    const noteY = noteBottomY
    ctx.font = '400 34px Inter, sans-serif'
    ctx.fillStyle = textMuted
    ctx.textAlign = 'left'
    const noteLines = wrapText(ctx, entry.note, 800, '400 34px Inter, sans-serif')
    noteLines.slice(0, 5).forEach((line, i) => {
      ctx.fillText(line, 140, noteY + i * 48)
    })
    noteBottomY = noteY + noteLines.slice(0, 5).length * 48
  }

  const profileY = Math.max(1600, noteBottomY + 40)
  ctx.fillStyle = accent
  ctx.fillRect(120, profileY, 6, 80)
  ctx.font = '600 48px Rajdhani, sans-serif'
  ctx.fillStyle = textHigh
  ctx.textAlign = 'left'
  ctx.fillText(profile?.name || 'Trainer', 140, profileY + 54)

  ctx.font = '500 32px JetBrains Mono, monospace'
  ctx.fillStyle = accentJade
  ctx.fillText(`LVL ${level}  •  ${streak} DAY STREAK`, 140, profileY + 100)

  ctx.font = '400 28px Inter, sans-serif'
  ctx.fillStyle = textMuted
  ctx.textAlign = 'center'
  ctx.fillText('daily-grind-log.app', 540, 1840)

  let dataUrl
  try {
    dataUrl = canvas.toDataURL('image/png')
  } catch (e) {
    console.error('Canvas tainted, gagal export share card:', e)
    throw new Error('CANVAS_TAINTED')
  }

  return { dataUrl, imageLoadFailed }
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0] || ''
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  lines.push(currentLine)
  return lines
}
