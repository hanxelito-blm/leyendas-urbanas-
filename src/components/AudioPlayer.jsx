import { useState, useRef, useEffect } from 'react'

function AudioPlayer({ src, ambientSrc, title, isAmbient = false }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(isAmbient ? 0.3 : 0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [buffered, setBuffered] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1))
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setIsPlaying(false)
      console.error('Error loading audio:', src)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('progress', handleProgress)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.volume = isMuted ? 0 : volume

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('progress', handleProgress)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [src, volume, isMuted])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        setIsPlaying(false)
        console.error('Error playing audio:', error)
      })
    }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    audio.currentTime = pos * audio.duration
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  return (
    <div className={`glass-card border-blood/20 p-4 ${isAmbient ? 'border-neon-red/20' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isAmbient ? 'bg-neon-red/10 border border-neon-red/30' : 'bg-blood/20 border border-blood/30'}`}>
          <svg className="w-5 h-5 text-neon-red" fill="currentColor" viewBox="0 0 24 24">
            {isAmbient ? (
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            ) : (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            )}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          <p className="text-xs text-gray-400">{isAmbient ? 'Sonido ambiental continuo' : 'Narración de la leyenda'}</p>
        </div>
      </div>

      <div className="relative h-2 bg-dark-border rounded-full mb-2 overflow-hidden" onClick={handleSeek}>
        <div
          className="absolute top-0 left-0 h-full bg-blood/30 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-neon-red to-blood rounded-full transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-neon-red shadow-lg transition-all duration-75 ${
            isPlaying ? 'scale-100' : 'scale-75'
          }`}
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-neon-red font-mono w-10 text-right">{formatTime(currentTime)}</span>
        <span className="text-gray-400 font-mono w-10">{formatTime(duration)}</span>

        <div className="relative flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-1 text-gray-400 hover:text-neon-red transition-colors"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 01-1 1zm14 0h1a1 1 0 001-1v-4a1 1 0 00-1-1h-1a1 1 0 00-1 1v4a1 1 0 001 1z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1a1 1 0 011 1v4a1 1 0 01-1 1zm14 0h1a1 1 0 001-1v-4a1 1 0 00-1-1h-1a1 1 0 00-1 1v4a1 1 0 001 1z" />
              </svg>
            )}
          </button>
          <div
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-bg border border-dark-border/50 rounded-lg opacity-0 pointer-events-none transition-all duration-200 ${showVolume ? 'opacity-100 pointer-events-auto' : ''}`}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
              className="w-32 h-2 appearance-none bg-dark-border rounded-lg accent-neon-red cursor-pointer"
              aria-label="Volumen"
            />
          </div>
        </div>

        <button
          onClick={togglePlay}
          className={`ml-auto w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isPlaying
              ? 'bg-neon-red text-white hover:shadow-[0_0_15px_rgba(255,7,58,0.6)]'
              : 'bg-blood/20 border border-blood/30 text-blood-light hover:bg-blood/30'
          }`}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        loop={isAmbient}
      />
    </div>
  )
}

export default AudioPlayer