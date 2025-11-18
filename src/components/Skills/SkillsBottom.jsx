import React, { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import './Skills.css'

const titleVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
}

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.15 } }
}

const cardVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.98, filter: 'blur(3px)' },
  visible: { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' } }
}

const iconVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
}

const abbr = (name) => name.split(/[\s-]+/).map(w => w[0]).join('').slice(0,3).toUpperCase()

const Icons = {
  'JavaScript': () => (
    <svg viewBox="0 0 24 24" className="icon-svg"><rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/><path d="M9 10h2v6H9m4-4h2a2 2 0 110 4h-2" fill="none" stroke="#0b0b0b" strokeWidth="1.4"/></svg>
  ),
  'React': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="2" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="4.6"/><ellipse cx="12" cy="12" rx="9" ry="4.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4.6" transform="rotate(-60 12 12)"/></svg>
  ),
  'Vue.js': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><path d="M4 5h4l4 7 4-7h4l-8 14z"/></svg>
  ),
  'Shadcn UI': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
  ),
  'TypeScript': () => (
    <svg viewBox="0 0 24 24" className="icon-svg"><rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/><text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0b0b0b">TS</text></svg>
  ),
  'Next.js': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6h12v12H6z"/><path d="M9 15l6-6M9 9v6h6"/></svg>
  ),
  'Tailwind CSS': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 8c2-4 6-4 8 0 2 4 6 4 8 0"/>
      <path d="M4 12c2-4 6-4 8 0 2 4 6 4 8 0"/>
    </svg>
  ),
  'Redux': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 13c3-6 12-7 11-2"/><path d="M7 13c4 4 9 2 10 5"/><circle cx="7" cy="13" r="2"/><circle cx="18" cy="11" r="2"/><circle cx="17" cy="18" r="2"/></svg>
  ),
  'Node.js': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 4v10l-8 4-8-4V7z"/><text x="12" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="currentColor">N</text></svg>
  ),
  'REST APIs': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/><path d="M11 12h2"/></svg>
  ),
  'Prisma': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><path d="M6 18l6-12 6 12H6z"/></svg>
  ),
  'Redis': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><rect x="6" y="7" width="12" height="3" rx="1"/><rect x="6" y="11" width="12" height="3" rx="1"/><rect x="6" y="15" width="12" height="3" rx="1"/></svg>
  ),
  'MySQL': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="7" rx="6" ry="2"/><path d="M6 7v8c0 1.1 2.7 2 6 2s6-.9 6-2V7"/></svg>
  ),
  'MongoDB': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><path d="M12 4c0 6-2 7-2 10 0 3 2 4 2 6 0-2 2-3 2-6 0-3-2-4-2-10z"/></svg>
  ),
  'Express.js': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h8M6 12h10M6 16h6"/></svg>
  ),
  'VS Code': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 8l6 4-6 4 10 3V5z"/></svg>
  ),
  'Git': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8l8 8"/><circle cx="6" cy="8" r="2"/><circle cx="14" cy="16" r="2"/><circle cx="16" cy="8" r="2"/></svg>
  ),
  'AWS': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 16c3 3 9 3 12 0"/><text x="12" y="11" textAnchor="middle" fontSize="7" fontWeight="800" fill="currentColor">AWS</text></svg>
  ),
  'Vercel': () => (
    <svg viewBox="0 0 24 24" className="icon-svg" fill="currentColor"><polygon points="12,5 21,19 3,19"/></svg>
  )
}

Icons['Unity Engine'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <polygon points="12,4 17,7 17,13 12,16 7,13 7,7"/>
    <polygon points="12,8 15,10 15,11 12,13 9,11 9,10"/>
  </svg>
)

Icons['Unreal Engine'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9"/>
    <path d="M9 16c0-4 2-6 5-6v7"/>
  </svg>
)

Icons['Roblox Studio'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="6" y="6" width="12" height="12" transform="rotate(15 12 12)"/>
    <rect x="10" y="10" width="4" height="4" transform="rotate(15 12 12)"/>
  </svg>
)

Icons['C#'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <polygon points="12,4 19,8 19,16 12,20 5,16 5,8"/>
    <text x="12" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0b0b0b">C#</text>
  </svg>
)

