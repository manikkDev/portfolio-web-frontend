import { motion, useAnimationControls, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import employedImage from '../../assets/employed-manik.jpg';
import unemployedImage from '../../assets/manik-unemployed.jpg';
import { useTheme } from '../../hooks/useTheme';
import { lineIn, useScrollIn } from '../../utils/reveal';
import './About.css';

const BIO = [
  'I bring creative visions to life through code, specializing in both web platforms and interactive games. With expertise in full-stack development and game engineering, I build robust systems and optimize performance for seamless experiences. I believe great technology should feel invisible, empowering users to fully immerse themselves in digital worlds.',
  'My focus is on clean, maintainable code and scalable architecture. Whether architecting web applications or developing game mechanics, I approach every project with precision and a user-first mindset.'
];

const SKILLS = [
  {
    title: 'Full-Stack Development',
    text: 'Building modern, responsive web applications with optimized frontend interfaces and scalable backend systems.',
    // angle brackets and a slash
    icon: 'M8.6 6.4 3 12l5.6 5.6 1.4-1.4L5.8 12 10 7.8 8.6 6.4zm6.8 0L14 7.8l4.2 4.2-4.2 4.2 1.4 1.4L21 12l-5.6-5.6zM13.2 4l-4.3 16h2L15.2 4h-2z'
  },
  {
    title: 'Game Development',
    text: 'Creating engaging gameplay experiences with performant code, intuitive mechanics, and immersive worlds.',
    // a gamepad
    icon: 'M7 7h10a5 5 0 0 1 4.9 4l.9 4.6A2.9 2.9 0 0 1 17.9 18L15.8 15H8.2L6.1 18a2.9 2.9 0 0 1-4.9-2.4L2.1 11A5 5 0 0 1 7 7zm0 2.5v1.3H5.7v1.4H7v1.3h1.4v-1.3h1.3v-1.4H8.4V9.5H7zm8.2 1.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm2.3-1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'
  },
  {
    title: 'Technical Problem-Solving',
    text: 'Architecting elegant solutions to complex technical challenges across different platforms and domains.',
    // a chip
    icon: 'M9 2h2v3h2V2h2v3h2a2 2 0 0 1 2 2v2h3v2h-3v2h3v2h-3v2a2 2 0 0 1-2 2h-2v3h-2v-3h-2v3H9v-3H7a2 2 0 0 1-2-2v-2H2v-2h3v-2H2V9h3V7a2 2 0 0 1 2-2h2V2zM7 7v10h10V7H7zm2.5 2.5h5v5h-5v-5z'
  }
];

// The poster is a target. Each weapon takes a different bite out of its health.
const WEAPONS = [
  { name: 'AR', damage: 12 },
  { name: 'SMG', damage: 7 },
  { name: 'Sniper', damage: 34 }
];
const CLIP = 24;
const START_HP = 86;
const SHIELD_HIT = 34; // three clicks break a shield

/**
 * A paragraph whose words light up one after another as it scrolls up the screen. One number
 * on the paragraph (--lit, how many words in) drives them all from CSS, so there is nothing
 * to animate per word.
 */
function ScrubText({ text }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 86%', 'end 50%'] });
  const words = text.split(' ');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    ref.current?.style.setProperty('--lit', (v * (words.length + 4)).toFixed(2));
  });
  return (
    <p className="about-lead" ref={ref}>
      {words.map((word, i) => (
        <span key={i} style={{ '--i': i }}>{word} </span>
      ))}
    </p>
  );
}

/**
 * The poster on the firing range. Shoot it until its health runs out and it gives way to
 * the other poster. `xp` (0..100) is how far the visitor has read through the section.
 */
