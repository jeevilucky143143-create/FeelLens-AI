import { useContext, useState, useEffect } from 'react'
import { Sliders, Moon, Sun, Camera, Server, Check } from 'lucide-react'
import { HistoryContext, ThemeContext } from '../App'

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : ''

export default function Settings() {
  const { settings, setSettings } = useContext(HistoryContext)
  const { theme, toggleTheme } = useContext(ThemeContext)

  const [devices, setDevices] = useState([])
  const [savedFeedback, setSavedFeedback] = useState(false)

  useEffect(() => {
    async function getDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return
        const list = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = list.filter((d) => d.kind === 'videoinput')
        setDevices(videoInputs)
      } catch {
        // Device enumeration restricted or unsupported
      }
    }
    getDevices()
  }, [])

  const handleThresholdChange = (e) => {
    const val = Number(e.target.value)
    setSettings((prev) => ({ ...prev, confidenceThreshold: val }))
    showFeedback()
  }

  const handleSmoothingToggle = (e) => {
    const checked = e.target.checked
    setSettings((prev) => ({ ...prev, smoothing: checked }))
    showFeedback()
  }

  const handleCameraChange = (e) => {
    const id = e.target.value
    setSettings((prev) => ({ ...prev, cameraId: id }))
    showFeedback()
  }

  const showFeedback = () => {
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 1800)
  }

  return (
    <div style={{ paddingTop: 84, paddingBottom: 60, maxWidth: 800, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Preferences & Configuration
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>
            App <span className="gradient-text">Settings</span>
          </h1>
        </div>

        {savedFeedback && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-disgust)', fontWeight: 600 }}>
            <Check size={16} /> Saved
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Detection Parameters Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Sliders size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Inference Parameters</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Confidence Threshold */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label htmlFor="confidence-slider" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Confidence Threshold</label>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {settings?.confidenceThreshold ?? 60}%
                </span>
              </div>
              <input
                id="confidence-slider"
                type="range"
                min="30"
                max="90"
                step="5"
                value={settings?.confidenceThreshold ?? 60}
                onChange={handleThresholdChange}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Predictions below this confidence level are labeled as &quot;Detecting&quot;.
              </p>
            </div>

            {/* Smoothing Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <div>
                <label htmlFor="smoothing-toggle" style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>Prediction Smoothing</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Smooth probability shifts across consecutive live video frames.
                </span>
              </div>
              <input
                id="smoothing-toggle"
                type="checkbox"
                checked={settings?.smoothing ?? true}
                onChange={handleSmoothingToggle}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Hardware & Camera Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Camera size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Hardware Input</h2>
          </div>

          <div>
            <label htmlFor="camera-select" style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Preferred Video Device
            </label>
            <select
              id="camera-select"
              value={settings?.cameraId || ''}
              onChange={handleCameraChange}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
              }}
            >
              <option value="">Default Front Camera</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Appearance Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {theme === 'dark' ? <Moon size={20} color="var(--accent-primary)" /> : <Sun size={20} color="var(--color-happy)" />}
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Theme Mode</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Current: {theme === 'dark' ? 'Dark' : 'Light'}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={toggleTheme}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Backend & Deployment Info Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Server size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Deployment Endpoint</h2>
          </div>

          <div style={{ background: 'var(--bg-glass)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active API Base</span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                background: API_BASE ? 'rgba(139, 92, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: API_BASE ? 'var(--accent-primary)' : 'var(--color-disgust)',
              }}>
                {API_BASE ? 'Production URL' : 'Local Dev Proxy'}
              </span>
            </div>
            <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {API_BASE || 'Relative URL (proxied to http://127.0.0.1:8000 via Vite)'}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
