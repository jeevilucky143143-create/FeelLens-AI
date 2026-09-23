import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { Camera, VideoOff, Upload, Play, AlertCircle, CheckCircle2, Zap } from 'lucide-react'
import EmotionBars, { EMOTION_EMOJI } from '../components/EmotionBars'
import { HistoryContext } from '../App'

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : ''

export default function Detection() {
  const { addToHistory, settings } = useContext(HistoryContext)

  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Model ready')
  const [statusType, setStatusType] = useState('ready') // 'ready' | 'busy' | 'error'
  const [activeSource, setActiveSource] = useState('none') // 'camera' | 'upload' | 'none'
  const [uploadedSrc, setUploadedSrc] = useState(null)

  const [primaryEmotion, setPrimaryEmotion] = useState('No face detected')
  const [primaryConfidence, setPrimaryConfidence] = useState('Waiting for input')
  const [facesCount, setFacesCount] = useState(0)
  const [latency, setLatency] = useState('-- ms')
  const [probabilities, setProbabilities] = useState({})

  const videoRef = useRef(null)
  const overlayRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageElementRef = useRef(null)
  const streamRef = useRef(null)
  const liveIntervalRef = useRef(null)
  const isAnalyzingRef = useRef(false)

  isAnalyzingRef.current = isAnalyzing

  const clearOverlay = useCallback(() => {
    const canvas = overlayRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setIsLive(false)
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
    }
    setActiveSource((prev) => (prev === 'camera' ? 'none' : prev))
    setStatusMessage('Ready')
    setStatusType('ready')
  }, [])

  const startCamera = async () => {
    if (isCameraActive) {
      stopCamera()
      return
    }

    try {
      setUploadedSrc(null)
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          deviceId: settings?.cameraId ? { exact: settings.cameraId } : undefined,
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsCameraActive(true)
      setActiveSource('camera')
      setStatusMessage('Camera active')
      setStatusType('ready')
      clearOverlay()
    } catch (err) {
      setStatusMessage('Camera error: ' + err.message)
      setStatusType('error')
    }
  }

  const drawDetections = useCallback((detections, naturalWidth, naturalHeight) => {
    const canvas = overlayRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    if (!naturalWidth || !naturalHeight) return

    const containerRatio = rect.width / rect.height
    const mediaRatio = naturalWidth / naturalHeight

    let renderedX = 0
    let renderedY = 0
    let renderedW = rect.width
    let renderedH = rect.height

    if (mediaRatio > containerRatio) {
      renderedH = rect.width / mediaRatio
      renderedY = (rect.height - renderedH) / 2
    } else {
      renderedW = rect.height * mediaRatio
      renderedX = (rect.width - renderedW) / 2
    }

    const scaleX = renderedW / naturalWidth
    const scaleY = renderedH / naturalHeight

    detections.forEach((det) => {
      const box = det.box
      const x = renderedX + box.x * scaleX
      const y = renderedY + box.y * scaleY
      const w = box.width * scaleX
      const h = box.height * scaleY
      const label = `${det.emotion} ${det.confidence.toFixed(1)}%`

      ctx.lineWidth = 3
      ctx.strokeStyle = '#22c55e'
      ctx.strokeRect(x, y, w, h)

      ctx.font = '700 14px system-ui, sans-serif'
      const textWidth = ctx.measureText(label).width
      const labelY = Math.max(y - 28, 4)

      ctx.fillStyle = '#0f766e'
      ctx.fillRect(x, labelY, textWidth + 16, 24)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, x + 8, labelY + 17)
    })

    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }, [])

  const analyzeFrame = useCallback(async () => {
    if (isAnalyzingRef.current) return

    setIsAnalyzing(true)
    setStatusMessage('Analyzing...')
    setStatusType('busy')
    const start = performance.now()

    try {
      const isUpload = activeSource === 'upload'
      const source = isUpload ? imageElementRef.current : videoRef.current
      if (!source) {
        throw new Error('No video or image source available.')
      }

      const width = isUpload ? source.naturalWidth : source.videoWidth
      const height = isUpload ? source.naturalHeight : source.videoHeight
      if (!width || !height) {
        throw new Error('Frame dimensions unavailable.')
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(source, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88)

      const endpoint = `${API_BASE}/predict`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Inference failed')
      }

      const dur = Math.round(performance.now() - start)
      setLatency(`${dur} ms`)

      const dets = data.detections || []
      setFacesCount(dets.length)

      if (dets.length > 0) {
        const top = dets[0]
        const threshold = settings?.confidenceThreshold ?? 60
        const displayLabel = top.confidence >= threshold ? top.topEmotion : 'Detecting'

        setPrimaryEmotion(displayLabel)
        setPrimaryConfidence(`${top.confidence.toFixed(2)}% confidence`)
        setProbabilities(top.probabilities || {})

        drawDetections(dets, data.image?.width || width, data.image?.height || height)

        if (addToHistory) {
          addToHistory({
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            emotion: top.topEmotion,
            confidence: top.confidence,
            probabilities: top.probabilities,
          })
        }
      } else {
        setPrimaryEmotion('No face detected')
        setPrimaryConfidence('Center face in front of camera')
        setProbabilities({})
        clearOverlay()
      }

      setStatusMessage('Ready')
      setStatusType('ready')
    } catch (err) {
      const isFetchErr = err.message?.toLowerCase().includes('fetch')
      const userMessage = isFetchErr
        ? "Backend connection failed. Ensure 'python web_app.py' is running on port 8000."
        : err.message
      setStatusMessage(isFetchErr ? 'Backend offline' : err.message)
      setStatusType('error')
      setPrimaryEmotion(isFetchErr ? 'Backend offline' : 'Prediction failed')
      setPrimaryConfidence(userMessage)
      clearOverlay()
    } finally {
      setIsAnalyzing(false)
    }
  }, [activeSource, addToHistory, clearOverlay, drawDetections, settings])

  useEffect(() => {
    if (isLive && isCameraActive) {
      liveIntervalRef.current = setInterval(() => {
        analyzeFrame()
      }, 850)
      analyzeFrame()
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current)
        liveIntervalRef.current = null
      }
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    }
  }, [isLive, isCameraActive, analyzeFrame])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    stopCamera()
    const url = URL.createObjectURL(file)
    setUploadedSrc(url)
    setActiveSource('upload')
    setStatusMessage('Image loaded')
    setStatusType('ready')
    clearOverlay()
  }

  const onImageLoaded = () => {
    analyzeFrame()
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div style={{ paddingTop: 84, paddingBottom: 60, maxWidth: 1200, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Real-Time Inference
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>
            Face Emotion <span className="gradient-text">Detection</span>
          </h1>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: statusType === 'error' ? 'rgba(239, 68, 68, 0.15)' : statusType === 'busy' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${statusType === 'error' ? 'rgba(239, 68, 68, 0.3)' : statusType === 'busy' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          fontSize: '0.85rem',
          color: statusType === 'error' ? 'var(--color-angry)' : statusType === 'busy' ? 'var(--color-happy)' : 'var(--color-disgust)',
          fontWeight: 600,
        }}>
          {statusType === 'error' ? <AlertCircle size={14} /> : statusType === 'busy' ? <Zap size={14} /> : <CheckCircle2 size={14} />}
          {statusMessage}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>
        {/* Left: Camera & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-card" style={{
            position: 'relative', overflow: 'hidden', height: 440,
            background: activeSource === 'none' ? 'var(--bg-card)' : '#080812',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                display: activeSource === 'camera' ? 'block' : 'none',
              }}
            />

            {uploadedSrc && (
              <img
                ref={imageElementRef}
                src={uploadedSrc}
                alt="Preview"
                onLoad={onImageLoaded}
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  display: activeSource === 'upload' ? 'block' : 'none',
                }}
              />
            )}

            <canvas
              ref={overlayRef}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                pointerEvents: 'none',
              }}
            />

            {activeSource === 'none' && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Camera size={48} style={{ margin: '0 auto 12px', opacity: 0.4, color: 'var(--accent-primary)' }} />
                <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Start camera or upload an image
                </p>
                <p style={{ fontSize: '0.85rem', marginTop: 4, color: 'var(--text-secondary)' }}>
                  Inference runs through the deep learning emotion model.
                </p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={startCamera}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.9rem' }}
              >
                {isCameraActive ? <VideoOff size={16} /> : <Camera size={16} />}
                {isCameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={analyzeFrame}
                disabled={activeSource === 'none' || isAnalyzing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: '0.9rem',
                  opacity: activeSource === 'none' || isAnalyzing ? 0.5 : 1,
                  cursor: activeSource === 'none' || isAnalyzing ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={16} /> Analyze Frame
              </button>

              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: '0.85rem', fontWeight: 600,
                color: activeSource === 'camera' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: activeSource === 'camera' ? 'pointer' : 'not-allowed',
                userSelect: 'none', marginLeft: 6,
              }}>
                <input
                  type="checkbox"
                  checked={isLive}
                  disabled={activeSource !== 'camera'}
                  onChange={(e) => setIsLive(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16, cursor: 'pointer' }}
                />
                Live Continuous
              </label>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: '0.9rem' }}
              >
                <Upload size={16} /> Upload Image
              </button>
            </div>
          </div>
        </div>

        {/* Right: Results & Probabilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current Emotion Card */}
          <div className="glass-card" style={{ padding: 24 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Detected Emotion
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
              <span style={{ fontSize: '2.8rem' }}>
                {EMOTION_EMOJI[primaryEmotion] || '✨'}
              </span>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{primaryEmotion}</h2>
                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                  {primaryConfidence}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Faces Detected</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{facesCount}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inference Latency</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{latency}</p>
              </div>
            </div>
          </div>

          {/* Probability Bars Card */}
          <div className="glass-card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
              Probability Breakdown
            </h3>
            <EmotionBars probabilities={probabilities} />
          </div>
        </div>
      </div>
    </div>
  )
}
