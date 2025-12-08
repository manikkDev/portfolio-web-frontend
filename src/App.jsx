import { useEffect, useRef } from 'react'
import './App.css'
import About from './components/About/About'
import Contact from './components/Contact/Contact'
import Experience from './components/Experience/Experience'
import Footer from './components/Footer/Footer'
import GeometryDash from './components/GeometryDash/GeometryDash'
import Hero from './components/Hero/Hero'
import LinkedPosts from './components/LinkedPosts/LinkedPosts'
import Navbar from './components/Navbar/Navbar'
import Projects from './components/Projects/Projects'
import SkillsBottom from './components/Skills/SkillsBottom'
import Youtube from './components/Youtube/Youtube'
import { ThemeProvider } from './contexts/ThemeProvider'
import Rating from './components/Rating/Rating'

function App() {
  const aimRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })
  const rafRef = useRef(null)

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
        <Navbar />
        <Hero />
        <About />
        <Experience />
        <Projects />
        <SkillsBottom />
        <Youtube />
        <LinkedPosts />
        <GeometryDash />
        <Contact />
        <Rating />
        <Footer />
      </div>
    </ThemeProvider>
  )
}

export default App
