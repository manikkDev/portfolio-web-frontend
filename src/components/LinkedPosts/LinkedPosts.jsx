import React, { useMemo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import './LinkedPosts.css'
import techopediaThumb from '../../assets/techopedia-14.jpg'
import fullstackLinkedThumb from '../../assets/fullstack-linkedIn.png'
import apocalypseThumb from '../../assets/apocalypse-thumbnail.jpg'

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

const postsData = [
  {
    tag: 'Achievement',
    date: '1 mo ago',
    readTime: '4 min read',
    title: "Won Squabble Debate & Techopedia 14' Title",
    excerpt:
      "I recently won the Squabble Debate organized by IEEE SIESGST and also bagged the Techopedia 14' Title as well! 🏆",
    thumbnail: techopediaThumb,
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_i-recently-won-the-squabble-debate-organized-activity-7380615623342583808-INJ6?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFhKwQEBjZXAmzipJcEjuU02SdOFm76BuOs'
  },
  {
    tag: 'College Life',
    date: '2 mo ago',
    readTime: '5 min read',
    title: 'HealthWell — First Fullstack Web Project',
    excerpt:
      'Built my first fullstack app: React + Vite frontend, Node.js/Express API, MongoDB/Mongoose, JWT auth — privacy‑first with AI medical file insights.',
    thumbnail: fullstackLinkedThumb,
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_react-vite-nodejs-activity-7367912785613152257-MDgc?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFhKwQEBjZXAmzipJcEjuU02SdOFm76BuOs'
  },
  {
    tag: 'Game Dev',
    date: '3 mo ago',
    readTime: '3 min read',
    title: 'Advanced Roblox Game — 3D, DB, Multiplayer',
    excerpt:
      'Published my most advanced Roblox game: 3D gameplay, database integration, and real‑time online multiplayer — a major milestone in my dev journey.',
    thumbnail: apocalypseThumb,
    link:
      'https://www.linkedin.com/posts/manikaraj-anburaj-4550ba354_gamedev-roblox-3dgame-activity-7354530336162168833-RpEG?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFhKwQEBjZXAmzipJcEjuU02SdOFm76BuOs'
  }
]

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v6l4 2"/>
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
        <img src={post.thumbnail} alt={post.title} loading="lazy" />
        <span className="post-tag">{post.tag}</span>
      </div>

      <div className="post-meta">
        <span className="meta-item"><CalendarIcon /> {post.date}</span>
        <span className="meta-sep">•</span>
        <span className="meta-item"><ClockIcon /> {post.readTime}</span>
      </div>

      <h3 className="post-title">{post.title}</h3>
      <p className="post-excerpt">{post.excerpt}</p>
      <a className="post-link" href={post.link} target="_blank" rel="noreferrer">Read More →</a>
    </motion.article>
  )
}

const LinkedPosts = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })
  const posts = useMemo(() => postsData, [])

  return (
    <motion.section
      id="linkedin-posts"
      className={`posts ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="posts-container">
        <motion.div className="posts-header" variants={titleVariants}>
          <h2 className="posts-title">Latest Blog Posts</h2>
          <p className="posts-sub">From LinkedIn</p>
        </motion.div>

        <div className="posts-grid">
          {posts.map((p) => (
            <PostCard key={p.title} post={p} />
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