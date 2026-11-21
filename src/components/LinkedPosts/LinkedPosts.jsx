import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import codecraftorsPhoto from '../../assets/wins/codecraftors-3.webp'
import enigmaPhoto from '../../assets/wins/enigma-5.webp'
import iplPhoto from '../../assets/wins/innovation-pitch-league.webp'
import { api } from '../../api/client'
import { useTheme } from '../../hooks/useTheme'
import { lineIn } from '../../utils/reveal'
import './LinkedPosts.css'

// Photos for the wins already on the site, kept here rather than loaded from LinkedIn's
// image servers, which some browsers block as a tracker. Keyed by the post's activity id;
// `focus` keeps the people in frame when the photo is cropped.
const PHOTOS = {
  '7517262848750899202': { src: iplPhoto, focus: '50% 30%' },
  '7510357587889111042': { src: enigmaPhoto, focus: '50% 55%' },
  '7445099501784104961': { src: codecraftorsPhoto, focus: '30% 45%' }
}
const activityId = (link) => link?.match(/(\d{19})/)?.[1]

// Shown immediately and whenever the API cannot be reached. The live list comes from
// the backend, where a win is added with `npm run add-post` (see backend/scripts/add-post.js).
const postsData = [
  {
    tag: '1st Place',
    date: '2026-10-17T16:38:47.591Z',
    organizer: 'IET On Campus SIES GST',
    title: 'Innovation Pitch League 2026',
    excerpt:
      'Built Satya, an evidence-led workspace that reconciles purchase orders, invoices, delivery receipts and payments that disagree, and shows the evidence behind every conclusion.',
    facts: ['6-hour hackathon', 'Team KKR', 'FinTech'],
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_hackathon-innovationpitchleague-siesgst-ugcPost-7517262848750899202-9rKq'
  },
  {
    tag: '1st Place',
    date: '2026-09-28T15:19:44.926Z',
    organizer: 'CSI SIES GST',
    title: 'Enigma 5.0 National Level Hackathon',
    excerpt:
      'Built Arth Saathi, a federated-learning platform that lets banks train fraud and risk models together while raw customer data never leaves each institution.',
    facts: ['National level', 'Team CyberPookies', 'FinTech track'],
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_hackathon-federatedlearning-fintech-ugcPost-7510357587889111042-80pr'
  },
  {
    tag: '1st Place',
    date: '2026-04-01T13:27:24.783Z',
    organizer: 'Coding Club, SCOE',
    title: 'CodeCraftors 3.0',
    excerpt:
      'Built Flow Guardian, an offline-first tool that reads webcam, keyboard and app activity on-device to detect focus, confusion and fatigue in real time.',
    facts: ['24-hour hackathon', 'Team Om Sai Mitra Mandal', 'AI / ML'],
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_codecraftors-hackathonjourney-ai-ugcPost-7445099501784104961-jpjv'
  }
]

// A missing or malformed date must not take the whole section down.
const monthYear = (date) => {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(d)
}

const PATHS = {
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  calendar: 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM16 2v4M8 2v4M3 10h18',
  host: 'M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6',
  external: 'M7 17 17 7M9 7h8v8'
}
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={PATHS[name]} />
  </svg>
)

/** One win: the photo (drifting with the scroll) beside the story. Rows alternate sides. */
function Win({ post, index }) {
  const ref = useRef(null)
  const photo = PHOTOS[activityId(post.link)]
  const [src, setSrc] = useState(photo?.src ?? post.thumbnail ?? null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], ['-7%', '7%'])

  return (
    <motion.li
      ref={ref}
      className={`win${index % 2 ? ' win--flip' : ''}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div
        className="win-photo"
        variants={{ hidden: { opacity: 0, x: index % 2 ? 40 : -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}
      >
        <span className="win-photo__frame">
          <span className="win-photo__inner">
            {src ? (
              <motion.img
                src={src}
                alt={`${post.title}: the team with the award`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={{ y: drift, objectPosition: photo?.focus ?? '50% 40%' }}
                onError={() => setSrc(null)}
              />
            ) : (
              <span className="win-photo__empty" aria-hidden="true"><Icon name="trophy" /></span>
            )}
          </span>
        </span>
        <span className="win-badge"><Icon name="trophy" />{post.tag}</span>
      </motion.div>

      <div className="win-body">
        <motion.p className="win-unlock" variants={lineIn}>
          <span>Achievement unlocked</span>
          <b>{post.tag}</b>
        </motion.p>
        <motion.h3 variants={lineIn}>{post.title}</motion.h3>
        <motion.p className="win-meta" variants={lineIn}>
          {monthYear(post.date) && <span><Icon name="calendar" />{monthYear(post.date)}</span>}
          {post.organizer && <span><Icon name="host" />{post.organizer}</span>}
        </motion.p>
        <motion.p className="win-excerpt" variants={lineIn}>{post.excerpt}</motion.p>
        {post.facts?.length > 0 && (
          <motion.ul className="win-facts" variants={lineIn}>
            {post.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </motion.ul>
        )}
        <motion.a className="win-link" href={post.link} target="_blank" rel="noopener noreferrer" variants={lineIn}>
          <span>View post on LinkedIn</span>
          <Icon name="external" />
        </motion.a>
      </div>
    </motion.li>
  )
}

const LinkedPosts = () => {
  const { theme } = useTheme()
  const [posts, setPosts] = useState(postsData)

  useEffect(() => {
    let alive = true
    api
      .getLinkedInPosts()
      .then(({ data }) => {
        if (!alive || !data?.length) return
        setPosts(
          data.slice(0, 3).map((p) => ({
            tag: p.tag,
            date: p.published_at,
            organizer: p.organizer,
            title: p.title,
            excerpt: p.excerpt,
            facts: p.facts,
            thumbnail: p.thumbnail_url,
            link: p.link
          }))
        )
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className={`posts ${theme}`}>
      <div className="posts-wrap">
        <motion.header className="posts-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
          <motion.h2 className="posts-title" variants={lineIn} data-text="Hackathon Wins">
            Hackathon Wins
          </motion.h2>
          <motion.p className="posts-sub" variants={lineIn}>
            <span aria-hidden="true">&gt;</span> First-place finishes and what we built
          </motion.p>
        </motion.header>

        <ol className="wins">
          {posts.map((p, i) => (
            <Win key={p.link} post={p} index={i} />
          ))}
        </ol>
      </div>
    </section>
  )
}

export default LinkedPosts
