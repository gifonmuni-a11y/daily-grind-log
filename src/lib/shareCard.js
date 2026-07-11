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
  // 🎯 SET RASIO KOTAK 1080x1080 UNTUK GENERATOR SHARE CARD
  canvas.width = 1080
  canvas.height = 1080
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
  ctx.fillRect(0, 0, 1080, 1080)

  const drawCornerBrackets = (x, y, w, h, size = 20, color = accent) => {
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
  ctx.fillRect(40, 40, 1000, 1000)
  drawCornerBrackets(40, 40, 1000, 1000, 24)

  ctx.font = '700 48px Rajdhani, sans-serif'
  ctx.fillStyle = accent
  ctx.textAlign = 'left'
  ctx.fillText('DAILY GRIND LOG', 80, 100)

  ctx.font = '500 24px Inter, sans-serif'
  ctx.fillStyle = textMuted
  ctx.fillText('TRAINING RECORD', 80, 140)

  let contentY = 180

  if (entry.image_url) {
    try {
      const img = await loadImage(entry.image_url)
      const imgX = 80, imgW = 340, imgH = 340
      drawImageCover(ctx, img, imgX, contentY, imgW, imgH)
      drawCornerBrackets(imgX, contentY, imgW, imgH, 16, accent)
    } catch (e) {
      console.error(e)
    }
  }

  const rankColor = rankColors[entry.rank] || accent
  ctx.fillStyle = rankColor + '22'
  ctx.fillRect(450, contentY, 550, 90)
  drawCornerBrackets(450, contentY, 550, 90, 14, rankColor)

  ctx.font = '700 54px Rajdhani, sans-serif'
  ctx.fillStyle = rankColor
  ctx.textAlign = 'center'
  ctx.fillText(`RANK: ${entry.rank}`, 725, contentY + 62)

  ctx.font = '600 36px Rajdhani, sans-serif'
  ctx.fillStyle = textHigh
  ctx.textAlign = 'left'
  ctx.fillText(entry.title || 'Untitled Session', 450, contentY + 140)

  ctx.font = '500 22px JetBrains Mono, monospace'
  ctx.fillStyle = textMuted
  ctx.fillText(`DAY #${entry.day_number}  |  ${entry.category || 'GENERAL'}  |  ${entry.duration || '—'}`, 450, contentY + 185)

  if (entry.note) {
    ctx.font = '400 22px Inter, sans-serif'
    ctx.fillStyle = textMuted
    const noteLines = wrapText(ctx, entry.note, 550, '400 22px Inter, sans-serif')
    noteLines.slice(0, 4).forEach((line, i) => {
      ctx.fillText(line, 450, contentY + 230 + i * 30)
    })
  }

  const footerY = 920
  ctx.fillStyle = accent
  ctx.fillRect(80, footerY, 4, 60)

  ctx.font = '600 36px Rajdhani, sans-serif'
  ctx.fillStyle = textHigh
  ctx.textAlign = 'left'
  ctx.fillText(profile?.name || 'Trainer', 95, footerY + 25)

  ctx.font = '500 24px JetBrains Mono, monospace'
  ctx.fillStyle = accentJade
  ctx.fillText(`LVL ${level}  •  ${streak} DAY STREAK`, 95, footerY + 52)

  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillStyle = textMuted
  ctx.textAlign = 'right'
  ctx.fillText('daily-grind-log.app', 1000, footerY + 40)

  return { dataUrl: canvas.toDataURL('image/png'), imageLoadFailed: false }
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font
  const words = text.split(' ')
  const lines = []
  let currentLine = words[0] || ''
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i]
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine)
      currentLine = words[i]
    } else {
      currentLine = testLine
    }
  }
  lines.push(currentLine)
  return lines
}
