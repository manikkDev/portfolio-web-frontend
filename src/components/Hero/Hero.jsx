import { motion, useInView, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import profileImage from '../../assets/manik-image-passport-size.jpg';
import resumePdf from '../../assets/Manik-Resume.pdf';
import { useTheme } from '../../hooks/useTheme';
import './Hero.css';

const ROLES = [
  'Full Stack Web Developer',
  'Game Developer',
  'Software Engineer',
  'Video Editor',
  'Content Creator'
];

const STATS = [
  { value: 10, suffix: '+', label: 'Projects Completed' },
  { value: 5, suffix: '+', label: 'Technologies' },
  { value: 3, suffix: '+', label: 'Game Engines' },
  { value: 0, suffix: '', label: 'Years Experience' }
];

// 24x24 icons, drawn with the current text colour.
const ICONS = {
  github: 'M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  leetcode: 'M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z',
  geeksforgeeks: 'M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.695 4.51 4.51 0 0 1-3.116-.016 3.79 3.79 0 0 1-2.135-2.078 3.571 3.571 0 0 1-.13-.353h7.418a4.26 4.26 0 0 1-.368 1.008zm-11.99-.654a3.793 3.793 0 0 1-2.134 2.078 4.51 4.51 0 0 1-3.117.016 3.7 3.7 0 0 1-1.104-.695 2.652 2.652 0 0 1-.564-.745 4.221 4.221 0 0 1-.368-1.006H9.59c-.038.12-.08.238-.13.352zm14.501-1.758a3.849 3.849 0 0 0-.082-.475l-9.634-.008a3.932 3.932 0 0 1 1.143-2.348c.363-.35.79-.625 1.26-.809a3.97 3.97 0 0 1 4.484.957l1.521-1.49a5.7 5.7 0 0 0-1.922-1.357 6.283 6.283 0 0 0-2.544-.49 6.35 6.35 0 0 0-2.405.457 6.007 6.007 0 0 0-1.963 1.276 6.142 6.142 0 0 0-1.325 1.94 5.862 5.862 0 0 0-.466 1.864h-.063a5.857 5.857 0 0 0-.467-1.865 6.13 6.13 0 0 0-1.325-1.939A6 6 0 0 0 8.21 6.34a6.698 6.698 0 0 0-4.949.031A5.708 5.708 0 0 0 1.34 7.73l1.52 1.49a4.166 4.166 0 0 1 4.484-.958c.47.184.898.46 1.26.81.368.36.66.792.859 1.268.146.344.242.708.285 1.08l-9.635.008A4.714 4.714 0 0 0 0 12.457a6.493 6.493 0 0 0 .345 2.127 4.927 4.927 0 0 0 1.08 1.783c.528.56 1.17 1 1.88 1.293a6.454 6.454 0 0 0 2.504.457c.824.005 1.64-.15 2.404-.457a6 6 0 0 0 1.964-1.277 6.116 6.116 0 0 0 1.686-3.076h.273a6.13 6.13 0 0 0 1.686 3.077 5.99 5.99 0 0 0 1.964 1.276 6.345 6.345 0 0 0 2.405.457 6.45 6.45 0 0 0 2.502-.457 5.42 5.42 0 0 0 1.882-1.293 4.928 4.928 0 0 0 1.08-1.783A6.52 6.52 0 0 0 24 12.457a4.757 4.757 0 0 0-.039-.554z',
  // a plain chef's hat (own drawing, not the CodeChef logo)
  codechef: 'M12 3a4.5 4.5 0 0 1 4.03 2.5A4 4 0 0 1 18 13.4V15H6v-1.6a4 4 0 0 1 1.97-7.9A4.5 4.5 0 0 1 12 3zM6 16.5h12V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19v-2.5z',
  mail: 'M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-13zm2.2.5 6.8 5.6L18.8 6H5.2zM19 7.4l-7 5.8-7-5.8V18h14V7.4z',
  download: 'M11 3h2v9.2l3.3-3.3 1.4 1.4L12 16l-5.7-5.7 1.4-1.4L11 12.2V3zM4 18h16v3H4v-3z'
};

const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    <path fillRule="evenodd" clipRule="evenodd" d={ICONS[name]} />
  </svg>
);

const LINKS = [
  { name: 'GitHub', icon: 'github', url: 'https://github.com/manikkDev' },
  { name: 'LinkedIn', icon: 'linkedin', url: 'https://www.linkedin.com/in/manikaraj-anburaj-4550ba354/' },
  { name: 'LeetCode', icon: 'leetcode', url: 'https://leetcode.com/u/manikkdev/' },
  { name: 'GeeksforGeeks', icon: 'geeksforgeeks', url: 'https://www.geeksforgeeks.org/profile/manickk' },
  { name: 'CodeChef', icon: 'codechef', url: 'https://www.codechef.com/users/manickk' }
];

