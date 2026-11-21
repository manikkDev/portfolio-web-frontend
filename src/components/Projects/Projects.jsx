import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';
import apocalypseShot from '../../assets/projects/apocalypse.webp';
import discmathShot from '../../assets/projects/discmath.webp';
import healthwellShot from '../../assets/projects/healthwell.webp';
import wecareShot from '../../assets/projects/wecare.webp';
import { useTheme } from '../../hooks/useTheme';
import { lineIn, useScrollIn } from '../../utils/reveal';
import { useMedia } from '../../utils/useMedia';
import './Projects.css';

const KINDS = { web: 'Fullstack Web', game: 'Game Dev' };

// In the order they appear: the web projects, then the games.
const PROJECTS = [
  {
    kind: 'web',
    title: 'HealthWell',
    year: '2024',
    description:
      'AI-powered health platform featuring document analysis and an intelligent assistant with multi-language and dark mode; IoT monitoring upcoming.',
    stack: ['React JS', 'Node JS', 'Vite', 'MongoDB', 'Express'],
    links: { live: 'https://healthwell-frontend.vercel.app/', repo: 'https://github.com/manikkDev/HealthWell-Frontend' },
    shot: healthwellShot,
    info: [
      'Upload medical documents and get instant AI insights',
      'Intelligent Health Assistant with prompt input',
      'Dark mode toggle and US English language selector',
      'Sign In and Get Started primary actions',
      'Future perk: IoT Health Monitoring'
    ]
  },
  {
    kind: 'web',
    title: 'WeCare',
    year: '2024',
    description:
      'Digital health records platform built for SIH Smart India Hackathon; supports migrant workers with secure records, OCR parsing, LLM summaries, and clinician review.',
    stack: ['React JS', 'Node JS', 'Vite', 'Firestore', 'Express'],
    links: { live: 'https://wecare-frontend-taupe.vercel.app/', repo: 'https://github.com/manikkDev/WeCare-Frontend' },
    shot: wecareShot,
    info: [
      'Digital Health Initiative for migrant workers in Kerala',
      'Secure & Confidential; Government Approved; Free Registration',
      'Upload + OCR Report Parsing of test names and values',
      'LLM Report Summary with flagged concerns',
      'Secure share links and Doctor Dashboard'
    ]
  },
  {
    kind: 'web',
    title: 'DiscMath Companion',
    year: '2023',
    description:
      'Discrete Mathematics learning companion built as an engineering mini-project at Mumbai University; topic summaries, calculators, and clean responsive UI.',
    stack: ['React JS', 'Node JS', 'Vite', 'Firestore', 'Express'],
    links: { live: 'https://aryapandaram18-afk.github.io/Discmath_w/', repo: '#' },
    shot: discmathShot,
    info: [
      'Topic cards for Sets, Relations, Functions, Graphs',
      'Concise notes with key formulas and examples',
      'Practice utilities: permutations/combinations & truth tables',
      'Quick navigation; mobile-friendly layout',
      'Engineering mini-project at Mumbai University'
    ]
  },
  {
    kind: 'game',
    title: 'Apocalypse',
    year: '2025',
    description:
      'Roblox Studio project featuring AI robots, ray tracing weapon systems, handcrafted level design, and an in-game admin system.',
    stack: ['Roblox Studio', 'Lua', 'C++', 'DSA', '2D', '3D', 'VFX'],
    links: { live: 'https://www.roblox.com/games/115803825073544/Apocalypse-RELEASED', repo: '#' },
    shot: apocalypseShot,
    info: [
      'Created in Roblox Studio using Lua; C++/DSA foundations',
      'AI robots with pathfinding, state machines, and difficulty scaling',
      'Ray tracing weapons with precise hit detection and tuned recoil',
      'Handcrafted level design with wave progression, checkpoints, and hazards',
      'Admin system with role controls, moderation tools, and stat tracking'
    ]
  },
  {
    kind: 'game',
    title: 'Voxel Forge',
    year: '2022',
    description: 'Sandbox builder with procedural generation, chunk streaming, and GPU-accelerated instancing.',
    stack: ['Three.js', 'WebGL', 'TypeScript'],
    links: { live: '#', repo: '#' }
  }
];
const FIRST = { web: 0, game: PROJECTS.findIndex((p) => p.kind === 'game') };

// Side by side and moved by the scroll only where there is room for it and motion is welcome.
const WIDE = '(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';

const has = (url) => url && url !== '#';
const host = (url) => (has(url) ? new URL(url).hostname.replace(/^www\./, '') : '');

const ICON = {
  arrow: 'M7 17 17 7M9 7h8v8',
  code: 'm8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12',
  play: 'M8 5.5v13l10.5-6.5z'
};
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={ICON[name]} />
  </svg>
);