function Target({ xp }) {
  const screenRef = useRef(null);
  const timers = useRef([]);
  const aimX = useMotionValue(0);
  const aimY = useMotionValue(0);
  const x = useSpring(aimX, { stiffness: 300, damping: 25 });
  const y = useSpring(aimY, { stiffness: 300, damping: 25 });
  const recoil = useAnimationControls();
  const [shot, setShot] = useState({ id: 0, damage: 0 });
  const [hp, setHp] = useState(START_HP);
  const [ammo, setAmmo] = useState(CLIP);
  const [weapon, setWeapon] = useState(0);
  const [wiping, setWiping] = useState(false); // the bars that sweep across as the poster changes
  const [employed, setEmployed] = useState(false);
  const danger = !employed && hp <= 25;

  // The sight rests a little below the middle until the cursor arrives.
  const rest = () => {
    const r = screenRef.current?.getBoundingClientRect();
    if (!r) return;
    aimX.set(r.width / 2);
    aimY.set(r.height * 0.62);
  };
  useEffect(() => {
    rest();
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aim = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    aimX.set(e.clientX - r.left);
    aimY.set(e.clientY - r.top);
  };

  const fire = () => {
    const damage = employed || wiping ? 0 : WEAPONS[weapon].damage;
    setShot((s) => ({ id: s.id + 1, damage }));
    setAmmo((a) => (a <= 1 ? CLIP : a - 1)); // an empty clip reloads itself
    recoil.start({ x: [0, -3, 3, -2, 2, 0], rotateZ: [0, -0.8, 0.8, -0.4, 0.4, 0], transition: { duration: 0.28, ease: 'easeOut' } });
    if (!damage) return;
    const left = Math.max(0, hp - damage);
    setHp(left);
    if (left > 0) return;
    // out of health: the bars sweep across, the poster changes behind them, and health returns
    setWiping(true);
    timers.current.push(
      setTimeout(() => setEmployed(true), 600),
      setTimeout(() => {
        setWiping(false);
        setHp(100);
      }, 1400)
    );
  };

  return (
    <div className={`target${danger ? ' is-danger' : ''}${employed ? ' is-employed' : ''}`}>
      <div className="target-shell">
        <div className="target-frame">
          <button
            type="button"
            className="target-screen"
            ref={screenRef}
            onPointerMove={aim}
            onPointerLeave={rest}
            onClick={fire}
          >
            <motion.span className="target-photo" animate={recoil}>
              <img
                src={employed ? employedImage : unemployedImage}
                alt={employed ? 'Manik on a poster stamped Employed' : 'Manik on a poster stamped Unemployed. Shoot it.'}
                loading="lazy"
                decoding="async"
              />
            </motion.span>
            <span className="target-lines" aria-hidden="true"></span>
            {wiping && (
              <span className="target-wipe" aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ '--d': `${i * 30}ms` }}></i>
                ))}
              </span>
            )}
            <motion.span className="target-sight" style={{ left: x, top: y }} aria-hidden="true">
              <i></i>
            </motion.span>
            {shot.id > 0 && (
              <motion.span className="target-shot" key={shot.id} style={{ left: x, top: y }} aria-hidden="true">
                <i className="target-ring"></i>
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} className="target-spark" style={{ '--a': `${i * 45}deg` }}></i>
                ))}
                {shot.damage > 0 && <b>-{shot.damage}</b>}
              </motion.span>
            )}
          </button>
        </div>
        <span className="target-corner target-corner--tl" aria-hidden="true"></span>
        <span className="target-corner target-corner--br" aria-hidden="true"></span>
      </div>

      <div className="target-plate">
        <div className="meter meter--hp">
          <span>HP</span>
          <i><b style={{ width: `${hp}%` }}></b></i>
          <em>{hp}%</em>
        </div>
        <div className="meter">
          <span>Ammo</span>
          <i><b style={{ width: `${(ammo / CLIP) * 100}%` }}></b></i>
          <em>{ammo}</em>
        </div>
        <div className="meter meter--xp">
          <span>XP</span>
          <i><b style={{ width: `${xp}%` }}></b></i>
          <em>{xp}%</em>
        </div>
        <div className="loadout" role="group" aria-label="Weapon">
          {WEAPONS.map((w, i) => (
            <button type="button" key={w.name} aria-pressed={weapon === i} onClick={() => setWeapon(i)}>
              {w.name}
            </button>
          ))}
        </div>
      </div>

      <p className="about-hint" aria-hidden="true">
        <kbd>Click</kbd><span>the poster to fire</span>
        <kbd>XP</kbd><span>fills as you read</span>
      </p>
    </div>
  );
}

