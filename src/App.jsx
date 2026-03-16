import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import './App.css'
import About from './components/About/About'
import Hero from './components/Hero/Hero'
import LazySection from './components/LazySection'
import Navbar from './components/Navbar/Navbar'
import { ThemeProvider } from './contexts/ThemeProvider'

// Lazy-load below-the-fold components for better initial load
const Experience = lazy(() => import('./components/Experience/Experience'))
const Projects = lazy(() => import('./components/Projects/Projects'))
const SkillsBottom = lazy(() => import('./components/Skills/SkillsBottom'))
const Youtube = lazy(() => import('./components/Youtube/Youtube'))
const LinkedPosts = lazy(() => import('./components/LinkedPosts/LinkedPosts'))
const GeometryDash = lazy(() => import('./components/GeometryDash/GeometryDash'))
const Contact = lazy(() => import('./components/Contact/Contact'))
const Rating = lazy(() => import('./components/Rating/Rating'))
const Footer = lazy(() => import('./components/Footer/Footer'))

function App() {
  const [introVisible, setIntroVisible] = useState(true)
  const aimRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setIntroVisible(false), reduced ? 300 : 2400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (aimRef.current) {
      aimRef.current.style.setProperty('--aim-x', window.innerWidth / 2 + 'px')
      aimRef.current.style.setProperty('--aim-y', window.innerHeight / 2 + 'px')
    }
  }, [])

  useEffect(() => {
    const move = (e) => {
      posRef.current.x = e.clientX
      posRef.current.y = e.clientY
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          if (aimRef.current) {
            aimRef.current.style.setProperty('--aim-x', posRef.current.x + 'px')
            aimRef.current.style.setProperty('--aim-y', posRef.current.y + 'px')
          }
        })
      }
    }
    const down = () => {
      if (aimRef.current) {
        aimRef.current.classList.add('fire')
        setTimeout(() => aimRef.current && aimRef.current.classList.remove('fire'), 180)
      }
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mousedown', down)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mousedown', down)
    }
  }, [])

  return (
    <ThemeProvider>
      <div className="App">
        <div ref={aimRef} className="aim-cursor">
          <div className="aim-ring"></div>
          <div className="aim-line-x"></div>
          <div className="aim-line-y"></div>
          <div className="aim-dot"></div>
        </div>
        <AnimatePresence>
          {introVisible && (
            <motion.div
              className="intro-overlay"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onClick={() => setIntroVisible(false)}
            >
              <motion.div
                className="intro-core"
                initial={{ scale: 0.92, rotate: -2, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              >
                <motion.div
                  className="intro-ring"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                />
                <motion.h1
                  className="intro-title"
                  data-text="Welcome to Portfolio"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                >
                  Welcome to Portfolio
                </motion.h1>
                <motion.p
                  className="intro-sub"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.35 }}
                >
                  Performance • VFX • Precision
                </motion.p>
              </motion.div>
              <div className="intro-bg" />
              <div className="intro-grid" />
              <div className="intro-glow" />
              <div className="intro-cars">
                <div className="car car-a" />
                <div className="car car-b" />
                <div className="car car-c" />
              </div>
              <div className="intro-icons">
                <svg className="icon controller" viewBox="0 0 64 32" aria-hidden="true">
                  <path d="M8 16c0-6 4-10 10-10h28c6 0 10 4 10 10 0 5-3 9-8 10l-10-4H26l-10 4c-5-1-8-5-8-10z" fill="rgba(255,255,255,0.9)" />
                  <circle cx="20" cy="16" r="3" fill="#00ffff" />
                  <circle cx="44" cy="16" r="3" fill="#ff00ff" />
                </svg>
                <svg className="icon joystick" viewBox="0 0 32 48" aria-hidden="true">
                  <rect x="6" y="26" width="20" height="16" rx="6" fill="rgba(255,255,255,0.9)" />
                  <circle cx="16" cy="14" r="6" fill="#ffd700" />
                </svg>
                <svg className="icon dpad" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M20 4h8v12h12v8H28v12h-8V24H8v-8h12z" fill="rgba(255,255,255,0.95)" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Navbar />
        <Hero />
        <About />
        <LazySection minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Projects />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <SkillsBottom />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Youtube />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <LinkedPosts />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <GeometryDash />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <Contact />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <Rating />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="200px">
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </LazySection>
      </div>
    </ThemeProvider>
  )
}

export default App
