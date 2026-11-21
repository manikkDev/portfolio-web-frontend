import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { useTheme } from '../../hooks/useTheme'
import { lineIn } from '../../utils/reveal'
import './Contact.css'

const EMAIL = 'manikraj8433@gmail.com'
const PHONE = '+91 8433728657'
const EMPTY = { name: '', email: '', subject: '', message: '' }
// The same limits the server checks, so most mistakes are caught before sending.
const LIMIT = { name: 100, subject: 150, message: 2000 }
const MIN_MESSAGE = 5

const PATHS = {
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 2 9 6 9-6',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.4 2.1L9 10.6a16 16 0 0 0 5 5l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2z',
  pin: 'M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  check: 'm5 12 5 5L20 7',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'
}
const Icon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d={PATHS[name]} />
  </svg>
)

const BRANDS = {
  GitHub:
    'M12 0c-6.6 0-12 5.4-12 12 0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z',
  LinkedIn:
    'M20.4 20.5h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zm1.8 13.1H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z',
  YouTube:
    'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.4-1.9.5-3.8.5-5.8s-.1-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z'
}
const FOLLOW = [
  { name: 'GitHub', url: 'https://github.com/manikkDev' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/manikaraj-anburaj-4550ba354' },
  { name: 'YouTube', url: 'https://www.youtube.com/@swertzyt' }
]

/** What is wrong with the form as typed, field by field (empty when it can be sent). */
function check(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = 'Your name is needed'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'A valid email is needed so I can reply'
  if (form.message.trim().length < MIN_MESSAGE) errors.message = `At least ${MIN_MESSAGE} characters`
  return errors
}

const mailto = (form) =>
  `mailto:${EMAIL}?subject=${encodeURIComponent(form.subject || `Hello from ${form.name || 'your portfolio'}`)}&body=${encodeURIComponent(form.message)}`

function Field({ id, label, optional, error, count, children }) {
  return (
    <div className={`ct-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        <span>{label}</span>
        {optional && <em>optional</em>}
        {count}
      </label>
      {children}
      {error && (
        <p className="ct-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

const Contact = () => {
  const { theme } = useTheme()
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState({})
  // idle | sending | sent | failed | offline
  const [state, setState] = useState({ phase: 'idle', message: '' })
  const [slow, setSlow] = useState(false)
  const [copied, setCopied] = useState(false)
  const sentForm = useRef(EMPTY)

  const errors = check(form)
  const shown = (field) => (touched[field] || touched.all) && errors[field]

  // A first message after a quiet spell may have to wake the server: say so after a moment.
  useEffect(() => {
    if (state.phase !== 'sending') return undefined
    const t = setTimeout(() => setSlow(true), 4000)
    return () => {
      clearTimeout(t)
      setSlow(false)
    }
  }, [state.phase])

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }))

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ all: true })
    const firstWrong = ['name', 'email', 'message'].find((f) => errors[f])
    if (firstWrong) {
      document.getElementById(`ct-${firstWrong}`)?.focus()
      return
    }
    setState({ phase: 'sending', message: '' })
    sentForm.current = form
    try {
      const result = await api.submitContact({ ...form, name: form.name.trim(), email: form.email.trim() })
      setState({ phase: 'sent', message: result.message || 'Message sent! I will get back to you soon.' })
      setForm(EMPTY)
      setTouched({})
    } catch (err) {
      if (err.offline) setState({ phase: 'offline', message: err.message })
      else setState({ phase: 'failed', message: err.details?.join('. ') || err.message })
    }
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  const status = { idle: 'Ready', sending: 'Sending', sent: 'Delivered', failed: 'Check the form', offline: 'Not delivered' }[state.phase]
  const sending = state.phase === 'sending'

  return (
    <section className={`contact ${theme}`}>
      <div className="ct-wrap">
        <motion.header className="ct-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.6 }} transition={{ staggerChildren: 0.12 }}>
          <motion.h2 className="ct-title" variants={lineIn} data-text="Get In Touch">
            Get In Touch
          </motion.h2>
          <motion.p className="ct-sub" variants={lineIn}>
            <span aria-hidden="true">&gt;</span> Send a message, or reach me directly.
          </motion.p>
        </motion.header>

        <div className="ct-grid">
          <motion.div
            className="ct-panel"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="ct-panel__inner">
              <div className="ct-panel__bar">
                <h3>Send Message</h3>
                <p className={`ct-state ct-state--${state.phase}`} aria-live="polite">
                  <i aria-hidden="true"></i>
                  {status}
                </p>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {state.phase === 'sent' ? (
                  <motion.div
                    key="sent"
                    className="ct-done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="ct-done__icon" aria-hidden="true">
                      <Icon name="check" />
                      <i></i>
                      <i></i>
                    </span>
                    <p className="ct-done__title">Message sent</p>
                    <p>{state.message}</p>
                    <button type="button" className="ct-btn ct-btn--ghost" onClick={() => setState({ phase: 'idle', message: '' })}>
                      Send another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form key="form" className="ct-form" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="ct-row">
                      <Field id="ct-name" label="Name" error={shown('name')}>
                        <input
                          id="ct-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          maxLength={LIMIT.name}
                          value={form.name}
                          onChange={change}
                          onBlur={blur}
                          aria-invalid={Boolean(shown('name'))}
                          aria-describedby={shown('name') ? 'ct-name-error' : undefined}
                          disabled={sending}
                        />
                      </Field>
                      <Field id="ct-email" label="Email" error={shown('email')}>
                        <input
                          id="ct-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          inputMode="email"
                          maxLength={254}
                          value={form.email}
                          onChange={change}
                          onBlur={blur}
                          aria-invalid={Boolean(shown('email'))}
                          aria-describedby={shown('email') ? 'ct-email-error' : undefined}
                          disabled={sending}
                        />
                      </Field>
                    </div>
                    <Field id="ct-subject" label="Subject" optional>
                      <input id="ct-subject" name="subject" type="text" maxLength={LIMIT.subject} value={form.subject} onChange={change} disabled={sending} />
                    </Field>
                    <Field
                      id="ct-message"
                      label="Message"
                      error={shown('message')}
                      count={<b className="ct-count">{form.message.length} / {LIMIT.message}</b>}
                    >
                      <textarea
                        id="ct-message"
                        name="message"
                        rows="6"
                        maxLength={LIMIT.message}
                        value={form.message}
                        onChange={change}
                        onBlur={blur}
                        aria-invalid={Boolean(shown('message'))}
                        aria-describedby={shown('message') ? 'ct-message-error' : undefined}
                        disabled={sending}
                      />
                    </Field>

                    {(state.phase === 'failed' || state.phase === 'offline') && (
                      <div className="ct-alert" role="alert">
                        <Icon name="alert" />
                        <div>
                          <p>{state.phase === 'offline' ? `${state.message} Your message was not sent.` : state.message}</p>
                          {state.phase === 'offline' && (
                            <a href={mailto(sentForm.current)}>Send it by email instead</a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="ct-actions">
                      <button type="submit" className={`ct-btn ct-btn--primary${sending ? ' is-sending' : ''}`} disabled={sending}>
                        <span>{sending ? 'Sending…' : 'Send message'}</span>
                        <Icon name="send" />
                      </button>
                      {sending && slow && <p className="ct-wait">Waking the server — this can take up to a minute.</p>}
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.aside
            className="ct-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.15 }}
          >
            <motion.div className="ct-card" variants={lineIn}>
              <span className="ct-card__icon"><Icon name="mail" /></span>
              <div>
                <p className="ct-card__label">Email</p>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </div>
              <button type="button" className="ct-copy" onClick={copyEmail} aria-label={copied ? 'Email address copied' : 'Copy email address'}>
                <Icon name={copied ? 'check' : 'copy'} />
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </motion.div>
            <motion.div className="ct-card" variants={lineIn}>
              <span className="ct-card__icon"><Icon name="phone" /></span>
              <div>
                <p className="ct-card__label">Phone</p>
                <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a>
              </div>
            </motion.div>
            <motion.div className="ct-card" variants={lineIn}>
              <span className="ct-card__icon"><Icon name="pin" /></span>
              <div>
                <p className="ct-card__label">Location</p>
                <p className="ct-card__value">Mumbai, Maharashtra, India</p>
              </div>
            </motion.div>

            <motion.div className="ct-follow" variants={lineIn}>
              <h3>Follow Me</h3>
              <ul>
                {FOLLOW.map((f) => (
                  <li key={f.name}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                        <path d={BRANDS[f.name]} />
                      </svg>
                      <span>{f.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}

export default Contact
