import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import { api } from '../../api/client'
import './Rating.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.12 } }
}

const titleVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
}

const cardVariants = {
  hidden: { y: 32, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.55, ease: 'easeOut' } }
}

const StarIcon = ({ filled, hovered, onClick, onMouseEnter, onMouseLeave }) => (
  <button
    type="button"
    className={`star-btn ${filled ? 'filled' : ''} ${hovered ? 'hovered' : ''}`}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    aria-label={`Rate ${filled ? 'filled' : 'empty'}`}
  >
    <svg width="28" height="28" viewBox="0 0 24 24" fill={filled || hovered ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  </button>
)

const Rating = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })

  const [ratings, setRatings] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [ratingsRes, statsRes] = await Promise.all([
        api.getRatings(1, 6),
        api.getRatingStats()
      ])
      setRatings(ratingsRes.data.ratings || [])
      setStats(statsRes.data || { average: 0, total: 0, distribution: {} })
    } catch {
      // Silent fail — ratings are non-critical
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedRating === 0) {
      setStatus({ type: 'error', message: 'Please select a rating' })
      return
    }
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      await api.submitRating({
        name: name.trim() || 'Anonymous',
        rating: selectedRating,
        comment: comment.trim() || null
      })
      setStatus({ type: 'success', message: 'Thank you for your rating! 🎉' })
      setSelectedRating(0)
      setName('')
      setComment('')
      loadData() // Refresh
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to submit rating' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <motion.section
      id="rating"
      className={`rating-section ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="rating-container">
        <motion.div className="rating-header" variants={titleVariants}>
          <h2 className="rating-title">Rate This Website</h2>
          <p className="rating-sub">Your feedback helps me improve!</p>
        </motion.div>

        <div className="rating-grid">
          {/* Submit Form */}
          <motion.article className="rating-card rating-form-card" variants={cardVariants}>
            <div className="rating-stats-bar">
              <span className="stats-avg">{stats.average || '—'}</span>
              <div className="stats-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s <= Math.round(stats.average) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="stats-star">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="stats-count">({stats.total} ratings)</span>
            </div>

            <form className="rating-form" onSubmit={handleSubmit}>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= selectedRating}
                    hovered={star <= hoveredRating}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  />
                ))}
              </div>

              <input
                className="rating-input"
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
              <textarea
                className="rating-textarea"
                rows="3"
                placeholder="Leave a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
              />

              <AnimatePresence>
                {status.message && (
                  <motion.div
                    className={`rating-status ${status.type}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="rating-btn" type="submit" disabled={isSubmitting || selectedRating === 0}>
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </form>
          </motion.article>

          {/* Recent Reviews */}
          <motion.article className="rating-card rating-reviews-card" variants={cardVariants}>
            <h3 className="card-title">Recent Reviews</h3>
            <div className="reviews-list">
              {ratings.length === 0 ? (
                <p className="no-reviews">No reviews yet. Be the first!</p>
              ) : (
                ratings.map((r) => (
                  <div key={r.id} className="review-item">
                    <div className="review-top">
                      <span className="review-name">{r.name}</span>
                      <span className="review-time">{timeAgo(r.created_at)}</span>
                    </div>
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s <= r.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={`mini-star ${s <= r.rating ? 'filled' : ''}`}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </motion.article>
        </div>
      </div>

      <div className="section-bg" aria-hidden="true">
        <div className="circuit-pattern"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  )
}

export default Rating
