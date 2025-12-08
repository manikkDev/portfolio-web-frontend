import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if (import.meta.env.DEV) {
  const origError = console.error
  console.error = (...args) => {
    const msg = args && args[0] ? String(args[0]) : ''
    if (msg.includes('net::ERR_ABORTED')) return
    if (msg.includes('blob:http://')) return
    origError(...args)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
