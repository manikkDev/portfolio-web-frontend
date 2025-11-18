import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import './Footer.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.15 } }
}

const fadeUp = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
}

const Footer = () => {
  const { theme } = useTheme()
  const ref = useRef(null)
  const inView = useInView(ref, { threshold: 0.2 })

  return (
    <motion.footer
      id="footer"
      className={`footer ${theme}`}
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="footer-wrap">
        <motion.div className="footer-grid" variants={containerVariants}>
          <motion.div className="footer-brand" variants={fadeUp}>
            <div className="brand-logo">
              <span className="logo-mark">Manik</span>
              <span className="logo-divider">-</span>
              <span className="logo-suffix">Dev</span>
            </div>
            <p className="brand-tagline">Building performant web & game experiences.</p>
            <div className="brand-cta">
              <a href="#contact" className="cta-btn primary">Get in touch</a>
              <a href="#projects" className="cta-btn ghost">View projects</a>
            </div>
          </motion.div>

          <motion.nav className="footer-links" aria-label="Explore" variants={fadeUp}>
            <h4 className="links-title">Explore</h4>
            <ul className="links-list">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#experience">Experience</a></li>
              <li><a href="#projects">Projects</a></li>
              <li><a href="#skills-bottom">Skills</a></li>
              <li><a href="#youtube">YouTube</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </motion.nav>

          <motion.nav className="footer-resources" aria-label="Resources" variants={fadeUp}>
            <h4 className="links-title">Resources</h4>
            <ul className="links-list">
              <li><a href="https://github.com/manikkDev" target="_blank" rel="noreferrer">GitHub</a></li>
              <li><a href="https://www.linkedin.com/in/manik-khandelwal-63959825a/" target="_blank" rel="noreferrer">LinkedIn</a></li>
              <li><a href="#">Resume</a></li>
            </ul>
          </motion.nav>

          <motion.div className="footer-newsletter" variants={fadeUp}>
            <h4 className="links-title">Newsletter</h4>
            <p className="news-desc">Occasional updates on projects and releases.</p>
            <form className="news-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" className="news-input" placeholder="Your email" aria-label="Email address" />
              <button className="news-btn" type="submit">Subscribe</button>
            </form>
            <div className="social-row" aria-label="Social links">
              <a className="social-btn" href="https://github.com/manikkDev" target="_blank" rel="noreferrer">GitHub</a>
              <a className="social-btn" href="https://www.linkedin.com/in/manik-khandelwal-63959825a/" target="_blank" rel="noreferrer">LinkedIn</a>
            </div>
          </motion.div>
        </motion.div>

        <div className="footer-bg" aria-hidden="true">
          <div className="circuit-pattern"></div>
          <div className="scan-grid"></div>
        </div>

        <motion.div className="footer-bottom" variants={fadeUp}>
          <div className="copy">© {new Date().getFullYear()} Manikaraj Anburaj</div>
          <div className="badges">
            <span className="badge">React</span>
            <span className="badge">Vite</span>
            <span className="badge">Framer Motion</span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  )
}

export default Footer