/** One skill, behind a shield that takes three clicks to break. */
function Skill({ skill }) {
  const ref = useRef(null);
  const style = useScrollIn(ref);
  const [hp, setHp] = useState(100);
  const [hits, setHits] = useState(0);
  const open = hp === 0;

  const hit = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    // a keyboard press has no position: ring from the middle
    e.currentTarget.style.setProperty('--sx', `${e.clientX ? e.clientX - r.left : r.width / 2}px`);
    e.currentTarget.style.setProperty('--sy', `${e.clientY ? e.clientY - r.top : r.height / 2}px`);
    setHits((n) => n + 1);
    setHp((h) => Math.max(0, h - SHIELD_HIT));
  };

  return (
    <motion.li className={`skill${open ? ' is-open' : ''}`} ref={ref} style={style}>
      <div className="skill-frame">
        <div className="skill-inner">
          <span className="skill-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" focusable="false">
              <path fillRule="evenodd" clipRule="evenodd" d={skill.icon} />
            </svg>
          </span>
          <div className="skill-body">
            <h3>{skill.title}</h3>
            <p>{skill.text}</p>
          </div>
        </div>
      </div>
      {open && <span className="skill-tag">Unlocked</span>}
      <button
        type="button"
        className={`shield${open ? ' is-broken' : ''}`}
        style={{ '--hp': hp / 100 }}
        onClick={hit}
        disabled={open}
        aria-label={`Shield over ${skill.title}, ${hp}% left. Press to hit it.`}
      >
        {hits > 0 && <span className="shield-ping" key={hits}></span>}
        <svg className="shield-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path fillRule="evenodd" clipRule="evenodd" d={skill.icon} />
        </svg>
        <span className="shield-meter">
          <span>Shield</span>
          <i><b style={{ width: `${hp}%` }}></b></i>
          <em>{hp}%</em>
        </span>
        <span className="shield-tip">click to break</span>
      </button>
      {open && (
        <span className="shards" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ '--i': i }}></i>
          ))}
        </span>
      )}
    </motion.li>
  );
}

/**
 * `world` is the shared 3D scene (see src/world). In the dark theme it stays on behind this
 * section: scrolling through it lifts the camera over the rooftops and carries it along the
 * avenue. Without it the section uses its own background.
 */
const About = ({ world }) => {
  const { theme } = useTheme();
  const ref = useRef(null);
  const copyRef = useRef(null);
  const [xp, setXp] = useState(0);
  const isInView = useInView(ref, { amount: 0.02 });

  const scene = world?.scene ?? null;
  const use3d = Boolean(scene) && theme === 'dark';

  // The 3D world keeps drawing while this section is on screen.
  useEffect(() => {
    scene?.setActive(theme === 'dark' && isInView, 'about');
  }, [scene, theme, isInView]);

  // Scrolling through the section moves the world's camera on from where the hero left it.
  const { scrollYProgress: travelled } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  useMotionValueEvent(travelled, 'change', (v) => scene?.setScroll(v, 'about'));

  // How far the visitor has read: drives the rail beside the text and the XP meter.
  const { scrollYProgress: read } = useScroll({ target: copyRef, offset: ['start 75%', 'end 70%'] });
  const rail = useSpring(read, { stiffness: 120, damping: 28 });
  useMotionValueEvent(read, 'change', (v) => setXp(Math.round(v * 100)));

  return (
    <section className={`about ${theme}${use3d ? ' about--3d' : ''}`} id="about" ref={ref}>
      <div className="about-grid">
        <div className="about-side">
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ amount: 0.35 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Target xp={xp} />
          </motion.div>
        </div>

        <div className="about-copy" ref={copyRef}>
          <span className="about-rail" aria-hidden="true">
            <motion.i style={{ scaleY: rail }}></motion.i>
          </span>

          <motion.header className="about-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
            <motion.h2 className="about-title" variants={lineIn} data-text="About Me">
              About Me
            </motion.h2>
            <motion.p className="about-role" variants={lineIn}>
              <span aria-hidden="true">&gt;</span> Full-Stack &amp; Game Developer
            </motion.p>
          </motion.header>

          {BIO.map((text) => (
            <ScrubText key={text.slice(0, 16)} text={text} />
          ))}

          <ul className="skills">
            {SKILLS.map((skill) => (
              <Skill key={skill.title} skill={skill} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About;
