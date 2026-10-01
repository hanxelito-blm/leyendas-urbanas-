import { useEffect, useRef } from 'react'

/**
 * MedievalHorrorBackground
 * -----------------------------------------------------------------------------
 * Fondo animado tenebroso optimizado:
 * - Niebla espectral y siluetas oscuras de bosque maldito.
 * - Almas en pena (fuegos fatuos / orbes espectrales) flotando en la penumbra.
 * - Destellos sutiles de relámpago lejano y runas arcanas flotantes.
 * -----------------------------------------------------------------------------
 */
export default function MedievalHorrorBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const onResize = () => {
      if (!canvas) return
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    // Runas ancestrales
    const runesList = ['☩', '☽', '☠', '᚛', '᚜', '🜂', '🜏', '☥', '☾', '🕯']

    // Cruces y lápidas para el cementerio animado
    const crossCount = 8
    const crosses = Array.from({ length: crossCount }, () => ({
      x: Math.random() * w,
      y: h + 40 + Math.random() * 200,
      size: Math.random() * 30 + 35,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.25 + 0.15),
      alpha: Math.random() * 0.3 + 0.1,
      pulse: Math.random() * Math.PI,
      tilt: (Math.random() - 0.5) * 0.15,
      tiltDir: Math.random() > 0.5 ? 1 : -1,
    }))

    const tombCount = 6
    const tombs = Array.from({ length: tombCount }, () => ({
      x: Math.random() * w,
      y: h + 30 + Math.random() * 180,
      w: Math.random() * 40 + 50,
      h: Math.random() * 60 + 70,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(Math.random() * 0.2 + 0.1),
      alpha: Math.random() * 0.25 + 0.08,
      pulse: Math.random() * Math.PI,
      text: ['RIP', 'AQUI', 'DESCANSA', 'EJEMPLO', 'ETE', 'RIP'][Math.floor(Math.random() * 6)],
    }))

    // Almas en pena (fuegos fatuos tenebrosos)
    const wispCount = 6
    const wisps = Array.from({ length: wispCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 80 + 50,
      hue: Math.random() > 0.4 ? '0, 245, 212' : '220, 38, 38', // verde espectral o rojo sangre
      pulse: Math.random() * Math.PI,
    }))

    // Brasas ascendentes
    const embers = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.8,
      speedY: Math.random() * 0.6 + 0.25,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI,
    }))

    // Runas flotantes
    const runes = Array.from({ length: 10 }, () => ({
      char: runesList[Math.floor(Math.random() * runesList.length)],
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 14 + 14,
      vy: -(Math.random() * 0.2 + 0.08),
      alpha: Math.random() * 0.2 + 0.05,
      angle: (Math.random() - 0.5) * 0.25,
    }))

    let time = 0
    let flashAlpha = 0
    let nextFlash = 400 + Math.random() * 500

    const loop = () => {
      time += 0.015
      ctx.clearRect(0, 0, w, h)

      // 1. Destello sutil de relámpago lejano
      if (--nextFlash <= 0) {
        flashAlpha = 0.09
        nextFlash = 600 + Math.random() * 600
      }
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(0, 245, 212, ${flashAlpha})`
        ctx.fillRect(0, 0, w, h)
        flashAlpha -= 0.003
      }

      // 2. Fuegos fatuos (orbes espectrales errantes)
      wisps.forEach((wisp) => {
        wisp.x += wisp.vx
        wisp.y += wisp.vy
        if (wisp.x < -wisp.radius) wisp.x = w + wisp.radius
        if (wisp.x > w + wisp.radius) wisp.x = -wisp.radius
        if (wisp.y < -wisp.radius) wisp.y = h + wisp.radius
        if (wisp.y > h + wisp.radius) wisp.y = -wisp.radius

        const a = (0.04 + 0.025 * Math.sin(time * 2 + wisp.pulse))
        const g = ctx.createRadialGradient(wisp.x, wisp.y, 0, wisp.x, wisp.y, wisp.radius)
        g.addColorStop(0, `rgba(${wisp.hue}, ${a * 1.5})`)
        g.addColorStop(0.5, `rgba(${wisp.hue}, ${a * 0.5})`)
        g.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(wisp.x, wisp.y, wisp.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 3. Runas arcanas
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      runes.forEach((r) => {
        r.y += r.vy
        if (r.y < -30) {
          r.y = h + 30
          r.x = Math.random() * w
        }
        const a = r.alpha + Math.sin(time * 1.5 + r.x) * 0.03
        ctx.save()
        ctx.translate(r.x, r.y)
        ctx.rotate(r.angle)
        ctx.font = `${r.size}px 'Cinzel', serif`
        ctx.fillStyle = `rgba(0, 245, 212, ${Math.max(0.02, a)})`
        ctx.shadowColor = 'rgba(0, 245, 212, 0.4)'
        ctx.shadowBlur = 8
        ctx.fillText(r.char, 0, 0)
        ctx.restore()
      })

      // 4. Brasas tenebrosas
      embers.forEach((e) => {
        e.y -= e.speedY
        if (e.y < -10) {
          e.y = h + 10
          e.x = Math.random() * w
        }
        const a = e.alpha * (0.6 + 0.4 * Math.sin(time * 3 + e.pulse))
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 245, 212, ${a})`
        ctx.shadowColor = '#00F5D4'
        ctx.shadowBlur = 6
        ctx.fill()
      })

      // 5. Cruces flotantes (cementerio espectral)
      crosses.forEach((c) => {
        c.x += c.vx
        c.y += c.vy
        c.tilt += c.tiltDir * 0.002
        if (c.tilt > 0.15) c.tiltDir = -1
        if (c.tilt < -0.15) c.tiltDir = 1

        if (c.y < -c.size - 40) {
          c.y = h + 40 + Math.random() * 200
          c.x = Math.random() * w
          c.vx = (Math.random() - 0.5) * 0.15
          c.vy = -(Math.random() * 0.25 + 0.15)
        }
        if (c.x < -c.size) c.x = w + c.size
        if (c.x > w + c.size) c.x = -c.size

        const a = c.alpha + 0.04 * Math.sin(time * 1.8 + c.pulse)
        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate(c.tilt)
        ctx.strokeStyle = `rgba(200, 220, 215, ${a})`
        ctx.lineWidth = Math.max(1.5, c.size / 24)
        ctx.lineCap = 'round'
        ctx.shadowColor = 'rgba(0, 245, 212, 0.3)'
        ctx.shadowBlur = 8
        // Travesaño vertical
        ctx.beginPath()
        ctx.moveTo(0, -c.size * 0.6)
        ctx.lineTo(0, c.size * 0.6)
        ctx.stroke()
        // Travesaño horizontal
        ctx.beginPath()
        ctx.moveTo(-c.size * 0.35, -c.size * 0.15)
        ctx.lineTo(c.size * 0.35, -c.size * 0.15)
        ctx.stroke()
        ctx.restore()
      })

      // 6. Lápidas flotantes
      tombs.forEach((t) => {
        t.x += t.vx
        t.y += t.vy

        if (t.y < -t.h - 40) {
          t.y = h + 30 + Math.random() * 180
          t.x = Math.random() * w
          t.vx = (Math.random() - 0.5) * 0.12
          t.vy = -(Math.random() * 0.2 + 0.1)
        }
        if (t.x < -t.w) t.x = w + t.w
        if (t.x > w + t.w) t.x = -t.w

        const a = t.alpha + 0.03 * Math.sin(time * 1.5 + t.pulse)
        ctx.save()
        ctx.translate(t.x, t.y)
        ctx.fillStyle = `rgba(80, 95, 90, ${a})`
        ctx.strokeStyle = `rgba(120, 140, 130, ${a * 0.6})`
        ctx.lineWidth = 1.5
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 6
        // Base de la lápida
        ctx.beginPath()
        ctx.moveTo(-t.w * 0.5, 0)
        ctx.lineTo(-t.w * 0.5, -t.h * 0.7)
        ctx.quadraticCurveTo(-t.w * 0.5, -t.h, 0, -t.h)
        ctx.quadraticCurveTo(t.w * 0.5, -t.h, t.w * 0.5, -t.h * 0.7)
        ctx.lineTo(t.w * 0.5, 0)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        // Texto RIP
        ctx.fillStyle = `rgba(180, 195, 190, ${a * 1.2})`
        ctx.font = `${Math.max(10, t.w * 0.2)}px 'Cinzel', serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(t.text, 0, -t.h * 0.4)
        ctx.restore()
      })

      animId = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      {/* Fondo base oscuro siniestro */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#010403',
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(13, 46, 38, 0.4) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 10% 100%, rgba(139, 30, 30, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 90% 100%, rgba(4, 77, 61, 0.25) 0%, transparent 60%),
            linear-gradient(180deg, #010403 0%, #040d09 50%, #010302 100%)
          `,
        }}
      />

      {/* Canvas interactivo de espíritus y bruma */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Niebla continua tenebrosa */}
      <div className="medieval-fog-layer medieval-fog-1" />
      <div className="medieval-fog-layer medieval-fog-2" />

      {/* Siluetas de ramas de bosque oscuro y viñeta perimetral de terror */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 160px rgba(0, 0, 0, 0.98), inset 0 0 80px rgba(1, 8, 6, 0.85)',
          background: 'radial-gradient(circle at center, transparent 40%, rgba(1, 4, 3, 0.65) 75%, rgba(0, 2, 1, 0.97) 100%)',
        }}
      />
    </div>
  )
}
