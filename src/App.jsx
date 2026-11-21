import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import './App.css'
import About from './components/About/About'
import GameIntro from './components/GameIntro/GameIntro'
import Hero from './components/Hero/Hero'
import LazySection from './components/LazySection'
import Navbar from './components/Navbar/Navbar'
import { ThemeProvider } from './contexts/ThemeProvider'
import { useWorld } from './world/useWorld'

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

// The intro plays once per browser session, and not at all for people who ask their
// device for reduced motion. Add ?intro to the address to watch it again.
function shouldShowIntro() {
  if (new URLSearchParams(window.location.search).has('intro')) return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return !sessionStorage.getItem('introSeen')
  } catch {
    return true
  }
}

function App() {
  const [introVisible, setIntroVisible] = useState(shouldShowIntro)
  // True for a moment as the intro ends: the page fades in while the intro is still fading out.
  const [introLeaving, setIntroLeaving] = useState(false)
  // One 3D world behind the page: the intro plays in it, then it becomes the hero's background.
  const stageRef = useRef(null)
  const [startedWithIntro] = useState(introVisible)
  const world = useWorld(stageRef, startedWithIntro)
  const aimRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)

  const leaveIntro = () => {
    setIntroLeaving(true)
    setTimeout(() => setIntroLeaving(false), 900)
  }

  const closeIntro = () => {
    try {
      sessionStorage.setItem('introSeen', '1')
    } catch {
      // private mode: the intro simply plays again next time
    }
    setIntroVisible(false)
  }

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
      <div className={`App${introVisible && !introLeaving ? ' intro-active' : ''}${introLeaving ? ' intro-leaving' : ''}`}>
        <div className="world-stage" ref={stageRef} aria-hidden="true" />
        <div ref={aimRef} className="aim-cursor">
          <div className="aim-ring"></div>
          <div className="aim-line-x"></div>
          <div className="aim-line-y"></div>
          <div className="aim-dot"></div>
        </div>
        {introVisible && <GameIntro world={world} onLeave={leaveIntro} onEnter={closeIntro} />}
        <Navbar />
        <Hero world={world} introDone={!introVisible || introLeaving} />
        <About world={world} />
        <LazySection anchorId="experience" minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </LazySection>
        <LazySection anchorId="projects" minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Projects />
          </Suspense>
        </LazySection>
        <LazySection anchorId="skills-bottom" minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <SkillsBottom />
          </Suspense>
        </LazySection>
        <LazySection anchorId="youtube" minHeight="auto" rootMargin="800px">
          <Suspense fallback={null}>
            <Youtube />
          </Suspense>
        </LazySection>
        <LazySection anchorId="linkedin-posts" minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <LinkedPosts />
          </Suspense>
        </LazySection>
        <LazySection minHeight="auto" rootMargin="600px">
          <Suspense fallback={null}>
            <GeometryDash />
          </Suspense>
        </LazySection>
        <LazySection anchorId="contact" minHeight="auto" rootMargin="600px">
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
