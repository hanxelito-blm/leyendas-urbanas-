import { useEffect, useRef, useState } from 'react'

const CHOICES = [
  ['A', 'Seguir al jinete en la penumbra', 'B', 'Encender un fósforo y mirar su rostro'],
  ['A', 'Cruzar el puente a medianoche',   'B', 'Esperar en silencio hasta el amanecer'],
  ['A', 'Entrar al sanatorio abandonado',  'B', 'Llamar a los espíritus con el péndulo'],
  ['A', 'Seguir el llanto hacia el río',   'B', 'Rezar en silencio y no voltear'],
]

function StoryModal({ legend, onClose, isDiscovered }) {
  const modalRef  = useRef(null)
  const closeBtnRef = useRef(null)
  const [chosen, setChosen] = useState(null)
  
  // Audio state & refs
  const audioRef = useRef(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [is8D, setIs8D] = useState(true)
  const webAudioRef = useRef({ ctx: null, panner: null, source: null, rafId: null })

  // Format time MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs) || !secs) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Setup Web Audio 8D panning
  const init8D = () => {
    if (!audioRef.current || webAudioRef.current.source) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const source = ctx.createMediaElementSource(audioRef.current)
      
      let panner = null
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner()
        source.connect(panner)
        panner.connect(ctx.destination)
      } else {
        source.connect(ctx.destination)
      }
      
      webAudioRef.current = { ctx, panner, source, rafId: null }
    } catch {
      // Browser audio graph policy fallback
    }
  }

  // Animate 8D panning back and forth
  useEffect(() => {
    const { ctx, panner } = webAudioRef.current
    if (audioPlaying && is8D && panner && ctx) {
      if (ctx.state === 'suspended') ctx.resume()
      let angle = 0
      const animatePan = () => {
        angle += 0.03
        // Pan smoothly between left (-0.85) and right (0.85)
        panner.pan.value = Math.sin(angle) * 0.85
        webAudioRef.current.rafId = requestAnimationFrame(animatePan)
      }
      webAudioRef.current.rafId = requestAnimationFrame(animatePan)
    } else {
      if (webAudioRef.current.rafId) {
        cancelAnimationFrame(webAudioRef.current.rafId)
        webAudioRef.current.rafId = null
      }
      if (panner) panner.pan.value = 0
    }
    return () => {
      if (webAudioRef.current.rafId) {
        cancelAnimationFrame(webAudioRef.current.rafId)
        webAudioRef.current.rafId = null
      }
    }
  }, [audioPlaying, is8D])

  // Play / Pause toggle
  const toggleAudio = () => {
    if (!audioRef.current) return
    init8D()
    if (audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    } else {
      if (webAudioRef.current.ctx && webAudioRef.current.ctx.state === 'suspended') {
        webAudioRef.current.ctx.resume()
      }
      audioRef.current.play()
        .then(() => setAudioPlaying(true))
        .catch(err => {
          console.warn('Audio play prevented:', err)
          setAudioPlaying(false)
        })
    }
  }

  // Reset audio when legend changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setAudioPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [legend?.id])

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (webAudioRef.current.rafId) {
        cancelAnimationFrame(webAudioRef.current.rafId)
      }
    }
  }, [])

  // Pick a pair of choices based on legend id
  const choicePair = CHOICES[Math.abs((legend?.id?.charCodeAt(9) || 0) % CHOICES.length)]

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!legend) return null

  // Acepta el formato nuevo de `db.json` (legend.danger) y el histórico
  // (legend.dangerLevel) para que el aviso funcione con ambos catálogos.
  const dangerLevel = legend.danger?.level ?? legend.dangerLevel ?? 0
  const dangerLabel = legend.danger?.label ?? legend.dangerLabel ?? ''
  const dangerText = legend.danger?.description ?? legend.dangerDescription ?? ''
  const dangerAdvice = legend.danger?.advice ?? ''
  const dangerTone =
    dangerLevel >= 4
      ? { bg: 'rgba(208,43,60,0.12)', border: 'rgba(208,43,60,0.45)', text: '#ef4444' }
      : dangerLevel === 3
        ? { bg: 'rgba(224,99,43,0.12)', border: 'rgba(224,99,43,0.45)', text: '#f97316' }
        : dangerLevel === 2
          ? { bg: 'rgba(224,169,59,0.12)', border: 'rgba(224,169,59,0.45)', text: '#eab308' }
          : { bg: 'rgba(59,206,122,0.12)', border: 'rgba(59,206,122,0.45)', text: '#3BCE7A' }

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="legend-title"
        className="relative w-[96%] max-w-[960px] my-auto rounded-2xl border border-[rgba(0,245,212,0.3)] shadow-[0_0_80px_rgba(0,0,0,0.98),0_0_40px_rgba(0,245,212,0.12)] bg-[rgba(5,13,9,0.99)] backdrop-blur-2xl"
        style={{
          animation: 'modal-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Cerrar historia"
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 30,
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(5,13,9,0.92)',
            border: '1px solid rgba(0,245,212,0.35)',
            color: '#9ca3af', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(0,0,0,0.7)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#00F5D4'; e.currentTarget.style.borderColor = 'rgba(0,245,212,0.8)'; e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.borderColor = 'rgba(0,245,212,0.35)'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Responsive grid: 1 column on mobile, 2 columns on laptop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 pt-8 sm:pt-9">
          {/* COLUMNA IZQUIERDA: Imagen, Reproductor de audio y Alerta de Peligro */}
          <div className="md:col-span-5 flex flex-col gap-4">
            {/* Hero image */}
            <div className="relative h-60 sm:h-64 rounded-xl overflow-hidden border border-[rgba(0,245,212,0.2)] shadow-lg">
              {legend.imageUrl ? (
                <img
                  src={legend.imageUrl}
                  alt={legend.title}
                  className="w-full h-full object-cover filter brightness-[0.82] contrast-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#020504] to-[#08120F]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,13,9,0.95)] via-transparent to-black/20" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px]">
                <span className="text-[#00F5D4] font-semibold">📍 {legend.locationName}</span>
                <span className="text-gray-400 font-mono text-[10px]">{legend.yearOrEra}</span>
              </div>
            </div>

            {/* Audio player */}
            <div style={{
              background: 'rgba(0,245,212,0.06)',
              border: '1px solid rgba(0,245,212,0.25)',
              borderRadius: 12,
              padding: '12px 14px',
              boxShadow: audioPlaying ? '0 0 15px rgba(0,245,212,0.15)' : 'none',
              transition: 'box-shadow 0.3s ease',
            }}>
              <audio
                ref={audioRef}
                src={legend.audioUrl || `/audio/${legend.id}.mp3`}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime)
                    if (!duration && audioRef.current.duration) {
                      setDuration(audioRef.current.duration)
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration)
                  }
                }}
                onEnded={() => {
                  setAudioPlaying(false)
                  setCurrentTime(0)
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={toggleAudio}
                    aria-label={audioPlaying ? "Pausar narración" : "Reproducir narración"}
                    style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: audioPlaying ? 'rgba(0,245,212,0.3)' : 'rgba(0,245,212,0.12)',
                      border: '1px solid rgba(0,245,212,0.5)',
                      color: '#00F5D4', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: audioPlaying ? '0 0 12px rgba(0,245,212,0.5)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {audioPlaying ? (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
                        Narración
                      </span>
                      {audioPlaying && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
                          <span className="audio-eq-bar bar-1" />
                          <span className="audio-eq-bar bar-2" />
                          <span className="audio-eq-bar bar-3" />
                          <span className="audio-eq-bar bar-4" />
                        </div>
                      )}
                    </div>
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* 8D Effect indicator */}
                <button
                  onClick={() => setIs8D(v => !v)}
                  title="Simulación binaural envolvente"
                  style={{
                    background: is8D ? 'rgba(0,245,212,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${is8D ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 14,
                    padding: '3px 7px',
                    color: is8D ? '#00F5D4' : '#6b7280',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <span>🎧</span>
                  <span>8D {is8D ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  position: 'relative',
                  height: 5,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
                onClick={e => {
                  if (!audioRef.current || !duration) return
                  const rect = e.currentTarget.getBoundingClientRect()
                  const clickX = e.clientX - rect.left
                  const newTime = Math.max(0, Math.min(duration, (clickX / rect.width) * duration))
                  audioRef.current.currentTime = newTime
                  setCurrentTime(newTime)
                }}
              >
                <div style={{
                  height: '100%',
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #00F5D4, #00bfa0)',
                  borderRadius: 3,
                  boxShadow: '0 0 10px rgba(0,245,212,0.6)',
                  transition: 'width 0.1s linear',
                }} />
              </div>
            </div>

            {/* Danger Warning */}
            {dangerLevel > 0 && (
              <div style={{
                background: dangerTone.bg,
                border: `1px solid ${dangerTone.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}>
                <div style={{ color: dangerTone.text, marginTop: 2 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p style={{
                    color: dangerTone.text,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2
                  }}>
                    Alerta: {dangerLabel} (Nivel {dangerLevel}/4)
                  </p>
                  {dangerText && (
                    <p style={{ color: '#d1d5db', fontSize: 11, lineHeight: 1.4 }}>
                      {dangerText}
                    </p>
                  )}
                  {dangerAdvice && (
                    <p style={{ color: '#d1d5db', fontSize: 11, lineHeight: 1.4, marginTop: 3 }}>
                      <strong style={{ color: dangerTone.text }}>Consejo:</strong> {dangerAdvice}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Título, Badges, Historia completa y Elecciones */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* Badges */}
              <div className="flex gap-2 flex-wrap items-center mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(0,245,212,0.1)] border border-[rgba(0,245,212,0.3)] text-[#00F5D4]">
                  {legend.province}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(0,245,212,0.1)] border border-[rgba(0,245,212,0.3)] text-[#00F5D4]">
                  {legend.category}
                </span>
                {legend.yearOrEra && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/40 text-gray-400 border border-gray-700">
                    {legend.yearOrEra}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 id="legend-title"
                className="text-2xl sm:text-3xl font-bold text-white tracking-wide font-cinzel mb-3 leading-tight"
                style={{
                  textShadow: '0 0 20px rgba(0,245,212,0.35)',
                }}
              >
                {legend.title.toUpperCase()}
              </h1>

              {/* Story text */}
              <div className="text-gray-300 text-sm leading-relaxed mb-5 pr-1 max-h-[300px] overflow-y-auto scrollbar-thin">
                <p className="mb-3 text-[#00F5D4] italic font-serif text-sm">
                  "{legend.shortDescription}"
                </p>
                <p>
                  {legend.fullStory}
                </p>
              </div>

              {/* Interactive choices */}
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(0,245,212,0.15)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}>
                <p style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e5e7eb',
                  letterSpacing: '0.12em',
                  textAlign: 'center',
                  marginBottom: 10,
                }}>
                  ¿QUÉ HARÍAS EN ESTE SITIO?
                </p>

                {[choicePair[0], choicePair[2]].map((letter, i) => {
                  const label = i === 0 ? choicePair[1] : choicePair[3]
                  const isChosen = chosen === letter
                  return (
                    <button key={letter}
                      onClick={() => setChosen(letter)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', marginBottom: i === 0 ? 8 : 0,
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: isChosen ? 'rgba(0,245,212,0.12)' : 'rgba(0,0,0,0.5)',
                        border: `1px solid ${isChosen ? 'rgba(0,245,212,0.6)' : 'rgba(0,245,212,0.2)'}`,
                        color: isChosen ? '#00F5D4' : '#9ca3af',
                        transition: 'all 0.2s',
                        textAlign: 'left', fontSize: 12,
                        boxShadow: isChosen ? '0 0 12px rgba(0,245,212,0.2)' : 'none',
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                        background: isChosen ? 'rgba(0,245,212,0.25)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isChosen ? '#00F5D4' : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: isChosen ? '#00F5D4' : '#6b7280',
                        fontFamily: "'Cinzel', serif",
                      }}>
                        {letter}
                      </span>
                      <span>{label}</span>
                    </button>
                  )
                })}

                {chosen && (
                  <p style={{
                    marginTop: 10, padding: '8px 12px',
                    background: 'rgba(0,245,212,0.06)', borderRadius: 6,
                    color: '#00CCB0', fontSize: 11, fontStyle: 'italic',
                    borderLeft: '2px solid rgba(0,245,212,0.4)',
                  }}>
                    {chosen === choicePair[0]
                      ? 'Tu destino está sellado... la oscuridad te llama.'
                      : 'El silencio se rompe. Algo se acerca desde las sombras.'}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11,
                background: isDiscovered ? 'rgba(0,245,212,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isDiscovered ? 'rgba(0,245,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: isDiscovered ? '#00F5D4' : '#6b7280',
              }}>
                {isDiscovered ? '✓ Historia Descubierta' : '○ Nueva Historia'}
              </span>
              <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }}>
                Cerrar ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoryModal