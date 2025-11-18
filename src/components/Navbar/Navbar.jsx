import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

import { useTheme } from '../../hooks/useTheme';
import './Navbar.css';

const Navbar = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="menu-overlay"
            whileHover={{ scale: 1.06, rotate: isMobileMenuOpen ? 0 : 2 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 7 : 0 }} />
            <motion.span animate={{ opacity: isMobileMenuOpen ? 0 : 1 }} />
            <motion.span animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -7 : 0 }} />
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && createPortal(
          (
            <motion.nav
              id="menu-overlay"
              role="navigation"
              aria-label="Mobile"
              className="menu-overlay"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              style={{ top: 0, zIndex: 2147483646 }}
            >
              <motion.a href="#home" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Home</span></motion.a>
              <motion.a href="#about" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>About</span></motion.a>
              <motion.a href="#experience" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Experience</span></motion.a>
              <motion.a href="#projects" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Projects</span></motion.a>
              <motion.a href="#skills-bottom" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Skills</span></motion.a>
              <motion.a href="#youtube" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>YouTube</span></motion.a>
              <motion.a href="#linkedin-posts" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Blog</span></motion.a>
              <motion.a href="#contact" className="overlay-link" onClick={toggleMobileMenu} whileHover={{ x: 10 }} whileTap={{ scale: 0.95 }}><span>Contact</span></motion.a>
            </motion.nav>
          ),
          document.body
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;