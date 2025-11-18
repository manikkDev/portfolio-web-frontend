import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useSpring, useAnimationControls } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import manikUnemployedImage from '../../assets/manik-unemployed.jpg';
import employedManikImage from '../../assets/employed-manik.jpg';
import './About.css';

const About = () => {
  const { theme } = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1 });
  const hudRef = useRef(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const sx = useSpring(mvX, { stiffness: 300, damping: 25 });
  const sy = useSpring(mvY, { stiffness: 300, damping: 25 });
  const REST_OFFSET_Y = 80;
  const handleMove = (e) => {
    const r = hudRef.current?.getBoundingClientRect();
    if (!r) return;
    mvX.set(e.clientX - r.left);
    mvY.set(e.clientY - r.top);
  };
  const handleLeave = () => {
    const r = hudRef.current?.getBoundingClientRect();
    if (!r) return;
    mvX.set(r.width / 2);
    mvY.set(r.height / 2 + REST_OFFSET_Y);
  };
  const [shotId, setShotId] = useState(0);
  const [hp, setHp] = useState(86);
  const [ko, setKo] = useState(false);
  const [imgSrc, setImgSrc] = useState(manikUnemployedImage);
  // recoil handled by controls
  const [revealed, setRevealed] = useState(false);
  const recoilCtrl = useAnimationControls();
  const danger = hp <= 25;
  useEffect(() => {
    const r = hudRef.current?.getBoundingClientRect();
    if (!r) return;
    mvX.set(r.width / 2);
    mvY.set(r.height / 2 + REST_OFFSET_Y);
  }, [mvX, mvY]);
  const handleShoot = () => {
    setShotId((n) => n + 1);
    recoilCtrl.start({
      x: [0, -3, 3, -2, 2, 0],
      rotateZ: [0, -0.8, 0.8, -0.4, 0.4, 0],
      transition: { duration: 0.28, ease: 'easeOut' }
    });
    if (ko) return;
    const next = Math.max(0, hp - 12);
    if (next === 0 && !revealed) {
      setHp(0);
      setKo(true);
      setTimeout(() => setImgSrc(employedManikImage), 600);
      setTimeout(() => setKo(false), 1400);
      setRevealed(true);
    } else {
      setHp(next);
    }
  };

  const [shieldHp, setShieldHp] = useState([100, 100, 100]);
  const [shieldPulse, setShieldPulse] = useState([0, 0, 0]);
  const shieldRefs = useRef([]);
  const onShieldClick = (i, e) => {
    const el = shieldRefs.current[i];
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--sx', e.clientX - r.left + 'px');
    el.style.setProperty('--sy', e.clientY - r.top + 'px');
    setShieldPulse((p) => { const n = [...p]; n[i] = p[i] + 1; return n; });
    setShieldHp((h) => { const n = [...h]; n[i] = Math.max(0, h[i] - 34); return n; });
  };

  // Animation variants for scroll-triggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  };

  const slideInLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const fadeInUp = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.section 
      className={`about ${theme}`} 
      id="about"
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="about-container">
        <motion.div className="about-content" variants={containerVariants}>
          {/* Left Side - Image */}
          <motion.div className="about-image-section" variants={slideInLeft}>
            <motion.div 
              className="image-container"
              variants={scaleIn}
              style={{ perspective: 600 }}
            >
              <div className="image-placeholder">
                <motion.div className="img-recoil" animate={recoilCtrl}>
                  <motion.img 
                  src={imgSrc} 
                  alt="Manik" 
                  className="about-image"
                  animate={{ 
                    filter: danger ? 'brightness(0.9) saturate(1.1)' : 'none', 
                    scale: ko ? 1.04 : 1
                  }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                />
                </motion.div>
                {ko && (
                  <div className="reveal-overlay">
                    <span className="bar" style={{ '--d': '0ms' }}></span>
                    <span className="bar" style={{ '--d': '60ms' }}></span>
                    <span className="bar" style={{ '--d': '120ms' }}></span>
                    <span className="bar" style={{ '--d': '180ms' }}></span>
                    <span className="bar" style={{ '--d': '240ms' }}></span>
                    <span className="bar" style={{ '--d': '300ms' }}></span>
                    <span className="bar" style={{ '--d': '360ms' }}></span>
                    <span className="bar" style={{ '--d': '420ms' }}></span>
                  </div>
                )}
              </div>
              <div
                className="game-hud"
                ref={hudRef}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                onClick={handleShoot}
              >
                <motion.div className="reticle" style={{ left: sx, top: sy }} animate={{ scale: danger ? 1.08 : 1 }} />
                <motion.div className="shot-pulse" key={`pulse-${shotId}`} style={{ left: sx, top: sy }} initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.5 }} />
                <motion.div className="shot-burst" key={`burst-${shotId}`} style={{ left: sx, top: sy }}>
                  <span className="particle p1"></span>
                  <span className="particle p2"></span>
                  <span className="particle p3"></span>
                  <span className="particle p4"></span>
                  <span className="particle p5"></span>
                  <span className="particle p6"></span>
                  <span className="particle p7"></span>
                  <span className="particle p8"></span>
                </motion.div>
                <motion.div className="hud-panel stats" variants={scaleIn} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                  <div className="stat">
                    <span className="label">HP</span>
                    <div className="bar"><span style={{ width: `${hp}%` }}></span></div>
                    <span className="value">{hp}%</span>
                  </div>
                  <div className="stat">
                    <span className="label">AMMO</span>
                    <div className="bar"><span style={{ width: '68%' }}></span></div>
                    <span className="value">24</span>
                  </div>
                  <div className="stat">
                    <span className="label">XP</span>
                    <div className="bar"><span style={{ width: '72%' }}></span></div>
                    <span className="value">72%</span>
                  </div>
                </motion.div>
                <motion.div className="hud-panel loadout" variants={scaleIn} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
                  <div className="slot active">AR</div>
                  <div className="slot">SMG</div>
                  <div className="slot">SNIPER</div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div className="about-text-section" variants={slideInRight}>
            <motion.div className="about-text" variants={containerVariants}>
              <motion.h1 className="about-heading" variants={fadeInUp}>
                About Me
              </motion.h1>
              
              <motion.h2 className="about-subheading" variants={fadeInUp}>
                Full-Stack & Game Developer
              </motion.h2>
              
              <motion.p className="about-description" variants={fadeInUp}>
                I bring creative visions to life through code, specializing in both web platforms and interactive games. With expertise in full-stack development and game engineering, I build robust systems and optimize performance for seamless experiences. I believe great technology should feel invisible, empowering users to fully immerse themselves in digital worlds.
              </motion.p>
              <motion.p className="about-description" variants={fadeInUp}>
                My focus is on clean, maintainable code and scalable architecture. Whether architecting web applications or developing game mechanics, I approach every project with precision and a user-first mindset.
              </motion.p>

              {/* Skills Columns */}
              <motion.div className="skills-container" variants={containerVariants}>
                <motion.div className="skill-column" variants={scaleIn}>
                  <motion.div 
                    className={`skill-card ${shieldHp[0] === 0 ? 'unlocked' : 'locked'}`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={shieldHp[0] === 0 ? 'shield-overlay broken' : 'shield-overlay'}
                      ref={(el) => (shieldRefs.current[0] = el)}
                      style={{ opacity: shieldHp[0] / 100 }}
                      onClick={(e) => onShieldClick(0, e)}
                    >
                      <div className="shield-shards">
                        <span className="shard s1"></span>
                        <span className="shard s2"></span>
                        <span className="shard s3"></span>
                        <span className="shard s4"></span>
                        <span className="shard s5"></span>
                        <span className="shard s6"></span>
                        <span className="shard s7"></span>
                        <span className="shard s8"></span>
                        <span className="shard s9"></span>
                        <span className="shard s10"></span>
                        <span className="shard s11"></span>
                        <span className="shard s12"></span>
                      </div>
                      <div className="shield-pulse" key={`sp-0-${shieldPulse[0]}`}></div>
                      <div className="shield-hud">
                        <span className="hp-label">SHIELD</span>
                        <div className="hp-bar">
                          <span className="hp-fill" style={{ width: `${shieldHp[0]}%` }}></span>
                          <span className="hp-glow"></span>
                        </div>
                        <span className="hp-value">{shieldHp[0]}%</span>
                        <span className="hp-ping" key={`hp-0-${shieldPulse[0]}`}></span>
                      </div>
                    </div>
                    {shieldHp[0] === 0 && (
                      <div className="unlocked-banner">
                        <span className="unlocked-text" data-text="UNLOCKED">UNLOCKED</span>
                        <span className="unlocked-accent"></span>
                      </div>
                    )}
                    <motion.h3 className="skill-title" variants={fadeInUp}>Full-Stack Development</motion.h3>
                    <motion.p className="skill-description" variants={fadeInUp}>
                      Building modern, responsive web applications with optimized frontend interfaces and scalable backend systems.
                    </motion.p>
                  </motion.div>
                </motion.div>
                
                <motion.div className="skill-column" variants={scaleIn}>
                  <motion.div 
                    className={`skill-card ${shieldHp[1] === 0 ? 'unlocked' : 'locked'}`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={shieldHp[1] === 0 ? 'shield-overlay broken' : 'shield-overlay'}
                      ref={(el) => (shieldRefs.current[1] = el)}
                      style={{ opacity: shieldHp[1] / 100 }}
                      onClick={(e) => onShieldClick(1, e)}
                    >
                      <div className="shield-shards">
                        <span className="shard s1"></span>
                        <span className="shard s2"></span>
                        <span className="shard s3"></span>
                        <span className="shard s4"></span>
                        <span className="shard s5"></span>
                        <span className="shard s6"></span>
                        <span className="shard s7"></span>
                        <span className="shard s8"></span>
                        <span className="shard s9"></span>
                        <span className="shard s10"></span>
                        <span className="shard s11"></span>
                        <span className="shard s12"></span>
                      </div>
                      <div className="shield-pulse" key={`sp-1-${shieldPulse[1]}`}></div>
                      <div className="shield-hud">
                        <span className="hp-label">SHIELD</span>
                        <div className="hp-bar">
                          <span className="hp-fill" style={{ width: `${shieldHp[1]}%` }}></span>
                          <span className="hp-glow"></span>
                        </div>
                        <span className="hp-value">{shieldHp[1]}%</span>
                        <span className="hp-ping" key={`hp-1-${shieldPulse[1]}`}></span>
                      </div>
                    </div>
                    {shieldHp[1] === 0 && (
                      <div className="unlocked-banner">
                        <span className="unlocked-text" data-text="UNLOCKED">UNLOCKED</span>
                        <span className="unlocked-accent"></span>
                      </div>
                    )}
                    <motion.h3 className="skill-title" variants={fadeInUp}>Game Development</motion.h3>
                    <motion.p className="skill-description" variants={fadeInUp}>
                      Creating engaging gameplay experiences with performant code, intuitive mechanics, and immersive worlds.
                    </motion.p>
                  </motion.div>
                </motion.div>
                
                <motion.div className="skill-column" variants={scaleIn}>
                  <motion.div 
                    className={`skill-card ${shieldHp[2] === 0 ? 'unlocked' : 'locked'}`}
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={shieldHp[2] === 0 ? 'shield-overlay broken' : 'shield-overlay'}
                      ref={(el) => (shieldRefs.current[2] = el)}
                      style={{ opacity: shieldHp[2] / 100 }}
                      onClick={(e) => onShieldClick(2, e)}
                    >
                      <div className="shield-shards">
                        <span className="shard s1"></span>
                        <span className="shard s2"></span>
                        <span className="shard s3"></span>
                        <span className="shard s4"></span>
                        <span className="shard s5"></span>
                        <span className="shard s6"></span>
                        <span className="shard s7"></span>
                        <span className="shard s8"></span>
                        <span className="shard s9"></span>
                        <span className="shard s10"></span>
                        <span className="shard s11"></span>
                        <span className="shard s12"></span>
                      </div>
                      <div className="shield-pulse" key={`sp-2-${shieldPulse[2]}`}></div>
                      <div className="shield-hud">
                        <span className="hp-label">SHIELD</span>
                        <div className="hp-bar">
                          <span className="hp-fill" style={{ width: `${shieldHp[2]}%` }}></span>
                          <span className="hp-glow"></span>
                        </div>
                        <span className="hp-value">{shieldHp[2]}%</span>
                        <span className="hp-ping" key={`hp-2-${shieldPulse[2]}`}></span>
                      </div>
                    </div>
                    {shieldHp[2] === 0 && (
                      <div className="unlocked-banner">
                        <span className="unlocked-text" data-text="UNLOCKED">UNLOCKED</span>
                        <span className="unlocked-accent"></span>
                      </div>
                    )}
                    <motion.h3 className="skill-title" variants={fadeInUp}>Technical Problem-Solving</motion.h3>
                    <motion.p className="skill-description" variants={fadeInUp}>
                      Architecting elegant solutions to complex technical challenges across different platforms and domains.
                    </motion.p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Professional Gaming Background */}
        <div className="about-bg">
          <div className="circuit-pattern"></div>

          <div className="glitch-overlay"></div>
          <div className="scan-grid"></div>
        </div>
      </div>
    </motion.section>
  );
};

export default About;