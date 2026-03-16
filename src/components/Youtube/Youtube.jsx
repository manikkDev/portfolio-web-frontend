import { motion, useInView } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import fearlessVideo from '../../assets/fearless.mp4'
import swertzLogo from '../../assets/swertz-logo.jpg'
import { useTheme } from '../../hooks/useTheme'
import './Youtube.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.15 } }
}

const titleVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
}

const cardVariants = {
  hidden: { y: 32, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } }
}

const videosData = [
  {
    tag: 'Blox Fruits',
    title: 'Tiger vs Yeti in Blox Fruits [Edit/AMV] 4K',
    thumbnail: 'https://img.youtube.com/vi/3Jkq24CtaBQ/hqdefault.jpg',
    link: 'https://youtu.be/3Jkq24CtaBQ?si=6OLdld0pCKRDiCbe'
  },
  {
    tag: 'Blue Lock',
    title: 'Sae Itoshi vs Rin Itoshi — One Call (Blue Lock Rivals)',
    thumbnail: 'https://img.youtube.com/vi/vXrGrYDuG9Y/hqdefault.jpg',
    link: 'https://youtu.be/vXrGrYDuG9Y?si=xnNvYbtZfqJilcUt'
  },
  {
    tag: 'Blox Fruits',
    title: 'The Fastest Dragonstorm Combo in Blox Fruits',
    thumbnail: 'https://img.youtube.com/vi/hXFirA5le4E/hqdefault.jpg',
    link: 'https://youtu.be/hXFirA5le4E?si=-sXTeR6a30a4shni'
  }
]

const VideoCard = ({ video }) => {
  const cardRef = useRef(null)
  const onMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    cardRef.current.style.setProperty('--px', `${px * 100}%`)
    cardRef.current.style.setProperty('--py', `${py * 100}%`)
  }
  const onLeave = () => {
    cardRef.current.style.setProperty('--px', `50%`)
    cardRef.current.style.setProperty('--py', `50%`)
  }

  return (
    <motion.article
      ref={cardRef}
      className="video-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.5 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="video-thumb">
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <span className="video-tag">{video.tag}</span>
      </div>
      <h3 className="video-title">{video.title}</h3>
      <a className="video-link" href={video.link} target="_blank" rel="noreferrer">Watch →</a>
      <div className="video-glare" aria-hidden="true"></div>
    </motion.article>
  )
}

const Youtube = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })
  const videos = useMemo(() => videosData, [])
  const [soundOn, setSoundOn] = useState(false)
  const shouldPlayVideo = useMemo(() => {
    if (typeof window !== 'undefined') {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      return inView && !reduced
    }
    return false
  }, [inView])
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    let url
    fetch(fearlessVideo)
      .then((r) => r.blob())
      .then((blob) => {
        url = URL.createObjectURL(blob)
        v.src = url
        v.load()
      })
      .catch(() => null)
    return () => {
      if (!v) return
      try {
        v.pause()
        v.removeAttribute('src')
        v.load()
      } catch (e) { void e }
      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !soundOn
    if (shouldPlayVideo) {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => { })
    } else {
      v.pause()
    }
  }, [soundOn, shouldPlayVideo])

  const toggleSound = () => {
    setSoundOn(!soundOn)
  }

  return (
    <motion.section
      className={`youtube ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="youtube-container">
        <motion.div className="youtube-header" variants={titleVariants}>
          <h2 className="youtube-title">YouTube Channel</h2>
          <p className="youtube-sub">Swertz — Roblox Gaming & Advanced Editing</p>
        </motion.div>

        <div className="youtube-top">
          <div className="yt-bg" aria-hidden="true">
            <video
              className="yt-video"
              muted={!soundOn}
              playsInline
              loop
              preload="none"
              poster={swertzLogo}
              ref={videoRef}
            ></video>
            <div className="yt-bg-overlay"></div>
          </div>
          <motion.div className="yt-left" variants={cardVariants}>
            <div className="yt-logo-wrap">
              <img className="yt-logo" src={swertzLogo} alt="Swertz logo" />
            </div>
          </motion.div>
          <motion.div className="yt-right" variants={cardVariants}>
            <h3 className="yt-heading">Swertz — Pro Gaming & Editing</h3>
            <p className="yt-about">
              Roblox‑focused channel with 95k+ subscribers. Specialized in advanced edits and complex transitions, backed by 5+ years of hands‑on video editing experience.
            </p>
            <div className="yt-stats">
              <div className="yt-pill">95k+ subscribers</div>
              <div className="yt-pill">Roblox gaming</div>
              <div className="yt-pill">5+ years editing</div>
            </div>
            <div className="yt-actions">
              <a className="yt-channel-link" href="https://www.youtube.com/@swertzyt" target="_blank" rel="noreferrer">Visit Channel →</a>
            </div>
          </motion.div>
          <button className="yt-sound-fab" type="button" onClick={toggleSound} aria-pressed={soundOn} aria-label="Toggle background video sound">{soundOn ? 'Sound: On' : 'Sound: Off'}</button>
        </div>

        <div className="videos-grid">
          {videos.map((v) => (
            <VideoCard key={v.title} video={v} />
          ))}
        </div>
      </div>

      <div className="section-bg" aria-hidden="true">
        <div className="circuit-pattern"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  )
}

export default Youtube