/** Stands in for a screenshot: a small isometric voxel landscape, drawn in the site's colours. */
function VoxelArt() {
  const u = 22;
  const cubes = [];
  for (let s = 0; s <= 16; s++) {
    // back to front, so nearer columns are drawn over further ones
    for (let x = 0; x <= 8; x++) {
      const y = s - x;
      if (y < 0 || y > 8) continue;
      const d = Math.hypot(x - 4, y - 4);
      const h = Math.max(1, Math.round(4.2 - d * 0.7 + Math.sin(x * 1.7) * 0.8 + Math.cos(y * 1.3) * 0.8));
      const sx = (x - y) * u;
      const sy = (x + y) * (u / 2) - h * u;
      const top = `${sx},${sy - u / 2} ${sx + u},${sy} ${sx},${sy + u / 2} ${sx - u},${sy}`;
      const left = `${sx - u},${sy} ${sx},${sy + u / 2} ${sx},${sy + u / 2 + h * u} ${sx - u},${sy + h * u}`;
      const right = `${sx},${sy + u / 2} ${sx + u},${sy} ${sx + u},${sy + h * u} ${sx},${sy + u / 2 + h * u}`;
      cubes.push({ key: `${x}-${y}`, top, left, right, glow: (x * 7 + y * 3) % 11 === 0 || h >= 5 });
    }
  }
  return (
    <svg className="voxel-art" viewBox="-215 -100 430 300" role="img" aria-label="Voxel Forge: an isometric voxel landscape">
      <defs>
        <linearGradient id="voxel-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#120624" />
          <stop offset="1" stopColor="#05030f" />
        </linearGradient>
      </defs>
      <rect x="-215" y="-100" width="430" height="300" fill="url(#voxel-sky)" />
      {cubes.map((c) => (
        <g key={c.key}>
          <polygon points={c.left} fill="#0b2c3a" />
          <polygon points={c.right} fill="#071a26" />
          <polygon points={c.top} fill={c.glow ? '#ff00d4' : '#00b8c4'} stroke="#05030f" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

/**
 * One project. In the wide layout `pos` is how far the card is from the middle of the
 * track (0 = centred): cards further out fade back and their picture drifts the other way.
 */
function ProjectCard({ project, index, total, pos, wide, onFocus, onReach }) {
  const ref = useRef(null);
  const scrollIn = useScrollIn(ref, 0);
  const rise = useTransform(scrollIn.opacity, [0, 1], [40, 0]);
  const near = (d) => 1 - Math.min(1, Math.abs(d));
  const opacity = useTransform(pos, (d) => 0.38 + 0.62 * near(d));
  const scale = useTransform(pos, (d) => 0.93 + 0.07 * near(d));
  const shiftX = useTransform(pos, (d) => `${Math.max(-1, Math.min(1, d)) * -5}%`);
  const live = has(project.links.live) ? project.links.live : null;
  const game = project.kind === 'game';

  const glare = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.li
      ref={ref}
      className="proj-card"
      id={`project-${index}`}
      style={wide ? { opacity, scale } : { opacity: scrollIn.opacity, y: rise }}
      onFocusCapture={onFocus}
      onViewportEnter={wide ? undefined : onReach}
      viewport={{ margin: '-45% 0px -45% 0px' }}
      aria-label={`${index + 1} of ${total}: ${project.title}`}
    >
      <article className="proj-frame">
        <div className="proj-inner" onPointerMove={glare}>
          <div className="proj-media">
            <p className="proj-chrome" aria-hidden="true">
              <i></i><i></i><i></i>
              <span>{game && live ? 'roblox.com' : host(project.links.live) || 'local build'}</span>
            </p>
            <div className="proj-shot">
              <motion.div className="proj-shot-move" style={wide ? { x: shiftX } : undefined}>
                {project.shot ? (
                  <img src={project.shot} alt={`${project.title}: ${game ? 'game key art' : 'home page'}`} loading="lazy" decoding="async" />
                ) : (
                  <VoxelArt />
                )}
              </motion.div>
              {live && (
                <a className="proj-open" href={live} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
                  <Icon name={game ? 'play' : 'arrow'} />
                  {game ? 'Play' : 'Open site'}
                </a>
              )}
            </div>
          </div>

          <div className="proj-body">
            <p className="proj-kicker">
              <span>{KINDS[project.kind]}</span>
              <span>{project.year}</span>
            </p>
            <h3>{project.title}</h3>
            <p className="proj-desc">{project.description}</p>
            {project.info && (
              <ul className="proj-info">
                {project.info.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            <ul className="proj-stack" aria-label="Built with">
              {project.stack.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {(live || has(project.links.repo)) && (
              <div className="proj-links">
                {live && (
                  <a className="proj-btn proj-btn--primary" href={live} target="_blank" rel="noopener noreferrer">
                    <span>{game ? 'Play on Roblox' : 'Live site'}</span>
                    <Icon name={game ? 'play' : 'arrow'} />
                  </a>
                )}
                {has(project.links.repo) && (
                  <a className="proj-btn" href={project.links.repo} target="_blank" rel="noopener noreferrer">
                    <span>Source</span>
                    <Icon name="code" />
                  </a>
                )}
              </div>
            )}
          </div>
          <span className="proj-glare" aria-hidden="true"></span>
        </div>
      </article>
    </motion.li>
  );
}

/**
 * On wide screens the section pins in place and scrolling down moves the projects past
 * sideways, one at a time; elsewhere they simply stack.
 */
const Projects = () => {
  const { theme } = useTheme();
  const wide = useMedia(WIDE);
  const sectionRef = useRef(null);
  const pinRef = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [active, setActive] = useState(0);
  const dist = useMotionValue(0);
  const n = PROJECTS.length;

  // How far the track has to travel: from the first card centred to the last card centred.
  useLayoutEffect(() => {
    if (!wide) {
      setDistance(0);
      dist.set(0);
      return undefined;
    }
    const measure = () => {
      const track = trackRef.current;
      const card = track?.firstElementChild;
      if (!card) return;
      const step = card.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
      setDistance((n - 1) * step);
      dist.set((n - 1) * step);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [wide, n, dist]);

  // 0 when the pinned frame first sticks (under the 70px navbar), 1 when the last card is centred.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 70px', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 170, damping: 32, mass: 0.5 });
  const x = useTransform([progress, dist], ([p, d]) => -p * d);
  const along = useTransform(progress, (p) => p * (n - 1));
  useMotionValueEvent(along, 'change', (v) => {
    const i = Math.max(0, Math.min(n - 1, Math.round(v)));
    setActive((a) => (a === i ? a : i));
  });

  // Where the page must be scrolled to for card `i` to sit in the middle.
  const scrollFor = (i) => {
    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(pinRef.current).top);
    return top + (i / (n - 1)) * distance;
  };
  const go = (i) => {
    if (wide) window.scrollTo({ top: scrollFor(i), behavior: 'smooth' });
    else document.getElementById(`project-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // Tabbing to a card that is off to the side brings it to the middle.
  const focusCard = (i) => {
    if (wide && i !== active) window.scrollTo({ top: scrollFor(i) });
  };

  const kind = PROJECTS[active].kind;

  return (
    <section
      className={`projects ${theme}${wide ? ' projects--wide' : ''}`}
      ref={sectionRef}
      style={wide ? { height: `calc(var(--pin-h) + ${distance}px)` } : undefined}
    >
      <div className="proj-pin" ref={pinRef}>
        <motion.header className="proj-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.5 }} transition={{ staggerChildren: 0.12 }}>
          <div className="proj-titles">
            <motion.h2 className="proj-title" variants={lineIn} data-text="Projects">
              Projects
            </motion.h2>
            <motion.p className="proj-sub" variants={lineIn}>
              <span aria-hidden="true">&gt;</span> Explore my work across web and games.
            </motion.p>
          </div>
          <motion.div className="proj-switch" role="group" aria-label="Jump to" variants={lineIn}>
            {Object.entries(KINDS).map(([key, label]) => (
              <button key={key} type="button" aria-pressed={kind === key} onClick={() => go(FIRST[key])}>
                {kind === key && <motion.span className="proj-switch-on" layoutId="proj-switch-on" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                <span className="proj-switch-label">{label}</span>
              </button>
            ))}
          </motion.div>
        </motion.header>

        <div className="proj-viewport">
          <motion.ol className="proj-track" ref={trackRef} style={wide ? { x } : undefined}>
            {PROJECTS.map((p, i) => (
              <Card key={p.title} project={p} index={i} total={n} along={along} wide={wide} onFocus={() => focusCard(i)} onReach={() => setActive(i)} />
            ))}
          </motion.ol>
        </div>

        {wide && (
          <div className="proj-foot" aria-hidden="true">
            <span className="proj-hint">
              <kbd>Scroll</kbd> to browse
            </span>
            <span className="proj-bar">
              <motion.i style={{ scaleX: progress }}></motion.i>
            </span>
            <span className="proj-count">
              <b>{String(active + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

/** Gives each card its own distance from the middle of the track. */
function Card({ along, index, ...rest }) {
  const pos = useTransform(along, (v) => v - index);
  return <ProjectCard {...rest} index={index} pos={pos} />;
}

export default Projects;
