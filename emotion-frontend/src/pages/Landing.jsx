import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Camera, BarChart3, Zap, Shield, Cpu, ArrowRight } from 'lucide-react'

const GithubIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }

const features = [
  { icon: Camera, title: 'Real-Time Detection', desc: 'Detect emotions from your webcam feed with live confidence scores and probability bars.' },
  { icon: Brain, title: '7 Emotion Classes', desc: 'Recognizes Angry, Disgust, Fear, Happy, Sad, Surprise, and Neutral expressions.' },
  { icon: Zap, title: 'Fast Inference', desc: 'Optimized CNN model running at 30+ FPS on modern hardware with GPU acceleration.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track emotion distribution, confidence trends, and detection history over time.' },
  { icon: Shield, title: 'Privacy First', desc: 'All processing happens locally. No images are ever sent to external servers.' },
  { icon: Cpu, title: 'Deep Learning', desc: 'Trained on 35,000+ FER-2013 facial images with balanced class weights.' },
]

const steps = [
  { num: '01', title: 'Open Camera', desc: 'Navigate to the detection page and grant camera access to begin.' },
  { num: '02', title: 'Face Detection', desc: 'OpenCV Haar cascade locates faces in each frame in real time.' },
  { num: '03', title: 'Emotion Analysis', desc: 'Our CNN model classifies each face into one of 7 emotions with confidence.' },
  { num: '04', title: 'Results & History', desc: 'View live probability bars, analytics charts, and export detection history.' },
]

export default function Landing() {
  return (
    <div style={{ paddingTop: 64 }}>
      {/* Hero Section */}
      <section style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background gradient orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.15 } } }} style={{ textAlign: 'center', maxWidth: 720, position: 'relative', zIndex: 1 }}>
          <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', marginBottom: 24, fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            <Zap size={14} /> Powered by Deep Learning
          </motion.div>

          <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
            AI Face <span className="gradient-text">Emotion</span> Detection
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
            Real-time emotion recognition using deep learning. Detect 7 emotions from your webcam with live confidence scores, analytics, and history tracking.
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/detect">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} /> Start Detection <ArrowRight size={16} />
              </motion.button>
            </Link>
            <a href="#features">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary">
                Learn More
              </motion.button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
          <motion.h2 variants={fadeUp} className="gradient-text" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>
            Features
          </motion.h2>
          <motion.p variants={fadeUp} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 48, fontSize: '1.05rem' }}>
            Everything you need for emotion analysis
          </motion.p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="glass-card" style={{ padding: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={22} color="var(--accent-primary)" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>{title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
          <motion.h2 variants={fadeUp} className="gradient-text" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: 48 }}>
            How It Works
          </motion.h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {steps.map(({ num, title, desc }, i) => (
              <motion.div key={i} variants={fadeUp} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
                  {num}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: '1.05rem' }}>{title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Brain size={20} color="var(--accent-primary)" />
          <span className="gradient-text" style={{ fontWeight: 700 }}>EmotionAI</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Built with TensorFlow, OpenCV, React & ❤️
        </p>
        <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <GithubIcon size={16} /> View on GitHub
        </a>
      </footer>
    </div>
  )
}
