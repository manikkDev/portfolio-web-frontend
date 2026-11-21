import React, { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { api } from '../../api/client'
import { useTheme } from '../../hooks/useTheme'
import './LinkedPosts.css'

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
    thumbnail:
      'https://media.licdn.com/dms/image/v2/D4D22AQGOP2Vc2zdxxA/feedshare-image-high-res/B4DaFKurojIgAk-/0/1792255114450?e=2147483647&v=beta&t=fg_ob1sQhdcQfh39UzIjzPD61oTQ_HT-LF7nTvWBswc',
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
    thumbnail:
      'https://media.licdn.com/dms/image/v2/D4D22AQGFknlPllclMA/feedshare-shrink_800/B4DaDombIBJYAc-/0/1790608782259?e=2147483647&v=beta&t=9OP9Q6lST-_T9V3Rbit7eEFvNhYpbLLKgOwVjemE4OA',
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
    thumbnail:
      'https://media.licdn.com/dms/image/v2/D4D22AQEYLwkKH_y5bQ/feedshare-shrink_800/B4DZ1JOhldIgAc-/0/1775050038057?e=2147483647&v=beta&t=JwIDFlwNH-3E0N3fnneEs2y7gsapJj32T17FRuiqilE',
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_codecraftors-hackathonjourney-ai-ugcPost-7445099501784104961-jpjv'
  }
]

// A missing or malformed date must not take the whole section down.
const monthYear = (date) => {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(d)
}

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)

const OrganizerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6M9 11h.01M15 11h.01"/>
  </svg>
)

const TrophyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>
  </svg>
)

const PostCard = ({ post }) => {
  return (
    <motion.article
      className="post-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.5 }}
    >
      <div className="post-thumb">
        <img src={post.thumbnail} alt={`${post.title} team photo`} loading="lazy" referrerPolicy="no-referrer" />
        <span className="post-tag"><TrophyIcon /> {post.tag}</span>
      </div>

      <div className="post-meta">
        <span className="meta-item"><CalendarIcon /> {monthYear(post.date)}</span>
        {post.organizer && (
          <>
            <span className="meta-sep">•</span>
            <span className="meta-item"><OrganizerIcon /> {post.organizer}</span>
          </>
        )}
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-excerpt">{post.excerpt}</p>
      {post.facts?.length > 0 && (
        <ul className="post-facts">
          {post.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      )}
      <a className="post-link" href={post.link} target="_blank" rel="noreferrer">View Post →</a>
    </motion.article>
  )
}

const LinkedPosts = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })

  const [posts, setPosts] = useState(postsData)
  useEffect(() => {
    let alive = true
    api.getLinkedInPosts()
      .then(({ data }) => {
        if (!alive || !data?.length) return
        setPosts(data.slice(0, 3).map((p) => ({
          tag: p.tag,
          date: p.published_at,
          organizer: p.organizer,
          title: p.title,
          excerpt: p.excerpt,
          facts: p.facts,
          thumbnail: p.thumbnail_url,
          link: p.link
        })))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  return (
    <motion.section
      className={`posts ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="posts-container">
        <motion.div className="posts-header" variants={titleVariants}>
          <h2 className="posts-title">Hackathon Wins</h2>
          <p className="posts-sub">First-place finishes and what we built</p>
        </motion.div>

        <div className="posts-grid">
          {posts.map((p) => (
            <PostCard key={p.link} post={p} />
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

export default LinkedPosts
