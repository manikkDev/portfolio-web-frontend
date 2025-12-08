import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import './Rating.css'

const STORAGE_KEY = 'portfolio_ratings_v1'

const Star = ({ filled, onClick, onHover, onLeave }) => (
  <motion.button
    type="button"
    className={`star ${filled ? 'filled' : ''}`}
    onClick={onClick}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    whileHover={{ scale: 1.2, rotate: 8 }}
    whileTap={{ scale: 0.9 }}
  >
    <svg viewBox="0 0 24 24" className="star-svg" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  </motion.button>
)

const Rating = () => {
  const { theme } = useTheme()
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [ratings, setRatings] = useState([])
  const [pulse, setPulse] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const data = raw ? JSON.parse(raw) : []
      setRatings(Array.isArray(data) ? data : [])
    } catch { setRatings([]) }
  }, [])

  const save = (items) => {
    setRatings(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { void 0 }
  }

  const avg = useMemo(() => {
    if (!ratings.length) return 0
    const s = ratings.reduce((a, r) => a + (r.stars || 0), 0)
    return Math.round((s / ratings.length) * 10) / 10
  }, [ratings])

  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.15 } }
  }
  const fadeUp = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim() || rating < 1) {
      setError('Please enter your name and a star rating.')
      return
    }
    setError('')
    const item = {
      id: Date.now(),
      name: name.trim(),
      stars: rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    }
    const next = [item, ...ratings].slice(0, 100)
    save(next)
    setPulse((p) => p + 1)
    setName('')
    setComment('')
    setRating(0)
    setHovered(0)
  }

  return (
    <motion.section id="ratings" className={`ratings ${theme}`} variants={sectionVariants} initial="hidden" animate="visible">
      <div className="ratings-container">
        <motion.div className="ratings-header" variants={fadeUp}>
          <h2 className="ratings-title">Rate this website</h2>
          <div className="ratings-summary">
            <div className="summary-card" key={`pulse-${pulse}`}>
              <span className="summary-number">{avg.toFixed(1)}</span>
              <span className="summary-label">Avg • {ratings.length} ratings</span>
            </div>
          </div>
        </motion.div>

        <motion.form className="rating-form" onSubmit={submit} variants={fadeUp}>
          <div className="form-row">
            <input
              type="text"
              className="input name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Your name"
            />
          </div>
          <div className="form-row stars-row">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                filled={(hovered || rating) >= i}
                onClick={() => setRating(i)}
                onHover={() => setHovered(i)}
                onLeave={() => setHovered(0)}
              />
            ))}
            <span className="stars-label">{rating ? `${rating} / 5` : 'Select stars'}</span>
          </div>
          <div className="form-row">
            <textarea
              className="input comment"
              rows={3}
              placeholder="Optional comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              aria-label="Optional comment"
            />
          </div>
          {error && <div className="error-text" role="alert">{error}</div>}
          <div className="form-actions">
            <motion.button type="submit" className="submit-btn" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              Submit rating
            </motion.button>
          </div>
        </motion.form>

        <motion.div className="rating-list" variants={fadeUp}>
          {ratings.map((r) => (
            <motion.article key={r.id} className="rating-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-top">
                <div className="card-stars">
                  {[...Array(r.stars)].map((_, idx) => (
                    <svg key={idx} viewBox="0 0 24 24" className="star-mini" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>
                  ))}
                </div>
                <div className="card-name">{r.name}</div>
                <div className="card-date">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              {r.comment && <div className="card-comment">{r.comment}</div>}
            </motion.article>
          ))}
          {!ratings.length && (
            <div className="empty-state">No ratings yet</div>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}

export default Rating
