import { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Camera, TrendingUp, Sparkles, Award } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { HistoryContext } from '../App'
import { EMOTION_COLORS, EMOTION_EMOJI } from '../components/EmotionBars'

export default function Analytics() {
  const { history } = useContext(HistoryContext)

  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return null
    }

    const counts = {}
    let totalConf = 0

    history.forEach((item) => {
      const em = item.emotion || 'Unknown'
      counts[em] = (counts[em] || 0) + 1
      totalConf += Number(item.confidence || 0)
    })

    const topEmotionEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    const avgConfidence = (totalConf / history.length).toFixed(1)

    const chartData = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      emoji: EMOTION_EMOJI[name] || '✨',
      color: EMOTION_COLORS[name] || '#8b5cf6',
    }))

    const pieData = chartData.map((d) => ({
      name: d.name,
      value: d.count,
      color: d.color,
    }))

    return {
      total: history.length,
      topEmotion: topEmotionEntry ? topEmotionEntry[0] : 'N/A',
      topEmotionCount: topEmotionEntry ? topEmotionEntry[1] : 0,
      avgConfidence: `${avgConfidence}%`,
      chartData,
      pieData,
    }
  }, [history])

  return (
    <div style={{ paddingTop: 84, paddingBottom: 60, maxWidth: 1100, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Insights & Breakdown
        </span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 2 }}>
          Emotion <span className="gradient-text">Analytics</span>
        </h1>
      </div>

      {!stats ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <BarChart3 size={56} style={{ margin: '0 auto 16px', opacity: 0.35, color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>No Detection Data Yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Start detecting facial expressions from your camera or image uploads to generate analytics and emotion distribution trends.
          </p>
          <Link to="/detect">
            <button type="button" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Camera size={16} /> Open Detection
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Scans</span>
                <Sparkles size={18} color="var(--accent-primary)" />
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.total}</p>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dominant Emotion</span>
                <Award size={18} color="var(--color-happy)" />
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{EMOTION_EMOJI[stats.topEmotion] || ''}</span>
                {stats.topEmotion}
              </p>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Confidence</span>
                <TrendingUp size={18} color="var(--color-disgust)" />
              </div>
              <p style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.avgConfidence}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20 }}>
            {/* Bar Chart */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
                Emotion Frequency
              </h2>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(20, 20, 35, 0.95)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, alignSelf: 'flex-start', marginBottom: 12 }}>
                Distribution Share
              </h2>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(20, 20, 35, 0.95)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 }}>
                {stats.pieData.map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
