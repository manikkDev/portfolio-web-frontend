import React, { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import { api } from '../../api/client'
import './Contact.css'

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

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </svg>
)

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72 12.44 12.44 0 0 0 .65 2.54 2 2 0 0 1-.45 2.11L9 10a16 16 0 0 0 5 5l.63-1.2a2 2 0 0 1 2.11-.45 12.44 12.44 0 0 0 2.54.65A2 2 0 0 1 22 16.92"/>
  </svg>
)

const LocationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z"/>
    <circle cx="12" cy="11" r="2"/>
  </svg>
)

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.68c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.02 1.53 1.02.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.02-2.69-.1-.25-.44-1.28.1-2.67 0 0 .83-.27 2.73 1.02a9.4 9.4 0 0 1 4.97 0c1.9-1.29 2.73-1.02 2.73-1.02.54 1.39.2 2.42.1 2.67.63.7 1.02 1.6 1.02 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="6" height="18"/>
    <rect x="11" y="10" width="10" height="11"/>
    <circle cx="6" cy="7" r="2"/>
  </svg>
)

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 12 7.5v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
  </svg>
)

const Contact = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })

  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' }) // 'success' | 'error' | 'loading'
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })

    try {
      const result = await api.submitContact(formData)
      setStatus({ type: 'success', message: result.message || 'Message sent successfully!' })
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      const msg = err.details
        ? err.details.join('. ')
        : err.message || 'Something went wrong. Please try again.'
      setStatus({ type: 'error', message: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.section
      className={`contact ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="contact-container">
        <motion.div className="contact-header" variants={titleVariants}>
          <h2 className="contact-title">Get In Touch</h2>
        </motion.div>

        <div className="contact-grid">
          <motion.article className="contact-card" variants={cardVariants}>
            <h3 className="card-title">Send Message</h3>
            <form className="contact-form" onSubmit={handleSubmit}>
              <input className="contact-input" type="text" name="name" placeholder="Your Name" aria-label="Your Name" value={formData.name} onChange={handleChange} required />
              <input className="contact-input" type="email" name="email" placeholder="Your Email" aria-label="Your Email" value={formData.email} onChange={handleChange} required />
              <input className="contact-input" type="text" name="subject" placeholder="Subject" aria-label="Subject" value={formData.subject} onChange={handleChange} />
              <textarea className="contact-textarea" name="message" rows="6" placeholder="Your Message" aria-label="Your Message" value={formData.message} onChange={handleChange} required></textarea>

              {status.message && (
                <div className={`contact-status ${status.type}`}>
                  {status.type === 'success' ? '✅' : '⚠️'} {status.message}
                </div>
              )}

              <button className="contact-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.article>

          <motion.article className="contact-card" variants={cardVariants}>
            <h3 className="card-title">Contact Info</h3>
            <div className="info-row"><span className="info-icon"><MailIcon /></span><div className="info-text"><div className="info-label">Email</div><a href="mailto:manikraj8433@gmail.com" className="info-value">manikraj8433@gmail.com</a></div></div>
            <div className="info-row"><span className="info-icon"><PhoneIcon /></span><div className="info-text"><div className="info-label">Phone</div><a href="tel:+918433728657" className="info-value">+91 8433728657</a></div></div>
            <div className="info-row"><span className="info-icon"><LocationIcon /></span><div className="info-text"><div className="info-label">Location</div><div className="info-value">Mumbai, Maharashtra, India</div></div></div>

            <div className="follow-block">
              <h3 className="card-title">Follow Me</h3>
              <div className="socials">
                <a className="social" href="https://github.com/manikkDev" target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubIcon /></a>
                <a className="social" href="#" aria-label="Twitter"><TwitterIcon /></a>
                <a className="social" href="https://www.linkedin.com/in/manikaraj-anburaj-4550ba354" target="_blank" rel="noreferrer" aria-label="LinkedIn"><LinkedInIcon /></a>
              </div>
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

export default Contact