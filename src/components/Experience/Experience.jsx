import { motion, useInView, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { lineIn, useScrollIn } from '../../utils/reveal';
import './Experience.css';

const ROLES = [
  {
    id: 'game',
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
    id: 'management',
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
const TOTAL = ROLES.reduce((n, r) => n + r.highlights.length, 0);

const ICON = {
  calendar: 'M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2zM5 9v10h14V9H5zm2 2h4v3H7v-3z',
  pin: 'M12 2a7 7 0 0 1 7 7c0 4.6-5.3 11.3-6.3 12.6a.9.9 0 0 1-1.4 0C10.3 20.3 5 13.6 5 9a7 7 0 0 1 7-7zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  tick: 'M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z'
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path fillRule="evenodd" clipRule="evenodd" d={ICON[name]} />
  </svg>
);

/**
 * One role on the timeline. Its objectives tick off one after another as they scroll up the
 * screen; `onCleared` hears how many are ticked, `onFocus` fires when the card reaches the
 * middle of the screen.
 */
function Mission({ exp, active, passed, onCleared, onFocus }) {
  const ref = useRef(null);
  const listRef = useRef(null);
  const style = useScrollIn(ref);
  const last = useRef(-1);
  const n = exp.highlights.length;

  // One number on the list (--done, how many objectives in) drives every tick from CSS.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 82%', 'end 58%'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const done = v * (n + 0.6);
    listRef.current?.style.setProperty('--done', done.toFixed(2));
    const cleared = Math.min(n, Math.floor(done));
    if (cleared !== last.current) {
      last.current = cleared;
      onCleared(cleared);
    }
  });

  // a light that follows the cursor over the card
  const glare = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.li
      className={`mission${active ? ' is-active' : ''}${passed ? ' is-passed' : ''}`}
      id={`mission-${exp.id}`}
      ref={ref}
      style={style}
      onViewportEnter={onFocus}
      viewport={{ margin: '-45% 0px -45% 0px' }}
    >
      <span className="mission-node" aria-hidden="true"><i></i></span>
      <article className="mission-frame">
        <div className="mission-inner" onPointerMove={glare}>
          <header className="mission-head">
            <div>
              <h3>{exp.role}</h3>
              <p className="mission-org">{exp.company}</p>
            </div>
            {exp.period.includes('present') && (
              <span className="mission-status"><i aria-hidden="true"></i>Active</span>
            )}
          </header>

          <p className="mission-meta">
            <span><Icon name="calendar" />{exp.period}</span>
            <span><Icon name="pin" />{exp.location}</span>
          </p>

          <p className="mission-summary">{exp.summary}</p>

          <ul className="objectives" ref={listRef} aria-label="Highlights">
            {exp.highlights.map((h, i) => (
              <li key={h} style={{ '--i': i }}>
                <span className="objective-check" aria-hidden="true"><Icon name="tick" /></span>
                {h}
              </li>
            ))}
          </ul>

          <footer className="mission-stack">
            <span>Stack</span>
            <ul>
              {exp.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </footer>
          <span className="mission-glare" aria-hidden="true"></span>
        </div>
      </article>
    </motion.li>
  );
}

/**
 * `world` is the shared 3D scene (see src/world). In the dark theme it carries on behind
 * this section: scrolling through it glides the camera on over the city toward the gate.
 */
const Experience = ({ world }) => {
  const { theme } = useTheme();
  const ref = useRef(null);
  const listRef = useRef(null);
  const isInView = useInView(ref, { amount: 0.02 });
  const [active, setActive] = useState(0);
  const [cleared, setCleared] = useState(() => ROLES.map(() => 0));
  const done = cleared.reduce((a, b) => a + b, 0);

  const scene = world?.scene ?? null;
  const use3d = Boolean(scene) && theme === 'dark';

  // The 3D world keeps drawing while this section is on screen (and stops if it unmounts).
  useEffect(() => {
    scene?.setActive(theme === 'dark' && isInView, 'experience');
  }, [scene, theme, isInView]);
  useEffect(() => () => scene?.setActive(false, 'experience'), [scene]);

  // Scrolling through the section moves the world's camera on from where About left it.
  const { scrollYProgress: travelled } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  useMotionValueEvent(travelled, 'change', (v) => scene?.setScroll(v, 'experience'));

  // The timeline's spine fills as the reader goes down it.
  const { scrollYProgress: read } = useScroll({ target: listRef, offset: ['start 70%', 'end 60%'] });
  const spine = useSpring(read, { stiffness: 120, damping: 28 });

  const report = (i) => (count) =>
    setCleared((c) => (c[i] === count ? c : c.map((v, j) => (j === i ? count : v))));

  const jumpTo = (id) => document.getElementById(`mission-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <section className={`experience ${theme}${use3d ? ' experience--3d' : ''}`} ref={ref}>
      <div className="exp-grid">
        <div className="exp-side">
          <motion.header className="exp-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
            <motion.h2 className="exp-title" variants={lineIn} data-text="Work Experience">
              Work Experience
            </motion.h2>
            <motion.p className="exp-sub" variants={lineIn}>
              <span aria-hidden="true">&gt;</span> Crafted like a game dev — performant, playful, precise.
            </motion.p>
          </motion.header>

          {/* Wide screens: an index of the roles that follows the reader down the timeline */}
          <motion.nav
            className="questlog"
            aria-label="Roles"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <p className="questlog-head">
              <span>Quest log</span>
              <span>{ROLES.length} roles</span>
            </p>
            <ol>
              {ROLES.map((exp, i) => (
                <li key={exp.id}>
                  <button type="button" className={active === i ? 'is-active' : ''} aria-current={active === i ? 'step' : undefined} onClick={() => jumpTo(exp.id)}>
                    <span className="questlog-role">{exp.role}</span>
                    <span className="questlog-meta">{exp.company} · {exp.period}</span>
                    <span className="questlog-bar" aria-hidden="true"><i style={{ width: `${(cleared[i] / exp.highlights.length) * 100}%` }}></i></span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="questlog-total">
              <span>Objectives cleared</span>
              <b>{done}/{TOTAL}</b>
            </p>
          </motion.nav>
        </div>

        <div className="timeline" ref={listRef}>
          <span className="timeline-spine" aria-hidden="true">
            <motion.i style={{ scaleY: spine }}></motion.i>
          </span>
          <ol>
            {ROLES.map((exp, i) => (
              <Mission
                key={exp.id}
                exp={exp}
                active={active === i}
                passed={active > i}
                onCleared={report(i)}
                onFocus={() => setActive(i)}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default Experience;
