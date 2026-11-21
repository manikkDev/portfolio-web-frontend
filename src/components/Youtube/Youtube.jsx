import { AnimatePresence, animate, motion, useInView, useScroll, useSpring, useTransform } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import reel from '../../assets/youtube/channel-reel.mp4'
import reelPoster from '../../assets/youtube/channel-reel-poster.webp'
import swertzLogo from '../../assets/swertz-logo.jpg'
import { api } from '../../api/client'
import { useTheme } from '../../hooks/useTheme'
import { lineIn } from '../../utils/reveal'
import { timeAgo } from '../../utils/timeAgo'
import './Youtube.css'

const CHANNEL = 'https://www.youtube.com/@swertzyt'

// Hand-picked videos, shown until (or unless) the API answers with the latest uploads.
const PICKS = [
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

const videoId = (link) => link.match(/(?:youtu\.be\/|[?&]v=|shorts\/)([\w-]{11})/)?.[1] ?? null
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

const PATHS = {
  play: 'M8 5.5v13l10.5-6.5z',
  youtube:
    'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.4-1.9.5-3.8.5-5.8s-.1-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  soundOn: 'M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  soundOff: 'M11 5 6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6',
  close: 'M18 6 6 18M6 6l12 12',
  external: 'M7 17 17 7M9 7h8v8'
}
const Icon = ({ name, filled }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    {...(filled
      ? { fill: 'currentColor' }
      : { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })}
  >
    <path d={PATHS[name]} />
  </svg>
)

/** A number that counts up from zero the first time it is shown. */
function CountUp({ value }) {
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, amount: 0.8 })
  useEffect(() => {
    if (!seen || !ref.current) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current.textContent = compact.format(value)
      return undefined
    }
    const run = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => ref.current && (ref.current.textContent = compact.format(v))
    })
    return () => run.stop()
  }, [seen, value])
  return <span ref={ref}>0</span>
}

