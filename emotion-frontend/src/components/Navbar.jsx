import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ThemeContext } from '../App'
import { Brain, Camera, BarChart3, Clock, Settings, Sun, Moon } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Home', icon: Brain },
  { path: '/detect', label: 'Detect', icon: Camera },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const location = useLocation()

  return (
    <nav className="navbar">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Brain size={28} color="var(--accent-primary)" />
          <span className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            EmotionAI
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <Link key={path} to={path} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10,
                    background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontSize: '0.85rem', fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </motion.div>
              </Link>
            )
          })}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-glass)', border: '1px solid var(--border-color)',
              borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', marginLeft: 8,
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </motion.button>
        </div>
      </div>
    </nav>
  )
}
