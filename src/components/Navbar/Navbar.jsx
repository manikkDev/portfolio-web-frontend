import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTheme } from '../../hooks/useTheme';
import './Navbar.css';

const Navbar = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((v) => !v);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsCompact(e.matches);
    setIsCompact(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    try {
      document.body.classList.toggle('menu-open', !!isMobileMenuOpen);
    } catch (e) { void e }
    const onKey = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const linkVariants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2, ease: "easeInOut" }
    },
    tap: { scale: 0.95 }
  };

  const topLine = {
    closed: { rotate: 0, y: 0, backgroundColor: 'var(--current-text-primary)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    open: { rotate: 45, y: 7, backgroundColor: '#ff00ff', boxShadow: '0 0 8px rgba(255,0,255,0.6)' }
  };

  const midLine = {
    closed: { opacity: 1, backgroundColor: 'var(--current-text-primary)' },
    open: { opacity: 0 }
  };

  const botLine = {
    closed: { rotate: 0, y: 0, backgroundColor: 'var(--current-text-primary)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
    open: { rotate: -45, y: -7, backgroundColor: '#ff00ff', boxShadow: '0 0 8px rgba(255,0,255,0.6)' }
  };

  

  return (
    <motion.nav 
      className={`navbar ${theme}`}
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="navbar-container">
        {/* Logo */}
        <motion.div className="navbar-logo" variants={itemVariants}>
          <span className="logo-text">Manik-</span>
          <span className="logo-accent">Dev</span>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.div className="navbar-menu" variants={itemVariants}>
          <motion.a 
            href="#home" 
            className="navbar-link active"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Home</span>
          </motion.a>
          <motion.a 
            href="#about" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>About</span>
          </motion.a>
          <motion.a 
            href="#experience" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Experience</span>
          </motion.a>
          <motion.a 
            href="#projects" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Projects</span>
          </motion.a>
          <motion.a 
            href="#skills-bottom" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Skills</span>
          </motion.a>
          <motion.a 
            href="#youtube" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>YouTube</span>
          </motion.a>
          <motion.a 
            href="#linkedin-posts" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Blog</span>
          </motion.a>
          <motion.a 
            href="#contact" 
            className="navbar-link"
            variants={linkVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <span>Contact</span>
          </motion.a>
        </motion.div>

        {/* Theme Toggle & Mobile Menu */}
        <motion.div className="navbar-actions" variants={itemVariants}>
          {/* Theme Toggle */}
          <motion.button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="toggle-track">
              <motion.div 
                className={`toggle-thumb ${isDarkMode ? 'dark' : 'light'}`}
                animate={{ x: isDarkMode ? (isCompact ? 16 : 18) : 0, rotate: isDarkMode ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                {isDarkMode ? '🌙' : '☀️'}
              </motion.div>
            </div>
          </motion.button>

          <motion.button 
            className={`menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="menu-overlay"
            whileHover={{ scale: 1.06, rotate: isMobileMenuOpen ? 0 : 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span variants={topLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.22 }} />
            <motion.span variants={midLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.18 }} />
            <motion.span variants={botLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.22 }} />
          </motion.button>
        </motion.div>
      </div>

      {createPortal(
        (
          <nav
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile"
            className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
          >
            <a href="#home" className="mobile-link" onClick={toggleMobileMenu}><span>Home</span></a>
            <a href="#about" className="mobile-link" onClick={toggleMobileMenu}><span>About</span></a>
            <a href="#experience" className="mobile-link" onClick={toggleMobileMenu}><span>Experience</span></a>
            <a href="#projects" className="mobile-link" onClick={toggleMobileMenu}><span>Projects</span></a>
            <a href="#skills-bottom" className="mobile-link" onClick={toggleMobileMenu}><span>Skills</span></a>
            <a href="#youtube" className="mobile-link" onClick={toggleMobileMenu}><span>YouTube</span></a>
            <a href="https://www.geeksforgeeks.org/profile/manickk" className="mobile-link" onClick={toggleMobileMenu} target="_blank" rel="noopener noreferrer"><span>GeeksforGeeks</span></a>
            <a href="#contact" className="mobile-link" onClick={toggleMobileMenu}><span>Contact</span></a>
          </nav>
        ),
        document.body
      )}
    </motion.nav>
  );
};

export default Navbar;