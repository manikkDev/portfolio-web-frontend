import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import './Projects.css';
import apocalypseThumb from '../../assets/apocalypse-thumbnail.jpg';

const projectsData = {
  web: [
    {
      title: 'HealthWell',
      year: '2024',
      description:
        'AI-powered health platform featuring document analysis and an intelligent assistant with multi-language and dark mode; IoT monitoring upcoming.',
      stack: ['React JS', 'Node JS', 'Vite', 'MongoDB', 'Express'],
      links: { live: 'https://healthwell-frontend.vercel.app/', repo: 'https://github.com/manikkDev/HealthWell-Frontend' },
      thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fhealthwell-frontend.vercel.app%2F?w=800',
      info: [
        'Upload medical documents and get instant AI insights',
        'Intelligent Health Assistant with prompt input',
        'Dark mode toggle and US English language selector',
        'Sign In and Get Started primary actions',
        'Future perk: IoT Health Monitoring'
      ]
    },
    {
      title: 'WeCare',
      year: '2024',
      description:
        'Digital health records platform built for SIH Smart India Hackathon; supports migrant workers with secure records, OCR parsing, LLM summaries, and clinician review.',
      stack: ['React JS', 'Node JS', 'Vite', 'Firestore', 'Express'],
      links: { live: 'https://wecare-frontend-taupe.vercel.app/', repo: 'https://github.com/manikkDev/WeCare-Frontend' },
      thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Fwecare-frontend-taupe.vercel.app%2F?w=800',
      info: [
        'Digital Health Initiative for migrant workers in Kerala',
        'Secure & Confidential; Government Approved; Free Registration',
        'Upload + OCR Report Parsing of test names and values',
        'LLM Report Summary with flagged concerns',
        'Secure share links and Doctor Dashboard'
      ]
    },
    {
      title: 'DiscMath Companion',
      year: '2023',
      description:
        'Discrete Mathematics learning companion built as an engineering mini-project at Mumbai University; topic summaries, calculators, and clean responsive UI.',
      stack: ['React JS', 'Node JS', 'Vite', 'Firestore', 'Express'],
      links: { live: 'https://aryapandaram18-afk.github.io/Discmath_w/', repo: '#' },
      thumbnail: 'https://s.wordpress.com/mshots/v1/https%3A%2F%2Faryapandaram18-afk.github.io%2FDiscmath_w%2F?w=800',
      info: [
        'Topic cards for Sets, Relations, Functions, Graphs',
        'Concise notes with key formulas and examples',
        'Practice utilities: permutations/combinations & truth tables',
        'Quick navigation; mobile-friendly layout',
        'Engineering mini-project at Mumbai University'
      ]
    }
  ],
  game: [
    {
      title: 'Apocalypse',
      year: '2025',
      description:
        'Roblox Studio project featuring AI robots, ray tracing weapon systems, handcrafted level design, and an in-game admin system.',
      stack: ['Roblox Studio', 'Lua', 'C++', 'DSA', '2D', '3D', 'VFX'],
      links: { live: 'https://www.roblox.com/games/115803825073544/Apocalypse-RELEASED', repo: '#' },
      thumbnail: apocalypseThumb,
      info: [
        'Created in Roblox Studio using Lua; C++/DSA foundations',
        'AI robots with pathfinding, state machines, and difficulty scaling',
        'Ray tracing weapons with precise hit detection and tuned recoil',
        'Handcrafted level design with wave progression, checkpoints, and hazards',
        'Admin system with role controls, moderation tools, and stat tracking'
      ]
    },
    {
      title: 'Voxel Forge',
      year: '2022',
      description:
        'Sandbox builder with procedural generation, chunk streaming, and GPU-accelerated instancing.',
      stack: ['Three.js', 'WebGL', 'TypeScript'],
      links: { live: '#', repo: '#' }
    }
  ]
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, staggerChildren: 0.15 }
  }
};

const sectionFade = {
  hidden: { y: 26, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
};

const cardVariants = {
  hidden: { y: 32, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } }
};

const pageVariants = {
  enter: (direction) => ({ opacity: 0, x: direction > 0 ? 36 : -36 }),
  center: { opacity: 1, x: 0 },
  exit: (direction) => ({ opacity: 0, x: direction > 0 ? -36 : 36 })
};

