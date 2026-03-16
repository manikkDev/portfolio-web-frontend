import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import './Experience.css';

const Experience = () => {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { threshold: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.15 }
    }
  };

  const fadeUp = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const cardVariants = {
    hidden: { y: 40, opacity: 0, scale: 0.98, filter: 'blur(3px)' },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: 'easeOut' }
    }
  };

  const experiences = [
    {
      role: 'Jr. Game Co-ordinator',
      company: 'SIES GST',
      period: '2025 - present',
      location: 'SIES GST, Navi Mumbai',
      summary:
        'Junior coordinator in the Technical Team of the Game Domain at SIES GST, organizing developer events, workshops, and contributing to game production.',
      highlights: [
        'Hosted GameJam 2024–25 — a hackathon exclusive for game developers',
        'Coordinating Bytecamp, a 24‑hour live hackathon',
        'Ran Cognition workshops teaching game development from basics',
        'Built two high‑end games for the TML event'
      ],
      stack: ['Unity C#', 'Unreal', 'Blueprint', 'C++']
    },
    {
      role: 'Jr. Management Co-ordinator',
      company: 'SIES GST',
      period: '2025 - present',
      location: 'SIES GST, Navi Mumbai',
      summary:
        'Junior coordinator in the CSI Council’s Management domain at SIES GST, driving hackathons and foundational workshops.',
      highlights: [
        'Hosted Enigma 2024–25 — an 18‑hour hackathon open to everyone',
        'Conducted Cognition workshops teaching development from basics'
      ],
      stack: ['DSA', 'CyberSec', 'C++']
    }
  ];

  // Per-card component with two-way scroll fade in/out
  const ExperienceCard = ({ exp }) => {
    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { amount: 0.45 });
    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const rotateX = useSpring(useTransform(tiltY, [-1, 1], [8, -8]), { stiffness: 140, damping: 18 });
    const rotateY = useSpring(useTransform(tiltX, [-1, 1], [-8, 8]), { stiffness: 140, damping: 18 });
    const scale = useSpring(1, { stiffness: 220, damping: 24 });
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMove = (e) => {
      const rect = cardRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      tiltX.set(px * 2 - 1);
      tiltY.set(py * 2 - 1);
      scale.set(1.03);
      cardRef.current.style.setProperty('--px', `${px * 100}%`);
      cardRef.current.style.setProperty('--py', `${py * 100}%`);
    };

    const handleEnter = () => {
      scale.set(1.03);
    };

    const handleLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
      scale.set(1);
      cardRef.current.style.setProperty('--px', `50%`);
      cardRef.current.style.setProperty('--py', `50%`);
    };

    return (
      <motion.article
        ref={cardRef}
        className="exp-card"
        initial="hidden"
        animate={cardInView ? 'visible' : 'hidden'}
        variants={cardVariants}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY, scale: reduced ? 1 : scale, transformPerspective: 1000 }}
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div className="card-overlay" aria-hidden="true">
          <div className="scanline"></div>
          <div className="corner top-left"></div>
          <div className="corner top-right"></div>
          <div className="corner bottom-left"></div>
          <div className="corner bottom-right"></div>
        </div>

        <header className="exp-card-header">
          <div className="exp-role">
            <span className="role-text">{exp.role}</span>
            <span className="role-dot">•</span>
            <span className="company-text">{exp.company}</span>
          </div>
          <div className="exp-period">{exp.period}</div>
          <div className="header-progress"></div>
        </header>

        <div className="exp-meta">
          <div className="meta-item">
            <span className="meta-icon" aria-hidden="true">📅</span>
            <span>{exp.period}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon" aria-hidden="true">📍</span>
            <span>{exp.location}</span>
          </div>
        </div>

        <div className="exp-card-body">
          <p className="exp-summary">{exp.summary}</p>
          <ul className="exp-highlights">
            {exp.highlights.map((h, hIdx) => (
              <motion.li
                key={h}
                className="highlight-item"
                variants={fadeUp}
                initial="hidden"
                animate={cardInView ? 'visible' : 'hidden'}
                transition={{ delay: 0.05 * hIdx }}
              >
                {h}
              </motion.li>
            ))}
          </ul>
        </div>

        <footer className="exp-card-footer">
          <div className="exp-tags">
            {exp.stack.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </footer>
        <div className="card-glare" aria-hidden="true"></div>
      </motion.article>
    );
  };

  return (
    <motion.section
      className={`experience ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="experience-container">
        <motion.div className="experience-header" variants={fadeUp}>
          <h2 className="exp-title">Work Experience</h2>
          <p className="exp-sub">Crafted like a game dev — performant, playful, precise.</p>
        </motion.div>

        <div className="timeline-axis" aria-hidden="true">
          <div className="axis-line"></div>
          <div className="axis-glow"></div>
        </div>

        <div className="experience-grid">
          {experiences.map((exp, idx) => (
            <ExperienceCard key={`${exp.company}-${exp.role}-${exp.period}`} exp={exp} idx={idx} />
          ))}
        </div>
      </div>
      {/* Background overlays to match Hero section */}
      <div className="section-bg" aria-hidden="true">
        <div className="circuit-pattern"></div>
        <div className="glitch-overlay"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  );
};

export default Experience;