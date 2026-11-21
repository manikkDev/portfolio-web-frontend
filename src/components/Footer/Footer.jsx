import { motion } from 'framer-motion'
import resumePdf from '../../assets/Manik-Resume.pdf'
import { useTheme } from '../../hooks/useTheme'
import './Footer.css'

const EXPLORE = [
  ['Home', '#home'],
  ['About', '#about'],
  ['Experience', '#experience'],
  ['Projects', '#projects'],
  ['Skills', '#skills-bottom'],
  ['YouTube', '#youtube'],
  ['Wins', '#linkedin-posts'],
  ['Contact', '#contact']
]

const ELSEWHERE = [
  ['GitHub', 'https://github.com/manikkDev'],
  ['LinkedIn', 'https://www.linkedin.com/in/manikaraj-anburaj-4550ba354/'],
  ['YouTube', 'https://www.youtube.com/@swertzyt'],
  ['LeetCode', 'https://leetcode.com/u/manikkdev/']
]

const BUILT_WITH = ['React', 'Vite', 'Three.js', 'Framer Motion']

const rise = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}

const Arrow = ({ d = 'M7 17 17 7M9 7h8v8' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
)

const Footer = () => {
  const { theme } = useTheme()
  const year = new Date().getFullYear()

  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })

  return (
    <footer id="footer" className={`footer ${theme}`}>
      <motion.div className="ft-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} transition={{ staggerChildren: 0.1 }}>
        <div className="ft-top">
          <motion.div className="ft-brand" variants={rise}>
            <p className="ft-logo" data-text="MANIK-DEV" aria-label="Manik-Dev">
              MANIK<span>-</span>DEV
            </p>
            <p className="ft-tagline">Building performant web &amp; game experiences.</p>
            <div className="ft-cta">
              <a href="#contact" className="ft-btn ft-btn--primary">
                <span>Get in touch</span>
                <Arrow d="M5 12h14M13 6l6 6-6 6" />
              </a>
              <a href="#projects" className="ft-btn">
                <span>View projects</span>
              </a>
            </div>
          </motion.div>

          <motion.nav className="ft-col" aria-label="Explore" variants={rise}>
            <h2>Explore</h2>
            <ul>
              {EXPLORE.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.nav className="ft-col" aria-label="Elsewhere" variants={rise}>
            <h2>Elsewhere</h2>
            <ul>
              {ELSEWHERE.map(([label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                    <Arrow />
                  </a>
                </li>
              ))}
              <li>
                <a href={resumePdf} download="Manik-Resume.pdf">
                  Resume (PDF)
                  <Arrow d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </a>
              </li>
            </ul>
          </motion.nav>
        </div>

        <motion.div className="ft-bottom" variants={rise}>
          <p className="ft-copy">© {year} Manikaraj Anburaj</p>
          <ul className="ft-built" aria-label="Built with">
            {BUILT_WITH.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <button type="button" className="ft-top-btn" onClick={toTop}>
            <span>Back to top</span>
            <Arrow d="M12 19V5M6 11l6-6 6 6" />
          </button>
        </motion.div>
      </motion.div>
    </footer>
  )
}

export default Footer
