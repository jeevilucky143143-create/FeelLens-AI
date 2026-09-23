import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Trash2, Download, Camera } from 'lucide-react'
import { HistoryContext } from '../App'
import { EMOTION_COLORS, EMOTION_EMOJI } from '../components/EmotionBars'

export default function History() {
  const { history, clearHistory } = useContext(HistoryContext)

  const exportCSV = () => {
    if (!history || history.length === 0) return

    const headers = ['Timestamp', 'Emotion', 'Confidence (%)']
    const rows = history.map((item) => [
      `"${item.timestamp || ''}"`,
      `"${item.emotion || ''}"`,
      Number(item.confidence || 0).toFixed(2),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emotion_history_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ paddingTop: 84, paddingBottom: 60, maxWidth: 1100, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Logs & Records
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>
            Detection <span className="gradient-text">History</span>
          </h1>
        </div>

        {history && history.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={exportCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Download size={15} /> Export CSV
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={clearHistory}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.85rem', color: 'var(--color-angry)' }}
            >
              <Trash2 size={15} /> Clear All
            </button>
          </div>
        )}
      </div>

      {!history || history.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Clock size={56} style={{ margin: '0 auto 16px', opacity: 0.35, color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>No Records Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Detections captured during your session will appear here with timestamps, confidence scores, and export options.
          </p>
          <Link to="/detect">
            <button type="button" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Camera size={16} /> Start Scanning
            </button>
          </Link>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Time</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Emotion</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Confidence</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Top Probabilities</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => {
                  const color = EMOTION_COLORS[item.emotion] || 'var(--accent-primary)'
                  const emoji = EMOTION_EMOJI[item.emotion] || '✨'
                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {item.timestamp}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', borderRadius: 8,
                          background: `${color}18`,
                          border: `1px solid ${color}40`,
                          color,
                          fontWeight: 700, fontSize: '0.85rem'
                        }}>
                          <span>{emoji}</span> {item.emotion}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {Number(item.confidence || 0).toFixed(1)}%
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.probabilities
                          ? Object.entries(item.probabilities)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v.toFixed(0)}%`)
                              .join(' • ')
                          : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
