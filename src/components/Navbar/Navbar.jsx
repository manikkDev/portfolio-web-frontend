import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTheme } from '../../hooks/useTheme';
import './Navbar.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills-bottom' },
  { label: 'YouTube', href: '#youtube' },
  { label: 'Blog', href: '#linkedin-posts' },
  { label: 'Contact', href: '#contact' },
];

const MOBILE_LINKS = [
  ...NAV_LINKS,
  { label: 'GeeksforGeeks', href: 'https://www.geeksforgeeks.org/profile/manickk', external: true },
];

const Navbar = () => {
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [isCompact, setIsCompact] = useState(false);
  const rafRef = useRef(null);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((v) => !v);
  }, []);

  // Close on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (e) => setIsCompact(e.matches);
    setIsCompact(mq.matches);
    mq.addEventListener('change', onChange);

    const mqDesktop = window.matchMedia('(min-width: 1025px)');
    const onDesktop = (e) => { if (e.matches) setIsMobileMenuOpen(false); };
    mqDesktop.addEventListener('change', onDesktop);

    return () => {
      mq.removeEventListener('change', onChange);
      mqDesktop.removeEventListener('change', onDesktop);
    };
  }, []);

  // Body scroll lock + escape key when menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    document.body.classList.toggle('menu-open', isMobileMenuOpen);

    const onKey = (e) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [isMobileMenuOpen]);

  // Scroll: progress bar + scrolled state + active section
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.replace('#', ''));

    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // Scroll progress
        setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        
        // Scrolled state
        setIsScrolled(scrollTop > 40);

        // Active section (find the one closest to viewport top)
        let current = 'home';
        const offset = 120;
        for (const id of sectionIds) {
          const el = document.getElementById(id);
          if (el && el.offsetTop - offset <= scrollTop) {
            current = id;
          }
        }
        setActiveSection(current);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { y: -16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const linkVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const topLine = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: 45, y: 7, backgroundColor: '#ff00ff', boxShadow: '0 0 8px rgba(255,0,255,0.6)' },
  };
  const midLine = {
    closed: { opacity: 1 },
    open: { opacity: 0 },
  };
  const botLine = {
    closed: { rotate: 0, y: 0 },
    open: { rotate: -45, y: -7, backgroundColor: '#ff00ff', boxShadow: '0 0 8px rgba(255,0,255,0.6)' },
  };

  return (
    <motion.nav
      className={`navbar ${theme} ${isScrolled ? 'scrolled' : ''}`}
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Scroll progress bar */}
      <div
        className="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <div className="navbar-container">
        {/* Logo */}
        <motion.div className="navbar-logo" variants={itemVariants}>
          <span className="logo-text">Manik-</span>
          <span className="logo-accent">Dev</span>
        </motion.div>

        {/* Desktop Navigation */}
        <motion.div className="navbar-menu" variants={itemVariants}>
          {NAV_LINKS.map((link) => {
            const sectionId = link.href.replace('#', '');
            return (
              <motion.a
                key={link.href}
                href={link.href}
                className={`navbar-link ${activeSection === sectionId ? 'active' : ''}`}
                variants={linkVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span>{link.label}</span>
              </motion.a>
            );
          })}
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
                animate={{
                  x: isDarkMode ? (isCompact ? 16 : 18) : 0,
                  rotate: isDarkMode ? 180 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              >
                {isDarkMode ? '🌙' : '☀️'}
              </motion.div>
            </div>
          </motion.button>

          {/* Hamburger */}
          <motion.button
            className={`menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            type="button"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span variants={topLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.2 }} />
            <motion.span variants={midLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.15 }} />
            <motion.span variants={botLine} animate={isMobileMenuOpen ? 'open' : 'closed'} transition={{ duration: 0.2 }} />
          </motion.button>
        </motion.div>
      </div>

      {/* Mobile Menu — portal to body */}
      {createPortal(
        <nav
          id="mobile-menu"
          role="navigation"
          aria-label="Mobile navigation"
          className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}
        >
          {MOBILE_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mobile-link"
              onClick={toggleMobileMenu}
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span>{link.label}</span>
            </a>
          ))}
        </nav>,
        document.body
      )}
    </motion.nav>
  );
};

export default Navbar;