// Keys that play the 3D gamepad docked under the card. Letters only, so the arrow
// keys keep scrolling the page.
const PAD_KEYS = {
  KeyW: 'Dpad_Up', KeyS: 'Dpad_Down', KeyA: 'Dpad_Left', KeyD: 'Dpad_Right',
  KeyJ: 'Btn_X', KeyK: 'Btn_A', KeyL: 'Btn_B', KeyI: 'Btn_Y'
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Types each word, holds it, erases it, then moves to the next. */
function useTypewriter(words) {
  const [text, setText] = useState(words[0]);

  useEffect(() => {
    let word = 0;
    let id;
    if (prefersReducedMotion()) {
      // no typing: just swap the whole word
      id = setInterval(() => setText(words[(word = (word + 1) % words.length)]), 3000);
      return () => clearInterval(id);
    }
    let length = words[0].length;
    let erasing = true;
    const step = () => {
      const current = words[word];
      length += erasing ? -1 : 1;
      setText(current.slice(0, length));
      let delay = erasing ? 26 : 58;
      if (!erasing && length === current.length) {
        erasing = true;
        delay = 1900; // hold the finished word
      } else if (erasing && length === 0) {
        erasing = false;
        word = (word + 1) % words.length;
        delay = 320;
      }
      id = setTimeout(step, delay);
    };
    id = setTimeout(step, 2200);
    return () => clearTimeout(id);
  }, [words]);

  return text;
}

/** Counts from 0 up to `to` once `run` turns true. */
function Count({ to, run }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!run) return undefined;
    if (prefersReducedMotion() || to === 0) {
      setN(to);
      return undefined;
    }
    const started = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - started) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, run]);

  return n;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.09, delayChildren: 0.05 } }
};