const ProjectCard = ({ project }) => {
  return (
    <motion.article
      className="project-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.5 }}
    >
      {project.thumbnail && (
        <div className="project-thumb" aria-hidden="false">
          <img src={project.thumbnail} alt={`${project.title} frontend screenshot`} loading="lazy" />
        </div>
      )}
      <div className="project-card-overlay" aria-hidden="true">
        <div className="project-corner tl"></div>
        <div className="project-corner tr"></div>
        <div className="project-corner bl"></div>
        <div className="project-corner br"></div>
      </div>
      <header className="project-header">
        <div className="project-title">
          <h3>{project.title}</h3>
          <span className="project-year">{project.year}</span>
        </div>
      </header>
      <div className="project-body">
        <p className="project-desc">{project.description}</p>
        {project.info && (
          <ul className="project-info">
            {project.info.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <div className="project-tags">
          {project.stack.map((t) => (
            <span className="project-tag" key={t}>{t}</span>
          ))}
        </div>
      </div>
      <footer className="project-footer">
        <a className="project-link" href={project.links.live} target="_blank" rel="noreferrer">Live</a>
        <a className="project-link" href={project.links.repo} target="_blank" rel="noreferrer">Repo</a>
      </footer>
    </motion.article>
  );
};

const SegmentedTabs = ({ active, setActive }) => {
  return (
    <div className="segmented">
      {['web', 'game'].map((tab) => (
        <button
          key={tab}
          className={`segmented-btn ${active === tab ? 'active' : ''}`}
          onClick={() => setActive(tab)}
          aria-pressed={active === tab}
        >
          <span className="segmented-label">{tab === 'web' ? 'Fullstack Web' : 'Game Dev'}</span>
          {active === tab && (
            <motion.span className="segmented-indicator" layoutId="segmented-indicator" />
          )}
        </button>
      ))}
    </div>
  );
};

const Projects = () => {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const sectionInView = useInView(sectionRef, { threshold: 0.2 });
  const [active, setActive] = useState('web');
  const [page, setPage] = useState(1);
  const [pageDirection, setPageDirection] = useState(0);
  const itemsPerPage = 2;

  useEffect(() => {
    setPage(1);
    setPageDirection(0);
  }, [active]);

  const allItems = projectsData[active];
  const totalPages = Math.max(1, Math.ceil(allItems.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const items = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return allItems.slice(start, start + itemsPerPage);
  }, [allItems, safePage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
      setPageDirection(0);
    }
  }, [totalPages, page]);

  const setPageWithDirection = (next) => {
    if (next === page) return;
    setPageDirection(next > page ? 1 : -1);
    setPage(next);
  };

  return (
    <motion.section
      className={`projects ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={sectionInView ? 'visible' : 'hidden'}
    >
      <div className="projects-container">
        <motion.div className="projects-header" variants={sectionFade}>
          <h2 className="projects-title">Projects</h2>
          <p className="projects-sub">Explore my work across web and games.</p>
        </motion.div>

        <SegmentedTabs active={active} setActive={setActive} />

        <motion.div
          key={`grid-${active}-${safePage}`}
          className="projects-grid"
          variants={pageVariants}
          initial="enter"
          animate="center"
          custom={pageDirection}
        >
          {items.map((p) => (
            <ProjectCard key={`${active}-${safePage}-${p.title}`} project={p} />
          ))}
        </motion.div>

        {totalPages > 1 && (
          <div className="pagination" role="navigation" aria-label="Projects pagination">
            <button
              className="pagination-btn"
              onClick={() => setPageWithDirection(Math.max(1, safePage - 1))}
              aria-label="Previous page"
              disabled={safePage === 1}
            >
              ‹
            </button>
            <div className="pagination-numbers" role="tablist" aria-label="Switch page">
              {[...Array(totalPages)].map((_, i) => {
                const n = i + 1;
                const isActive = n === safePage;
                return (
                  <button
                    key={`page-${n}`}
                    role="tab"
                    aria-selected={isActive}
                    className={`pagination-number ${isActive ? 'active' : ''}`}
                    onClick={() => setPageWithDirection(n)}
                  >
                    {n}
                    {isActive && (
                      <motion.span className="pagination-indicator" layoutId="pagination-indicator" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              className="pagination-btn"
              onClick={() => setPageWithDirection(Math.min(totalPages, safePage + 1))}
              aria-label="Next page"
              disabled={safePage === totalPages}
            >
              ›
            </button>
          </div>
        )}
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

export default Projects;