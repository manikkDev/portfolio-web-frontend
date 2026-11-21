import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useTheme } from '../../hooks/useTheme'
import { lineIn } from '../../utils/reveal'
import { timeAgo } from '../../utils/timeAgo'
import './Rating.css'

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const STAR = 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z'
const EMPTY_STATS = { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
const LIMIT = { name: 50, comment: 500 }

function Stars({ value, size = 16 }) {
  return (
    <span className="rt-stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={s <= Math.round(value) ? 'is-on' : ''}>
          <path d={STAR} />
        </svg>
      ))}
    </span>
  )
}

// A steady colour per name, so a reviewer's initial always looks the same.
const hue = (name) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

/**
 * The five stars you rate with. Behaves as one radio group: arrows move between stars,
 * and a pick sends out a few sparks from the chosen star.
 */
function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0)
  const [burst, setBurst] = useState(0)
  const shown = hover || value

  const pick = (n) => {
    onChange(n)
    setBurst((b) => b + 1)
  }
  const keys = (e) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = Math.min(5, Math.max(1, (value || 0) + step))
    pick(next)
    e.currentTarget.parentElement.children[next - 1]?.focus()
  }

  return (
    <div className="rt-picker">
      <div className="rt-picker__stars" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}, ${WORDS[n]}`}
            tabIndex={value ? (value === n ? 0 : -1) : n === 1 ? 0 : -1}
            className={`rt-star${n <= shown ? ' is-on' : ''}`}
            onClick={() => pick(n)}
            onMouseEnter={() => setHover(n)}
            onKeyDown={keys}
            disabled={disabled}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={STAR} />
            </svg>
            {value === n && burst > 0 && (
              <span className="rt-sparks" key={burst} aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} style={{ '--a': `${i * 45}deg` }} />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="rt-picker__word" aria-hidden="true">
        {shown ? `${shown} / 5 · ${WORDS[shown]}` : 'Pick 1 to 5 stars'}
      </p>
    </div>
  )
}

const Rating = () => {
  const { theme } = useTheme()
  const [ratings, setRatings] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loaded, setLoaded] = useState('loading') // loading | ready | offline
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [sending, setSending] = useState(false)
  const formRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const [list, summary] = await Promise.all([api.getRatings(1, 6), api.getRatingStats()])
      setRatings(list.data.ratings || [])
      setStats(summary.data || EMPTY_STATS)
      setLoaded('ready')
    } catch {
      setLoaded('offline')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setStatus({ type: 'error', message: 'Pick a star rating first.' })
      formRef.current?.querySelector('[role="radio"]')?.focus()
      return
    }
    setSending(true)
    setStatus({ type: '', message: '' })
    try {
      await api.submitRating({ name: name.trim() || 'Anonymous', rating, comment: comment.trim() || null })
      setStatus({ type: 'success', message: 'Thanks for rating! Your review is up.' })
      setRating(0)
      setName('')
      setComment('')
      load()
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.offline ? `${err.message} Your rating was not saved — please try again in a minute.` : err.details?.join('. ') || err.message
      })
    } finally {
      setSending(false)
    }
  }

  const max = Math.max(1, ...Object.values(stats.distribution || {}))

  return (
    <section id="rating" className={`rating-section ${theme}`}>
      <div className="rt-wrap">
        <motion.header className="rt-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
          <motion.h2 className="rt-title" variants={lineIn} data-text="Rate This Website">
            Rate This Website
          </motion.h2>
          <motion.p className="rt-sub" variants={lineIn}>
            <span aria-hidden="true">&gt;</span> Your feedback helps me improve!
          </motion.p>
        </motion.header>

        <div className="rt-grid">
          <motion.div
            className="rt-panel"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rt-panel__inner">
              {/* the score so far */}
              <div className="rt-score">
                <div className="rt-score__big">
                  <b>{stats.total ? stats.average.toFixed(1) : '—'}</b>
                  <Stars value={stats.average} size={18} />
                  <span>
                    {stats.total} rating{stats.total === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="rt-bars" aria-label="Ratings by stars">
                  {[5, 4, 3, 2, 1].map((s) => (
                    <li key={s}>
                      <span>{s}</span>
                      <i>
                        <motion.b
                          initial={{ width: 0 }}
                          whileInView={{ width: `${((stats.distribution?.[s] || 0) / max) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: (5 - s) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </i>
                      <em>{stats.distribution?.[s] || 0}</em>
                    </li>
                  ))}
                </ul>
              </div>

              <form className="rt-form" onSubmit={submit} ref={formRef} noValidate>
                <StarPicker
                  value={rating}
                  onChange={(n) => {
                    setRating(n)
                    setStatus((st) => (st.type === 'error' ? { type: '', message: '' } : st))
                  }}
                  disabled={sending}
                />
                <div className="rt-field">
                  <label htmlFor="rt-name">
                    Name <em>optional</em>
                  </label>
                  <input id="rt-name" type="text" autoComplete="nickname" value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMIT.name} disabled={sending} placeholder="Anonymous" />
                </div>
                <div className="rt-field">
                  <label htmlFor="rt-comment">
                    Comment <em>optional</em>
                    <b>{comment.length} / {LIMIT.comment}</b>
                  </label>
                  <textarea id="rt-comment" rows="3" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={LIMIT.comment} disabled={sending} />
                </div>

                <AnimatePresence>
                  {status.message && (
                    <motion.p
                      className={`rt-status rt-status--${status.type}`}
                      role={status.type === 'error' ? 'alert' : 'status'}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      {status.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button className={`rt-btn${sending ? ' is-sending' : ''}`} type="submit" disabled={sending}>
                  {sending ? 'Submitting…' : 'Submit rating'}
                </button>
              </form>
            </div>
          </motion.div>

          <motion.aside
            className="rt-reviews"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Recent reviews"
          >
            <h3>Recent Reviews</h3>
            {loaded === 'ready' && ratings.length > 0 ? (
              <ul>
                {ratings.map((r, i) => (
                  <motion.li
                    key={r.id}
                    className="rt-review"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="rt-review__avatar" style={{ '--hue': hue(r.name || 'A') }} aria-hidden="true">
                      {(r.name || 'A').trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="rt-review__top">
                        <b>{r.name}</b>
                        <span>{timeAgo(r.created_at)}</span>
                      </p>
                      <Stars value={r.rating} size={14} />
                      {r.comment && <p className="rt-review__text">{r.comment}</p>}
                    </div>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="rt-empty">
                <Stars value={0} size={22} />
                <p>
                  {loaded === 'offline'
                    ? 'Reviews could not be loaded right now.'
                    : loaded === 'loading'
                      ? 'Loading reviews…'
                      : 'No reviews yet. Be the first!'}
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      </div>
    </section>
  )
}

export default Rating