/** One video. Opens in the player on the page; the link still works on its own (new tab, middle click). */
function VideoCard({ video, onPlay, short, index }) {
  const id = videoId(video.link)
  // A Short's listed thumbnail is a landscape frame; YouTube also keeps it in its own
  // portrait shape, which suits the card. Falls back to the listed one if that is missing.
  const [thumb, setThumb] = useState(short && id ? `https://i.ytimg.com/vi/${id}/oar2.jpg` : video.thumbnail)
  const meta = video.tag ?? [timeAgo(video.published_at), video.views ? `${compact.format(video.views)} views` : null].filter(Boolean).join(' · ')
  const play = (e) => {
    if (!id || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
    e.preventDefault()
    onPlay({ ...video, id, short })
  }
  return (
    <motion.li
      className={`yt-card${short ? ' yt-card--short' : ''}`}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <a className="yt-card__link" href={video.link} target="_blank" rel="noopener noreferrer" onClick={play}>
        <span className="yt-card__frame">
          <span className="yt-card__inner">
            <span className="yt-card__thumb">
              <img src={thumb} alt="" loading="lazy" decoding="async" onError={() => thumb !== video.thumbnail && setThumb(video.thumbnail)} />
              <span className="yt-card__play" aria-hidden="true"><Icon name="play" filled /></span>
            </span>
            <span className="yt-card__body">
              <span className="yt-card__meta">{meta}</span>
              <span className="yt-card__title">{video.title}</span>
            </span>
          </span>
        </span>
      </a>
    </motion.li>
  )
}

/** The video playing over the page, in YouTube's privacy-enhanced player. */
function Player({ video, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div className="yt-player" role="dialog" aria-modal="true" aria-label={video.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="yt-player__backdrop" onClick={onClose} aria-hidden="true" />
      <motion.div
        className={`yt-player__box${video.short ? ' yt-player__box--short' : ''}`}
        initial={{ scale: 0.94, y: 24 }}
        animate={{ scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ scale: 0.96, y: 16, transition: { duration: 0.2 } }}
      >
        <div className="yt-player__bar">
          <p>{video.title}</p>
          <a href={video.link} target="_blank" rel="noopener noreferrer">
            YouTube <Icon name="external" />
          </a>
          <button type="button" onClick={onClose} ref={closeRef} aria-label="Close player">
            <Icon name="close" />
          </button>
        </div>
        <div className="yt-player__screen">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

const Youtube = () => {
  const { theme } = useTheme()
  const stageRef = useRef(null)
  const videoRef = useRef(null)
  const [feed, setFeed] = useState({ videos: PICKS, shorts: [], channel: null })
  const [soundOn, setSoundOn] = useState(false)
  const [playing, setPlaying] = useState(null)
  const closePlayer = useCallback(() => setPlaying(null), [])
  const near = useInView(stageRef, { margin: '300px 0px' })
  const onScreen = useInView(stageRef, { amount: 0.3 })

  // Starts with the hand-picked videos so the section is never empty, then swaps in the
  // channel's latest uploads and totals once the API answers (it refreshes them hourly).
  useEffect(() => {
    let alive = true
    api
      .getVideos()
      .then(({ data }) => {
        if (alive && data?.videos?.length) {
          setFeed({ videos: data.videos.slice(0, 3), shorts: (data.shorts ?? []).slice(0, 4), channel: data.channel ?? null })
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // The reel streams in only when the section comes near, and plays only while it is on
  // screen. Nobody who asked for less motion or less data gets it playing on its own.
  const [reelSrc, setReelSrc] = useState(null)
  const calm =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(navigator.connection?.saveData)
  useEffect(() => {
    if (near && !calm) setReelSrc(reel)
  }, [near, calm])
  useEffect(() => {
    const v = videoRef.current
    if (!v || !reelSrc) return
    v.muted = !soundOn
    if (onScreen && !playing) v.play()?.catch(() => {})
    else v.pause()
  }, [onScreen, soundOn, reelSrc, playing])

  // The stage opens up as it scrolls in, and the reel drifts inside it.
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'center center'] })
  const open = useSpring(scrollYProgress, { stiffness: 120, damping: 26 })
  const clip = useTransform(open, (p) => `inset(${(1 - p) * 9}% ${(1 - p) * 7}% round 0px)`)
  const zoom = useTransform(open, [0, 1], [1.18, 1])

  const stats = feed.channel
    ? [
        feed.channel.subscribers != null && { label: 'Subscribers', value: feed.channel.subscribers },
        { label: 'Videos', value: feed.channel.videos },
        { label: 'Views', value: feed.channel.views }
      ].filter(Boolean)
    : null

  return (
    <section className={`youtube ${theme}`}>
      <div className="yt-wrap">
        <motion.header className="yt-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
          <motion.h2 className="yt-title" variants={lineIn} data-text="YouTube Channel">
            YouTube Channel
          </motion.h2>
          <motion.p className="yt-sub" variants={lineIn}>
            <span aria-hidden="true">&gt;</span> Swertz — Roblox Gaming &amp; Advanced Editing
          </motion.p>
        </motion.header>

        <motion.div className="yt-stage" ref={stageRef} style={{ clipPath: clip }}>
          <motion.div className="yt-stage__reel" style={{ scale: zoom }} aria-hidden="true">
            {calm ? (
              <img src={reelPoster} alt="" />
            ) : (
              <video ref={videoRef} src={reelSrc ?? undefined} poster={reelPoster} muted={!soundOn} playsInline loop preload="none" />
            )}
          </motion.div>
          <span className="yt-stage__shade" aria-hidden="true" />

          <div className="yt-stage__content">
            <div className="yt-logo">
              <img src={swertzLogo} alt="Swertz channel logo" loading="lazy" />
            </div>
            <div className="yt-about">
              <h3>Swertz — Pro Gaming &amp; Editing</h3>
              <p>
                Roblox‑focused channel with 100k+ subscribers. Specialized in advanced edits and complex transitions, backed by 3+ years of hands‑on video editing experience.
              </p>
              {stats ? (
                <dl className="yt-stats">
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd><CountUp value={s.value} /></dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <ul className="yt-chips">
                  <li>100k+ subscribers</li>
                  <li>Roblox gaming</li>
                  <li>3+ years editing</li>
                </ul>
              )}
              <div className="yt-actions">
                <a className="yt-btn yt-btn--primary" href={CHANNEL} target="_blank" rel="noopener noreferrer">
                  <Icon name="youtube" filled />
                  <span>Visit channel</span>
                </a>
                <a className="yt-btn" href={`${CHANNEL}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer">
                  <Icon name="bell" />
                  <span>Subscribe</span>
                </a>
              </div>
            </div>
          </div>

          {!calm && (
            <button type="button" className="yt-sound" onClick={() => setSoundOn((s) => !s)} aria-pressed={soundOn}>
              <Icon name={soundOn ? 'soundOn' : 'soundOff'} />
              <span>{soundOn ? 'Sound on' : 'Sound off'}</span>
            </button>
          )}
        </motion.div>

        <div className="yt-row">
          <h3 className="yt-row__head">
            <span>Latest videos</span>
            <a href={`${CHANNEL}/videos`} target="_blank" rel="noopener noreferrer">
              See all <Icon name="external" />
            </a>
          </h3>
          <ul className="yt-grid">
            {feed.videos.map((v, i) => (
              <VideoCard key={v.link} video={v} index={i} onPlay={setPlaying} />
            ))}
          </ul>
        </div>

        {feed.shorts.length > 0 && (
          <div className="yt-row">
            <h3 className="yt-row__head">
              <span>Latest Shorts</span>
              <a href={`${CHANNEL}/shorts`} target="_blank" rel="noopener noreferrer">
                See all <Icon name="external" />
              </a>
            </h3>
            <ul className="yt-grid yt-grid--shorts">
              {feed.shorts.map((v, i) => (
                <VideoCard key={v.link} video={v} index={i} onPlay={setPlaying} short />
              ))}
            </ul>
          </div>
        )}
      </div>

      <AnimatePresence>{playing && <Player key="player" video={playing} onClose={closePlayer} />}</AnimatePresence>
    </section>
  )
}

export default Youtube