Icons['C++'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <polygon points="12,4 19,8 19,16 12,20 5,16 5,8"/>
    <text x="12" y="14" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0b0b0b">C++</text>
  </svg>
)

Icons['Lua'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="6"/>
    <circle cx="16" cy="9" r="2" fill="currentColor" stroke="none"/>
  </svg>
)

// Additional icons
Icons['FirestoreDB'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M12 4l-2.5 5 2.5-1.6 2.5 1.6L12 4z" fill="currentColor" stroke="none"/>
    <path d="M7 13c0 3 2 5 5 5s5-2 5-5c0-2-1.5-3.5-3-4.5l-2 1.5-2-1.5c-1.5 1-3 2.5-3 4.5z"/>
  </svg>
)

Icons['Adobe After Effects'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg">
    <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/>
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0b0b0b">AE</text>
  </svg>
)

Icons['Adobe Premiere Pro'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg">
    <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/>
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="800" fill="#0b0b0b">Pr</text>
  </svg>
)

Icons['DaVinci Resolve'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="8.5" r="2.5"/>
    <circle cx="8.5" cy="14.5" r="2.5"/>
    <circle cx="15.5" cy="14.5" r="2.5"/>
  </svg>
)

Icons['Topaz AI'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <polygon points="12,5 18,12 12,19 6,12"/>
    <text x="12" y="13" textAnchor="middle" fontSize="6" fontWeight="800" fill="#0b0b0b">AI</text>
  </svg>
)

Icons['Descript'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M8 6h5a5 5 0 010 12H8V6z"/>
    <path d="M9 10c1-1 2-1 3 0s2 1 3 0"/>
  </svg>
)

Icons['Alight Motion'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M6 12a6 6 0 1010 4"/>
    <path d="M8 12a4.5 4.5 0 108 3"/>
    <path d="M10 12a3 3 0 106 2"/>
  </svg>
)

Icons['CapCut'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
    <path d="M6 8h12M6 16h12M6 8l12 8M6 16l12-8"/>
  </svg>
)

Icons['Blur'] = () => (
  <svg viewBox="0 0 24 24" className="icon-svg" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
)

const SkillIcon = ({ name }) => {
  const Svg = Icons[name]
  return (
    <motion.div className="skill-icon" variants={iconVariants} whileHover={{ scale: 1.08 }}>
      {Svg ? <Svg /> : <span className="skill-icon-label" aria-hidden="true">{abbr(name)}</span>}
    </motion.div>
  )
}

const categories = [
  {
    title: 'Frontend Development',
    items: ['JavaScript', 'React', 'TypeScript', 'Next.js', 'Tailwind CSS']
  },
  {
    title: 'Backend Development',
    items: ['Node.js', 'REST APIs', 'MongoDB', 'Express.js', 'FirestoreDB']
  },
  {
    title: 'DevOps & Tools',
    items: ['VS Code', 'Git', 'Vercel']
  }
  ,
  {
    title: 'Game Development',
    items: ['Unity Engine', 'Unreal Engine', 'Roblox Studio', 'C#', 'C++', 'Lua']
  }
  ,
  {
    title: 'Video Editing',
    items: ['Adobe After Effects', 'Adobe Premiere Pro', 'DaVinci Resolve', 'Topaz AI', 'Descript', 'Alight Motion', 'CapCut', 'Blur']
  }
]

const SkillsBottom = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })

  return (
    <motion.section
      id="skills-bottom"
      className={`skills ${theme}`}
      ref={sectionRef}
      variants={sectionVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="skills-wrap">
        <motion.div className="skills-header" variants={titleVariants}>
          <h2 className="skills-title">Skills</h2>
          <p className="skills-sub">Explore my stack across web and tools.</p>
        </motion.div>

        <div className="skills-grid">
          {categories.map((cat) => (
            <motion.article
              key={cat.title}
              className="skill-card"
              variants={cardVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <header className="skill-card-header">
                <h3 className="skill-card-title">{cat.title}</h3>
              </header>
              <div className="skill-items">
                {cat.items.map((name) => (
                  <div className="skill-item" key={`${cat.title}-${name}`}>
                    <SkillIcon name={name} />
                    <span className="skill-label">{name}</span>
                  </div>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="section-bg" aria-hidden="true">
        <div className="circuit-pattern"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  )
}

export default SkillsBottom