// The profile card settles into place.
const cardIn = {
  hidden: { opacity: 0, y: 26, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
};

// Each line of copy is wiped in from the left, as if a display were printing it. The clip
// reaches a little past the box so glows are not cut off, and is dropped once the line is in.
const lineIn = {
  hidden: { opacity: 0, x: -16, clipPath: 'inset(-12% 100% -12% -4%)' },
  visible: {
    opacity: 1,
    x: 0,
    clipPath: 'inset(-12% -4% -12% -4%)',
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
    transitionEnd: { clipPath: 'none' }
  }
};

/**
 * `world` is the shared 3D scene (see src/world). When it is ready and the theme is dark,
 * the hero sits over it; otherwise the hero keeps its own CSS background.
 * `introDone` holds the entrance animation back until the intro has finished.
 */
const Hero = ({ world, introDone = true }) => {
  const { theme } = useTheme();
  const [entered, setEntered] = useState(false);
  const ref = useRef(null);
  const padSlotRef = useRef(null);
  const isInView = useInView(ref, { amount: 0.05 });
  const role = useTypewriter(ROLES);

  const scene = world?.scene ?? null;
  const use3d = Boolean(scene) && theme === 'dark';

  // Play the entrance once, when the hero is on screen and the intro is out of the way.
  useEffect(() => {
    if (introDone && isInView) setEntered(true);
  }, [introDone, isInView]);

  // The 3D world only draws while the hero is on screen (and during the intro).
  useEffect(() => {
    scene?.setActive(theme === 'dark' && (isInView || !introDone));
  }, [scene, theme, isInView, introDone]);

  // Dock the 3D gamepad onto its slot in the layout.
  useEffect(() => {
    if (!scene) return undefined;
    scene.setPadAnchor(use3d ? padSlotRef.current : null);
    return () => scene.setPadAnchor(null);
  }, [scene, use3d]);

  // Scrolling away lifts the 3D camera and lets the content drift up and fade.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => scene?.setScroll(v));
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // W A S D and I J K L press the gamepad's controls.
  useEffect(() => {
    if (!use3d) return undefined;
    const onKey = (e) => {
      const control = PAD_KEYS[e.code];
      if (!control || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      scene.press(control, e.type === 'keydown');
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [scene, use3d]);

  const onPointerMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };

  // Over the photo: the card tilts like one held in the hand and a light follows the cursor.
  const onCardMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = e.currentTarget;
    const r = card.firstElementChild.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--tilt-x', (x * 2 - 1).toFixed(3));
    card.style.setProperty('--tilt-y', (y * 2 - 1).toFixed(3));
    card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  };
  const onCardLeave = (e) => {
    e.currentTarget.style.setProperty('--tilt-x', 0);
    e.currentTarget.style.setProperty('--tilt-y', 0);
  };

  // A click on the gamepad spins it; anywhere else the towers nearby jump and a ring of
  // light crosses the floor.
  const onClick = (e) => {
    if (!use3d || e.target.closest('a, button')) return;
    const pad = padSlotRef.current?.getBoundingClientRect();
    const onPad = pad && e.clientX > pad.left && e.clientX < pad.right && e.clientY > pad.top && e.clientY < pad.bottom;
    if (onPad) scene.spinPad();
    else scene.ripple(e.clientX, e.clientY);
  };

  return (
    <motion.section
      className={`hero ${theme}${use3d ? ' hero--3d' : ''}${entered ? ' is-entered' : ''}`}
      id="home"
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={entered ? 'visible' : 'hidden'}
      onPointerMove={onPointerMove}
      onClick={onClick}
    >
      <div className="hero-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      <motion.div className="hero-container" style={{ y: contentY, opacity: contentOpacity }}>
        <motion.div className="hero-content" variants={containerVariants}>
          {/* Left: player card */}
          <motion.div className="hero-side" variants={cardIn}>
            <div className="pcard" onPointerMove={onCardMove} onPointerLeave={onCardLeave}>
              <div className="pcard-shell">
                <div className="pcard-frame">
                  <div className="pcard-photo">
                    <img src={profileImage} alt="Manikaraj Anburaj" />
                    <span className="pcard-tint" aria-hidden="true"></span>
                    <span className="pcard-lines" aria-hidden="true"></span>
                    <span className="pcard-glare" aria-hidden="true"></span>
                    <span className="pcard-id">Mumbai, IN</span>
                  </div>
                </div>
                <span className="pcard-corner pcard-corner--tr" aria-hidden="true"></span>
                <span className="pcard-corner pcard-corner--bl" aria-hidden="true"></span>
              </div>

              <p className="pcard-chip" aria-hidden="true">$ npm run dev<i></i></p>

              <div className="pcard-plate">
                <div className="pcard-row">
                  <span>Player 01</span>
                  <span className="pcard-status"><i aria-hidden="true"></i>Online</span>
                </div>
                <div className="pcard-xp">
                  <span>XP</span>
                  <div className="pcard-bar" aria-hidden="true"><i></i></div>
                  <b>LVL 99</b>
                </div>
              </div>
            </div>

            {/* The 3D gamepad is drawn by the world scene on top of this slot. */}
            {use3d && (
              <div className="hero-pad" aria-hidden="true">
                <div className="hero-pad-slot" ref={padSlotRef}></div>
                <p className="hero-pad-hint">
                  <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>move</span>
                  <kbd>I</kbd><kbd>J</kbd><kbd>K</kbd><kbd>L</kbd><span>press</span>
                </p>
                <p className="hero-pad-hint">
                  <kbd>Cursor</kbd><span>pulls the city apart</span>
                  <kbd>Click</kbd><span>pulse</span>
                </p>
              </div>
            )}
          </motion.div>

          {/* Right: copy */}
          <div className="hero-copy">
            <motion.p className="heyebrow" variants={lineIn}>
              Welcome to my portfolio
            </motion.p>

            <motion.h1 className="hname" variants={lineIn} aria-label="Hi, I'm Manikaraj Anburaj">
              <span className="hname-hi" aria-hidden="true">Hi, I'm</span>
              <span className="hname-word" data-text="Manikaraj" aria-hidden="true">Manikaraj</span>
              <span className="hname-word" data-text="Anburaj" aria-hidden="true">Anburaj</span>
            </motion.h1>

            <motion.p className="halias" variants={lineIn}>
              You can call me <b>Manik</b> 😋
            </motion.p>

            <motion.p className="hrole" variants={lineIn} aria-label={`Roles: ${ROLES.join(', ')}`}>
              <span className="hrole-prompt" aria-hidden="true">&gt;</span>
              <span aria-hidden="true">{role}</span>
              <i className="hrole-caret" aria-hidden="true"></i>
            </motion.p>

            <motion.p className="hdesc" variants={lineIn}>
              I am a passionate learner and creative problem solver who thrives on turning innovative ideas into reality.
              With expertise spanning web development, game creation, and digital content, I bring a unique blend of
              technical skills and creative vision to every project. I'm constantly exploring new technologies and
              pushing the boundaries of what's possible in the digital realm.
            </motion.p>

            <motion.dl className="hstats" variants={lineIn}>
              {STATS.map((stat) => (
                <div className="hstat" key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd><Count to={stat.value} run={entered} />{stat.suffix}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div className="hbtns" variants={lineIn}>
              <a href="#contact" className="hbtn hbtn--primary">
                <Icon name="mail" />
                <span>Get in Touch</span>
              </a>
              <a href={resumePdf} download="Manik-Resume.pdf" className="hbtn hbtn--ghost">
                <Icon name="download" />
                <span>Download CV</span>
              </a>
            </motion.div>

            <motion.ul className="hlinks" variants={lineIn}>
              {LINKS.map((link) => (
                <li key={link.name}>
                  <a className="hlink" href={link.url} target="_blank" rel="noopener noreferrer">
                    <Icon name={link.icon} />
                    <span>{link.name}</span>
                  </a>
                </li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      </motion.div>

      <a className="hero-scroll" href="#about" aria-label="Scroll to About">
        Scroll
        <span aria-hidden="true"></span>
      </a>

      {/* Background: the shared 3D world shows through; these layers are the fallback */}
      <div className="hero-bg">
        <div className="circuit-pattern"></div>

        <div className="glitch-overlay"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  );
};

export default Hero;
