import { useRef, useEffect } from 'react'

export default function WaveCanvas({ engine, instruments, steps, vizMode }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const propsRef = useRef({ steps, vizMode })
  useEffect(() => {
    propsRef.current = { steps, vizMode }
  }, [steps, vizMode])

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current
    function resize() {
      const maxWave = 800
      const waveWidth = Math.min(maxWave, window.innerWidth - 20)
      const waveHeight = Math.max(200, Math.round(waveWidth * 300 / 800))
      canvas.width = waveWidth
      canvas.height = waveHeight
      canvas.style.width = waveWidth + 'px'
      canvas.style.height = waveHeight + 'px'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function drawFrame() {
      const eng = engine.current
      if (!eng) { animRef.current = requestAnimationFrame(drawFrame); return }

      const { steps: s, vizMode: mode } = propsRef.current
      const waveHistory = eng.getWaveHistory()
      const currentStep = eng.getCurrentStep()
      const isPlaying = eng.isPlayingNow()
      const { dataArray, bufferLength } = eng.getAnalyserData()

      const wW = canvas.width, wH = canvas.height
      ctx.fillStyle = '#121212'
      ctx.fillRect(0, 0, wW, wH)

      const time = Date.now() * 0.005

      if (mode === 'parallel') {
        const waveDrawWidth = wW - 70
        instruments.forEach((inst, i) => {
          const yBase = Math.round(wH * 0.133 + i * (wH * 0.217))

          // Label
          ctx.fillStyle = inst.color
          ctx.font = '12px Segoe UI'
          ctx.fillText(inst.name, 10, yBase + 5)

          // Base line
          ctx.beginPath()
          ctx.strokeStyle = inst.color + '40'
          ctx.moveTo(60, yBase)
          ctx.lineTo(wW - 10, yBase)
          ctx.stroke()

          // Active wave
          ctx.beginPath()
          ctx.strokeStyle = inst.color
          ctx.lineWidth = 2

          const historyLen = waveHistory[i].length
          for (let x = 0; x < waveDrawWidth; x++) {
            const histIdx = Math.floor((x / waveDrawWidth) * historyLen)
            const amplitude = waveHistory[i][histIdx] || 0
            const baseWave = Math.sin(x * 0.03 + time) * 3
            const y = yBase + baseWave + Math.sin(x * 0.1 + time * 2) * amplitude * 25

            if (x === 0) ctx.moveTo(60 + x, y)
            else ctx.lineTo(60 + x, y)
          }
          ctx.stroke()

          // Activity indicator
          if (s[i] && s[i][currentStep] !== 0 && isPlaying) {
            ctx.beginPath()
            ctx.arc(wW - 20, yBase, 8, 0, Math.PI * 2)
            ctx.fillStyle = inst.color
            ctx.fill()
          }
        })
      } else {
        // Master / Transcendental mode
        const waveCenterY = wH / 2

        ctx.fillStyle = '#121212'
        ctx.fillRect(0, 0, wW, wH)

        // Aura
        const aura = ctx.createRadialGradient(wW / 2, waveCenterY, 0, wW / 2, waveCenterY, wW / 2)
        aura.addColorStop(0, 'rgba(30, 30, 60, 0.2)')
        aura.addColorStop(1, 'rgba(18, 18, 18, 0)')
        ctx.fillStyle = aura
        ctx.fillRect(0, 0, wW, wH)

        // Master wave
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1.5

        const sliceWidth = wW / bufferLength
        let x = 0
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = waveCenterY + (v - 1) * (wH / 3) * Math.exp(-Math.pow((i - bufferLength / 2) / (bufferLength / 3), 2))
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
          x += sliceWidth
        }
        ctx.stroke()

        // Floating instrument colors
        instruments.forEach((inst, i) => {
          const amp = waveHistory[i][waveHistory[i].length - 1] || 0
          if (amp > 0.02) {
            ctx.beginPath()
            ctx.strokeStyle = inst.color
            ctx.globalAlpha = amp * 0.4
            ctx.lineWidth = 1

            for (let j = 0; j < bufferLength; j += 16) {
              const v = dataArray[j] / 128.0
              const h = (v - 1) * 60 + Math.sin(j * 0.02 + time + i) * 10
              const px = (j / bufferLength) * wW
              if (j === 0) ctx.moveTo(px, waveCenterY + h)
              else ctx.lineTo(px, waveCenterY + h)
            }
            ctx.stroke()
            ctx.globalAlpha = 1.0
          }
        })

        ctx.globalCompositeOperation = 'source-over'

        // Spectrum bars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        const barWidth = wW / 64
        for (let i = 0; i < 64; i++) {
          const idx = Math.floor(i * bufferLength / 64)
          const value = Math.abs(dataArray[idx] - 128) / 128
          const barHeight = value * 40
          const instIdx = Math.min(3, Math.floor(i / 16))
          ctx.fillStyle = instruments[instIdx].color + '60'
          ctx.fillRect(i * barWidth, wH - 20 - barHeight, barWidth - 1, barHeight)
        }

        // Instrument indicators
        instruments.forEach((inst, i) => {
          const xPos = Math.round(wW * 0.0625 + i * (wW * 0.225))
          ctx.beginPath()
          ctx.arc(xPos, wH - 20, 15, 0, Math.PI * 2)

          if (s[i] && s[i][currentStep] !== 0 && isPlaying) {
            ctx.fillStyle = inst.color
            ctx.fill()
            ctx.shadowColor = inst.color
            ctx.shadowBlur = 15
          } else {
            ctx.strokeStyle = inst.color + '50'
            ctx.stroke()
          }
          ctx.shadowBlur = 0

          ctx.fillStyle = (s[i] && s[i][currentStep] !== 0 && isPlaying) ? '#000' : inst.color
          ctx.font = '10px Segoe UI'
          ctx.textAlign = 'center'
          ctx.fillText(inst.name, xPos, wH - 16)
          ctx.textAlign = 'left'
        })
      }

      animRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()
    return () => cancelAnimationFrame(animRef.current)
  }, [engine, instruments])

  return <canvas ref={canvasRef} width="800" height="300" />
}
