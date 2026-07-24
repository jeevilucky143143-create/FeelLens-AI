import { motion } from 'framer-motion'

const EMOTION_COLORS = {
  Angry: '#ef4444',
  Disgust: '#22c55e',
  Fear: '#a855f7',
  Happy: '#facc15',
  Sad: '#3b82f6',
  Surprise: '#f97316',
  Neutral: '#6b7280',
}

const EMOTION_EMOJI = {
  Angry: '😠',
  Disgust: '🤢',
  Fear: '😨',
  Happy: '😊',
  Sad: '😢',
  Surprise: '😲',
  Neutral: '😐',
}

export default function EmotionBars({ probabilities = {} }) {
  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {sorted.map(([emotion, value]) => (
        <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>
            {EMOTION_EMOJI[emotion] || '❓'}
          </span>
          <span style={{
            width: 70, fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--text-secondary)', textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            {emotion}
          </span>
          <div style={{ flex: 1 }} className="emotion-bar-track">
            <motion.div
              className="emotion-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                background: `linear-gradient(90deg, ${EMOTION_COLORS[emotion]}88, ${EMOTION_COLORS[emotion]})`,
                boxShadow: value > 30 ? `0 0 12px ${EMOTION_COLORS[emotion]}40` : 'none',
              }}
            />
          </div>
          <span style={{
            width: 48, textAlign: 'right', fontSize: '0.85rem',
            fontWeight: 700, fontFamily: 'monospace',
            color: value > 50 ? EMOTION_COLORS[emotion] : 'var(--text-muted)',
          }}>
            {value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export { EMOTION_COLORS, EMOTION_EMOJI }
