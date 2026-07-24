import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, createContext } from 'react'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Detection from './pages/Detection'
import Analytics from './pages/Analytics'
import History from './pages/History'
import Settings from './pages/Settings'
import './index.css'

export const ThemeContext = createContext()
export const HistoryContext = createContext()

function App() {
  const [theme, setTheme] = useState('dark')
  const [history, setHistory] = useState([])
  const [settings, setSettings] = useState({
    confidenceThreshold: 60,
    smoothing: true,
    cameraId: '',
  })

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const addToHistory = (entry) => {
    setHistory(prev => [entry, ...prev].slice(0, 500))
  }

  const clearHistory = () => setHistory([])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <HistoryContext.Provider value={{ history, addToHistory, clearHistory, settings, setSettings }}>
        <div data-theme={theme} style={{ minHeight: '100vh' }}>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/detect" element={<Detection />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Router>
        </div>
      </HistoryContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
