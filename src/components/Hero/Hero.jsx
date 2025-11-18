import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import profileImage from '../../assets/manik-image-passport-size.jpg';
import resumePdf from '../../assets/Manik-Resume.pdf';
import './Hero.css';

const Hero = () => {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { threshold: 0.1 });
  
  const roles = useMemo(() => [
    'Full Stack Web Developer',
    'Game Developer',
    'Software Engineer',
    'Video Editor',
    'Content Creator'
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % roles.length);
    }, 3000); // Change role every 3 seconds

    return () => clearInterval(interval);
  }, [roles]);

  // Animation variants
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

  const floatingAnimation = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const stats = [
    { number: '10+', label: 'Projects Completed' },
    { number: '5+', label: 'Technologies' },
    { number: '3+', label: 'Game Engines' },
    { number: '0', label: 'Years Experience' }
  ];

  const socialLinks = [
    { 
      name: 'GitHub', 
      url: 'https://github.com/manikkDev', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    },
    { 
      name: 'LinkedIn', 
      url: 'https://www.linkedin.com/in/manikaraj-anburaj-4550ba354/', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    { 
      name: 'LeetCode', 
      url: 'https://leetcode.com', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
        </svg>
      )
    },
    { 
      name: 'GeeksforGeeks', 
      url: 'https://geeksforgeeks.org', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M21.45 14.315c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.565 4.677 4.677 0 0 1-1.425.213 4.677 4.677 0 0 1-1.425-.213 3.691 3.691 0 0 1-1.104-.565 2.795 2.795 0 0 1-.565-.745 2.054 2.054 0 0 1-.213-.96c0-.334.071-.645.213-.96.143-.28.334-.532.565-.745a3.691 3.691 0 0 1 1.104-.565A4.677 4.677 0 0 1 18.35 10.5c.491 0 .96.071 1.425.213.447.143.847.334 1.104.565.231.213.422.465.565.745.142.315.213.626.213.96 0 .334-.071.645-.213.96zm-9.113-.5c-.143.28-.334.532-.565.745a3.691 3.691 0 0 1-1.104.565 4.677 4.677 0 0 1-1.425.213 4.677 4.677 0 0 1-1.425-.213 3.691 3.691 0 0 1-1.104-.565 2.795 2.795 0 0 1-.565-.745 2.054 2.054 0 0 1-.213-.96c0-.334.071-.645.213-.96.143-.28.334-.532.565-.745a3.691 3.691 0 0 1 1.104-.565A4.677 4.677 0 0 1 9.238 10.5c.491 0 .96.071 1.425.213.447.143.847.334 1.104.565.231.213.422.465.565.745.142.315.213.626.213.96 0 .334-.071.645-.213.96z"/>
        </svg>
      )
    },
    { 
      name: 'CodeChef', 
      url: 'https://codechef.com', 
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="social-svg">
          <path d="M11.257.004c-.37 0-.74.012-1.109.036C4.717.281.281 4.717.036 10.148c-.245 5.431 3.793 10.024 9.224 10.269 5.431.245 10.024-3.793 10.269-9.224C19.774 5.762 15.736 1.169 10.305.924c-.349-.024-.698-.036-1.048-.036zm-.001 1.5c.324 0 .648.011.971.033 4.739.322 8.47 4.053 8.792 8.792.322 4.739-3.207 8.792-7.946 9.114-4.739.322-8.792-3.207-9.114-7.946C3.637 6.758 7.166 2.705 11.905 2.383c.117-.008.234-.012.351-.012zm.001 3c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 1.5c1.933 0 3.5 1.567 3.5 3.5s-1.567 3.5-3.5 3.5-3.5-1.567-3.5-3.5 1.567-3.5 3.5-3.5z"/>
        </svg>
      )
    }
  ];

  return (
    <motion.section 
      className={`hero ${theme}`} 
      id="home"
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      <div className="hero-container">
        <motion.div className="hero-content" variants={containerVariants}>
          {/* Left Side - Image */}
          <motion.div className="hero-image-section" variants={slideInLeft}>
            <motion.div className="image-container" variants={scaleIn}>
              <div className="image-placeholder">
                <motion.img 
                  src={profileImage} 
                  alt="Manikaraj Anburaj" 
                  className="profile-image"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="image-glow"></div>
                <div className="gaming-overlay"></div>
              </div>
              <motion.div className="floating-elements" {...floatingAnimation}>
                {/* Professional Gaming HUD Elements */}
                <motion.div 
                  className="hud-element terminal-window"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className="terminal-content">
                    <span className="terminal-text">$ npm run dev</span>
                    <div className="cursor-blink"></div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="hud-element code-panel"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                   <div className="code-lines">
                     <div className="code-line">function() {'{'}</div>
                     <div className="code-line">  return magic;</div>
                     <div className="code-line">{'}'}</div>
                   </div>
                   <div className="syntax-highlight"></div>
                 </motion.div>
                
                <motion.div 
                  className="hud-element game-stats"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <div className="stat-bar">
                    <div className="stat-label">XP</div>
                    <div className="stat-progress">
                      <div className="stat-fill"></div>
                    </div>
                  </div>
                  <div className="level-indicator">LVL 99</div>
                </motion.div>
                
                {/* Interactive Glitch Particles */}
                <div className="glitch-particles">
                  <div className="glitch-particle" style={{"--delay": "0s", "--x": "20%", "--y": "30%"}}></div>
                  <div className="glitch-particle" style={{"--delay": "2s", "--x": "80%", "--y": "60%"}}></div>
                  <div className="glitch-particle" style={{"--delay": "4s", "--x": "60%", "--y": "20%"}}></div>
                  <div className="glitch-particle" style={{"--delay": "6s", "--x": "30%", "--y": "80%"}}></div>
                  <div className="glitch-particle" style={{"--delay": "8s", "--x": "70%", "--y": "40%"}}></div>
                </div>
                
                {/* Digital Grid Overlay */}
                
                
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div className="hero-text-section" variants={slideInRight}>
            <div className="welcome-text">
              <motion.h1 className="main-heading" variants={fadeInUp}>
                Welcome to my portfolio
              </motion.h1>
              
              <motion.div className="intro-text-container" variants={fadeInUp}>
                 <div className="glitch-intro-wrapper">
                   <div className="single-line-intro">
                     <span className="typing-text" data-text="Hi, I'm ">Hi, I'm </span>
                     <span className="name-glitch" data-text="Manikaraj Anburaj">Manikaraj Anburaj</span>
                     <span className="call-me-text">. You can call me </span>
                     <span className="manik-glitch" data-text="Manik">Manik</span>
                     <div className="digital-emoji">😋</div>
                   </div>
                   <div className="role-display">
                     <motion.span 
                       className="role-text glitch-text" 
                       data-text={roles[currentIndex]}
                       key={currentIndex}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                       transition={{ duration: 0.5 }}
                     >
                       {roles[currentIndex]}
                     </motion.span>
                   </div>
                 </div>
                 <div className="data-corruption-overlay"></div>
                 <div className="matrix-rain"></div>
               </motion.div>

              <motion.p className="description" variants={fadeInUp}>
                I am a passionate learner and creative problem solver who thrives on turning innovative ideas into reality. 
                With expertise spanning web development, game creation, and digital content, I bring a unique blend of 
                technical skills and creative vision to every project. I'm constantly exploring new technologies and 
                pushing the boundaries of what's possible in the digital realm.
              </motion.p>

              {/* Stats Buttons */}
              <motion.div className="stats-container" variants={fadeInUp}>
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="stat-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Action Buttons */}
              <motion.div className="action-buttons" variants={fadeInUp}>
                <motion.a 
                  href="#contact"
                  className="btn btn-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="btn-icon">📧</span>
                  Get in Touch
                </motion.a>
                <motion.a 
                  href={resumePdf}
                  download="Manik-Resume.pdf"
                  className="btn btn-secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="btn-icon">📄</span>
                  Download CV
                </motion.a>
              </motion.div>

              {/* Social Links */}
              <motion.div className="social-links" variants={fadeInUp}>
                {socialLinks.map((social, index) => (
                  <motion.a 
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link gaming-social"
                    title={social.name}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="social-icon">{social.icon}</span>
                  </motion.a>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Professional Gaming Background */}
        <div className="hero-bg">
          <div className="circuit-pattern"></div>
          
          <div className="glitch-overlay"></div>
          <div className="scan-grid"></div>
        </div>
      </div>
    </motion.section>
  );
};

export default Hero;