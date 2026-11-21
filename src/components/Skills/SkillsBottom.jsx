import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { lineIn } from '../../utils/reveal'
import { useMedia } from '../../utils/useMedia'
import './Skills.css'

/* ═══════════════════════════════════════════════════════
   Brand Icons — accurate SVG paths with brand colours
═══════════════════════════════════════════════════════ */
const BrandIcons = {
  JavaScript: {
    color: '#F7DF1E',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#F7DF1E"/>
        <path d="M9.5 23.5c.5.9 1.3 1.5 2.7 1.5 1.4 0 2.3-.75 2.3-2.2V15.5H12v7.2c0 .6-.25.8-.65.8-.4 0-.6-.2-.9-.65zm6.2-.35c.6 1.05 1.55 1.85 3.3 1.85 1.9 0 3.25-1 3.25-2.75 0-1.55-.88-2.35-2.5-3.05l-.65-.28c-.85-.37-1.15-.65-1.15-1.18 0-.47.37-.8.95-.8.56 0 .92.28 1.23.85l1.65-1.07c-.7-1.22-1.65-1.68-2.88-1.68-1.82 0-2.95 1.15-2.95 2.72 0 1.53.9 2.35 2.45 2.98l.65.27c.88.38 1.25.67 1.25 1.25 0 .57-.5.93-1.28.93-.88 0-1.45-.47-1.85-1.18z" fill="#000"/>
      </svg>
    )
  },
  TypeScript: {
    color: '#3178C6',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#3178C6"/>
        <text x="16" y="22" textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Arial,Helvetica,sans-serif" letterSpacing="-0.5">TS</text>
      </svg>
    )
  },

  React: {
    color: '#61DAFB',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#20232A"/>
        <circle cx="16" cy="16" r="2.4" fill="#61DAFB"/>
        <ellipse cx="16" cy="16" rx="11.5" ry="4.5" stroke="#61DAFB" strokeWidth="1.4" fill="none"/>
        <ellipse cx="16" cy="16" rx="11.5" ry="4.5" stroke="#61DAFB" strokeWidth="1.4" fill="none" transform="rotate(60 16 16)"/>
        <ellipse cx="16" cy="16" rx="11.5" ry="4.5" stroke="#61DAFB" strokeWidth="1.4" fill="none" transform="rotate(120 16 16)"/>
      </svg>
    )
  },
  'Vue.js': {
    color: '#42B883',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#35495E"/>
        <path d="M3.5 6.5h5.3L16 18.5 23.2 6.5h5.3L16 27.5z" fill="#42B883"/>
        <path d="M9 6.5h4.5L16 11l2.5-4.5H23L16 20z" fill="#35495E"/>
        <path d="M10.2 6.5H14L16 9.8l2-3.3h3.8L16 19.2z" fill="#41B883"/>
      </svg>
    )
  },
  'Next.js': {
    color: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#000"/>
        <path d="M7 22V10h2.2l11 10V10H22v12h-2.2L8.8 12V22z" fill="#fff"/>
      </svg>
    )
  },
  'Tailwind CSS': {
    color: '#38BDF8',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#0F172A"/>
        <path d="M16 8c-3.6 0-5.9 1.8-6.8 5.4 1.35-1.8 2.93-2.47 4.72-2.02 1.03.26 1.77 1.01 2.58 1.84C17.82 14.6 19.28 16 22.4 16c3.6 0 5.9-1.8 6.8-5.4-1.35 1.8-2.93 2.47-4.72 2.02-1.03-.26-1.77-1.01-2.58-1.84C20.58 9.4 19.12 8 16 8zM9.6 16c-3.6 0-5.9 1.8-6.8 5.4 1.35-1.8 2.93-2.47 4.72-2.02 1.03.26 1.77 1.01 2.58 1.84C11.42 22.6 12.88 24 16 24c3.6 0 5.9-1.8 6.8-5.4-1.35 1.8-2.93 2.47-4.72 2.02-1.03-.26-1.77-1.01-2.58-1.84C14.18 17.4 12.72 16 9.6 16z" fill="#38BDF8"/>
      </svg>
    )
  },
  Redux: {
    color: '#764ABC',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0030"/>
        <path d="M20.2 7.5a3 3 0 012.6 4.5c2.4 1.2 3.7 3.5 3.2 5.8-.4 1.8-1.8 3.2-3.6 3.8l.5 1.5H21l-.5-1.5H14l-.5 1.5H12l.5-1.5c-1.8-.6-3.2-2-3.6-3.8-.5-2.3.8-4.6 3.2-5.8a3 3 0 115.6-2.4A3 3 0 0120.2 7.5zm-8 10.8h7.6c1.6 0 2.8-1.2 2.8-2.8 0-1.6-1.2-2.8-2.8-2.8H12.2c-1.6 0-2.8 1.2-2.8 2.8 0 1.6 1.2 2.8 2.8 2.8z" fill="#764ABC" opacity="0.8"/>
        <circle cx="20.2" cy="8.8" r="2" fill="#764ABC"/>
        <circle cx="11.8" cy="8.8" r="2" fill="#764ABC"/>
        <circle cx="16" cy="23.5" r="2" fill="#764ABC"/>
      </svg>
    )
  },
  'Shadcn UI': {
    color: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#09090B"/>
        <path d="M5 5h10v10H5zM17 17h10v10H17z" fill="#fff"/>
        <path d="M17 5h10v10H17zM5 17h10v10H5z" fill="#3f3f46"/>
      </svg>
    )
  },
  'Node.js': {
    color: '#68A063',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a2e1a"/>
        <path d="M16 4.5L27.5 10.8v12.4L16 29.5 4.5 23.2V10.8z" fill="#2d4a2d" stroke="#68A063" strokeWidth="1.2"/>
        <text x="16" y="20.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#68A063" fontFamily="monospace">N</text>
      </svg>
    )
  },
  'Express.js': {
    color: '#BDBDBD',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#111"/>
        <path d="M5 10.5h22M5 16h16M5 21.5h11" stroke="#BDBDBD" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    )
  },
  MongoDB: {
    color: '#47A248',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#001a00"/>
        <path d="M16 3.5c0 9.5-3.8 12.3-3.8 17 0 3.5 1.7 6.3 3.8 8 2.1-1.7 3.8-4.5 3.8-8 0-4.7-3.8-7.5-3.8-17z" fill="#47A248"/>
        <path d="M16 24v5" stroke="#B8860B" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    )
  },
  'REST APIs': {
    color: '#FF6B35',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0800"/>
        <rect x="2.5" y="10.5" width="9" height="11" rx="2.5" fill="#FF6B35"/>
        <rect x="20.5" y="10.5" width="9" height="11" rx="2.5" fill="#FF6B35"/>
        <path d="M11.5 16h9M18 12.5l4 3.5-4 3.5" stroke="#FF6B35" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  Prisma: {
    color: '#5A67D8',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#0a0a1a"/>
        <path d="M4.5 27L16 5l6.2 18.5L4.5 27z" fill="#5A67D8"/>
        <path d="M22.2 23.5L16 5l6 2.5z" fill="#3B4DA0"/>
        <path d="M4.5 27l17.7-3.5" stroke="#fff" strokeWidth="0.8" opacity="0.25"/>
      </svg>
    )
  },
  Redis: {
    color: '#DC382D',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0000"/>
        <ellipse cx="16" cy="10" rx="10.5" ry="3.5" fill="#DC382D"/>
        <path d="M5.5 10v5.5c0 1.9 4.7 3.5 10.5 3.5s10.5-1.6 10.5-3.5V10" stroke="#DC382D" strokeWidth="1.3" fill="none"/>
        <path d="M5.5 15.5v5.5c0 1.9 4.7 3.5 10.5 3.5s10.5-1.6 10.5-3.5v-5.5" stroke="#DC382D" strokeWidth="1.3" fill="none"/>
      </svg>
    )
  },
  MySQL: {
    color: '#4479A1',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#000e1a"/>
        <ellipse cx="16" cy="10" rx="9" ry="3" fill="#4479A1"/>
        <path d="M7 10v5.5c0 1.65 4 3 9 3s9-1.35 9-3V10" stroke="#4479A1" strokeWidth="1.3" fill="none"/>
        <path d="M7 15.5v5.5c0 1.65 4 3 9 3s9-1.35 9-3v-5.5" stroke="#4479A1" strokeWidth="1.3" fill="none"/>
      </svg>
    )
  },
  FirestoreDB: {
    color: '#FFCA28',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a1200"/>
        <path d="M16 3.5l-3.2 7 3.2-2.5 3.2 2.5z" fill="#FFCA28"/>
        <path d="M9 18.5c0 4.5 3.2 8 7 9.8 3.8-1.8 7-5.3 7-9.8 0-3.3-2-5.7-4.6-7.5L16 13.3l-2.4-2.3C11 12.8 9 15.2 9 18.5z" fill="#FF8F00"/>
        <path d="M12 18.5c0 2.5 1.8 4.8 4 6.1 2.2-1.3 4-3.6 4-6.1 0-1.8-1.4-3.2-3-4.4L16 15.5l-1-1.4C13.4 15.3 12 16.7 12 18.5z" fill="#FFCA28"/>
      </svg>
    )
  },
  'VS Code': {
    color: '#007ACC',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#001520"/>
        <path d="M23 3.5L11.5 14.5 6.5 10.5l-3 2.5 5 3.5-5 3.5 3 2.5 5-4L23 29l5-3V6.5z" fill="#007ACC"/>
        <path d="M23 29V3.5l5 3v19z" fill="#005c99"/>
      </svg>
    )
  },
  Git: {
    color: '#F05032',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0500"/>
        <path d="M29.5 14.88L17.12 2.5a1.8 1.8 0 00-2.55 0l-2.55 2.55 3.23 3.23c.75-.25 1.62-.06 2.22.54.6.6.8 1.48.54 2.23l3.1 3.1c.75-.26 1.62-.06 2.23.54a2.25 2.25 0 010 3.18 2.25 2.25 0 01-3.18 0c-.63-.63-.82-1.55-.51-2.33l-2.9-2.9V20.5a2.25 2.25 0 11-2.25 0V12.5c-.37-.18-.72-.44-.98-.78L9.37 8.47l-7.07 7.07a1.8 1.8 0 000 2.55L14.68 30.5a1.8 1.8 0 002.55 0l12.27-12.27a1.8 1.8 0 000-2.55-.3-.3z" fill="#F05032"/>
      </svg>
    )
  },
  Vercel: {
    color: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#000"/>
        <polygon points="16,5.5 28.5,26.5 3.5,26.5" fill="#fff"/>
      </svg>
    )
  },
  AWS: {
    color: '#FF9900',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0f00"/>
        <text x="16" y="15" textAnchor="middle" fontSize="7" fontWeight="900" fill="#FF9900" fontFamily="monospace" letterSpacing="0.3">AWS</text>
        <path d="M7.5 21.5c5 3.5 12 3.5 17 0" stroke="#FF9900" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <path d="M23 19.5l3 2-3 2" stroke="#FF9900" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M9 19.5l-3 2 3 2" stroke="#FF9900" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    )
  },
  'Unity Engine': {
    color: '#CCCCCC',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#111"/>
        <path d="M16 3L28.5 10v14L16 31 3.5 24V10z" fill="#1e1e1e" stroke="#ccc" strokeWidth="1"/>
        <path d="M16 9.5L22 13v7L16 23.5 10 20v-7z" fill="#ccc"/>
        <path d="M16 13.5L19 15.3v3.4L16 20.5 13 18.7v-3.4z" fill="#111"/>
      </svg>
    )
  },
  'Unreal Engine': {
    color: '#5B6CF8',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#050520"/>
        <circle cx="16" cy="16" r="12.5" fill="#0E1128" stroke="#5B6CF8" strokeWidth="1"/>
        <path d="M12 11h4.5c3.5 0 5.5 2 5.5 5s-2 5-5.5 5H12V11z" fill="none" stroke="#5B6CF8" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M17 16H12" stroke="#5B6CF8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  'Roblox Studio': {
    color: '#E2231A',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a0000"/>
        <rect x="4" y="4" width="24" height="24" rx="3" fill="#E2231A" transform="rotate(12 16 16)"/>
        <rect x="9" y="9" width="14" height="14" rx="2" fill="#fff" transform="rotate(12 16 16)"/>
        <rect x="12.5" y="12.5" width="7" height="7" rx="1.5" fill="#E2231A" transform="rotate(12 16 16)"/>
      </svg>
    )
  },
  'C#': {
    color: '#9B59B6',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#0d0018"/>
        <path d="M16 3L28.5 10v12L16 29 3.5 22V10z" fill="#1a0030" stroke="#9B59B6" strokeWidth="1.1"/>
        <text x="16" y="19.5" textAnchor="middle" fontSize="10" fontWeight="900" fill="#9B59B6" fontFamily="monospace">C#</text>
      </svg>
    )
  },
  'C++': {
    color: '#00599C',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#001428"/>
        <path d="M16 3L28.5 10v12L16 29 3.5 22V10z" fill="#00132e" stroke="#00599C" strokeWidth="1.1"/>
        <text x="16" y="19.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#00599C" fontFamily="monospace">C++</text>
      </svg>
    )
  },
  Lua: {
    color: '#010180',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#00001e"/>
        <circle cx="15" cy="17.5" r="9.5" fill="#010180"/>
        <circle cx="22.5" cy="10" r="4" fill="#010180"/>
        <circle cx="15" cy="17.5" r="5.5" fill="#2020A0"/>
        <circle cx="12" cy="14" r="2.5" fill="#010180"/>
      </svg>
    )
  },
  'Adobe After Effects': {
    color: '#9999FF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#00005B"/>
        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="900" fill="#9999FF" fontFamily="Georgia,serif" fontStyle="italic">Ae</text>
      </svg>
    )
  },
  'Adobe Premiere Pro': {
    color: '#9999FF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#00005B"/>
        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="900" fill="#9999FF" fontFamily="Georgia,serif" fontStyle="italic">Pr</text>
      </svg>
    )
  },
  'DaVinci Resolve': {
    color: '#E8C84B',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#1a1200"/>
        <circle cx="16" cy="10" r="5" fill="#E8C84B"/>
        <circle cx="9.5" cy="21" r="5" fill="#E8C84B"/>
        <circle cx="22.5" cy="21" r="5" fill="#E8C84B"/>
        <circle cx="16" cy="10" r="2.5" fill="#1a1200"/>
        <circle cx="9.5" cy="21" r="2.5" fill="#1a1200"/>
        <circle cx="22.5" cy="21" r="2.5" fill="#1a1200"/>
      </svg>
    )
  },
  'Topaz AI': {
    color: '#00D4FF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="#001a20"/>
        <polygon points="16,4 26,12.5 22,27 10,27 6,12.5" fill="none" stroke="#00D4FF" strokeWidth="1.7"/>
        <text x="16" y="20.5" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#00D4FF" fontFamily="monospace">AI</text>
      </svg>
    )
  },
  Descript: {
    color: '#5B4FFF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="#0a0820"/>
        <path d="M8 7.5h9a8 8 0 010 16H8V7.5z" fill="#5B4FFF"/>
        <circle cx="17" cy="15.5" r="3.5" fill="#0a0820"/>
      </svg>
    )
  },
  'Alight Motion': {
    color: '#FF3CAC',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="#1a0010"/>
        <circle cx="16" cy="16" r="12" stroke="#FF3CAC" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="8" stroke="#FF3CAC" strokeWidth="1" fill="none" opacity="0.6"/>
        <circle cx="16" cy="16" r="4.5" stroke="#FF3CAC" strokeWidth="1" fill="none" opacity="0.35"/>
        <circle cx="16" cy="16" r="2" fill="#FF3CAC"/>
      </svg>
    )
  },
  CapCut: {
    color: '#FFFFFF',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="#111"/>
        <path d="M10.5 9.5l14 6.5-14 6.5V9.5z" fill="#fff"/>
      </svg>
    )
  },
  Blur: {
    color: '#667EEA',
    svg: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="#0a0a1a"/>
        <circle cx="16" cy="16" r="11" stroke="#667EEA" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="16" r="7.5" stroke="#667EEA" strokeWidth="1" fill="rgba(102,126,234,0.15)"/>
        <circle cx="16" cy="16" r="4" fill="rgba(102,126,234,0.28)"/>
        <circle cx="16" cy="16" r="1.5" fill="#667EEA"/>
      </svg>
    )
  }
}

/* ═══════════════════════════════════════════════════════
   Categories & skills data
═══════════════════════════════════════════════════════ */
const categories = [
  {
    id: 'frontend', title: 'Frontend', subtitle: 'UI & Framework',
    accent: '#00f5ff', glow: 'rgba(0,245,255,0.35)',
    items: [
      { name: 'JavaScript', level: 95, desc: 'The language of the web. ES2023+, async/await, closures, event loop, and modern design patterns at production scale.' },
      { name: 'TypeScript', level: 88, desc: 'Type-safe development with strict mode, generics, utility types, conditional types and advanced type inference.' },
      { name: 'React', level: 92, desc: 'Reactive UIs with hooks, context, Suspense, concurrent features, portals and performance optimization.' },
      { name: 'Next.js', level: 85, desc: 'Full-stack React: App Router, RSC, ISR, SSG/SSR, middleware, API routes and Edge Runtime.' },
      { name: 'Tailwind CSS', level: 90, desc: 'Utility-first CSS with design tokens, custom plugins, JIT, responsive modifiers and dark mode.' },
      { name: 'Vue.js', level: 72, desc: 'Vue 3 Composition API, Pinia state management, Vue Router and Vite build tooling.' },
      { name: 'Shadcn UI', level: 85, desc: 'Headless accessible components built on Radix UI primitives and CVA for custom design systems.' },
      { name: 'Redux', level: 78, desc: 'Predictable state with Redux Toolkit, RTK Query, middleware patterns and DevTools integration.' }
    ]
  },
  {
    id: 'backend', title: 'Backend', subtitle: 'Server & Database',
    accent: '#a855f7', glow: 'rgba(168,85,247,0.35)',
    items: [
      { name: 'Node.js', level: 88, desc: 'Server-side JS runtime. Scalable REST/WebSocket servers, streaming, worker threads and CLI tooling.' },
      { name: 'Express.js', level: 85, desc: 'Minimal web framework: REST APIs, middleware chains, JWT auth and structured error handling.' },
      { name: 'REST APIs', level: 90, desc: 'RESTful services with OAuth 2.0, versioning, OpenAPI documentation and rate limiting.' },
      { name: 'MongoDB', level: 82, desc: 'Document database with aggregation pipelines, Atlas Search, indexing strategies and Mongoose ODM.' },
      { name: 'MySQL', level: 75, desc: 'Relational DB design, complex JOINs, stored procedures, query optimization and replication.' },
      { name: 'Redis', level: 70, desc: 'In-memory store for caching, session management, pub/sub messaging and distributed rate limiting.' },
      { name: 'Prisma', level: 80, desc: 'Schema-first ORM with type-safe queries, auto-migrations, seeding and multi-database support.' },
      { name: 'FirestoreDB', level: 78, desc: 'Firebase real-time NoSQL with security rules, offline sync, composite queries and Cloud Functions.' }
    ]
  },
  {
    id: 'devops', title: 'DevOps', subtitle: 'Infra & Workflow',
    accent: '#39ff14', glow: 'rgba(57,255,20,0.35)',
    items: [
      { name: 'Git', level: 92, desc: 'Branching strategies, interactive rebase, hooks, CI pipelines and merge conflict resolution.' },
      { name: 'VS Code', level: 95, desc: 'Power user: custom extensions, snippets, multi-cursor, launch configs and integrated debugger.' },
      { name: 'Vercel', level: 88, desc: 'Deploy Next.js/React with preview environments, edge functions, analytics and custom domains.' },
      { name: 'AWS', level: 65, desc: 'EC2, S3, Lambda, CloudFront CDN, RDS databases and IAM policy management.' }
    ]
  },
  {
    id: 'gamedev', title: 'Game Dev', subtitle: 'Engines & Languages',
    accent: '#ff6b35', glow: 'rgba(255,107,53,0.35)',
    items: [
      { name: 'Unity Engine', level: 85, desc: 'C# scripting, physics, particle systems, custom shaders, asset bundles and mobile optimization.' },
      { name: 'Unreal Engine', level: 72, desc: 'Blueprint scripting, C++ gameplay systems, Nanite/Lumen rendering and material editor.' },
      { name: 'Roblox Studio', level: 90, desc: 'Lua scripting, complex game systems, pathfinding AI, DataStores and Roblox monetization.' },
      { name: 'C#', level: 85, desc: 'Primary language for Unity. OOP patterns, LINQ, async/await, delegates, events and generics.' },
      { name: 'C++', level: 65, desc: 'Unreal Engine C++, memory management, smart pointers, templates and performance profiling.' },
      { name: 'Lua', level: 88, desc: 'Roblox scripting: coroutines, metatables, closures, OOP and module patterns.' }
    ]
  },
  {
    id: 'video', title: 'Video', subtitle: 'Post-Production',
    accent: '#ff1493', glow: 'rgba(255,20,147,0.35)',
    items: [
      { name: 'Adobe After Effects', level: 85, desc: 'Motion graphics, VFX compositing, expressions, 3D camera tracking and plugin integration.' },
      { name: 'Adobe Premiere Pro', level: 88, desc: 'Professional NLE: color grading, audio mixing, Lumetri color science and multi-cam editing.' },
      { name: 'DaVinci Resolve', level: 80, desc: 'Node-based color grading, Fairlight audio, Fusion VFX compositor and collaborative workflows.' },
      { name: 'Topaz AI', level: 75, desc: 'AI-powered upscaling, denoising, frame interpolation and enhancement for cinematic quality.' },
      { name: 'Descript', level: 70, desc: 'Transcript-based editing, Overdub voice cloning, screen recording and podcast workflows.' },
      { name: 'Alight Motion', level: 78, desc: 'Mobile-first motion graphics, keyframe animation, VFX overlays and social-format exports.' },
      { name: 'CapCut', level: 82, desc: 'Social content: trend edits, AI tools, auto-captions, smart cut and format optimization.' },
      { name: 'Blur', level: 68, desc: 'Selective blur, depth-of-field simulation and focus-pull VFX for cinematic video content.' }
    ]
  }
]

/* ═══════════════════════════════════════════════════════
   Category icons (24 × 24, drawn with strokes)
═══════════════════════════════════════════════════════ */
const CATEGORY_ICON = {
  frontend: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  backend: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  devops: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  gamedev: 'M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4A2 2 0 0 1 9.8 16h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.3a4 4 0 0 0-4-3.7z',
  video: 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3zM6.2 5.3l3.1 3.9M12.4 3.4l3.1 4M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
}

function CategoryIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={CATEGORY_ICON[id]} />
    </svg>
  )
}

const tier = (level) => (level >= 88 ? 'Expert' : level >= 75 ? 'Advanced' : 'Intermediate')
const colorOf = (skill, cat) => BrandIcons[skill.name]?.color ?? cat.accent

function SkillIcon({ skill, color }) {
  const brand = BrandIcons[skill.name]
  if (brand) return brand.svg
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="3" fill={color + '25'} />
      <text x="16" y="20.5" textAnchor="middle" fontSize="9" fontWeight="900" fill={color} fontFamily="monospace">
        {skill.name.slice(0, 3).toUpperCase()}
      </text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════
   A burst of sparks where a skill was clicked
═══════════════════════════════════════════════════════ */
function ParticleBurst({ x, y, color }) {
  return (
    <div className="sk-burst" style={{ '--px': `${x}px`, '--py': `${y}px` }} aria-hidden="true">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="sk-burst__p"
          style={{ '--angle': `${i * 36}deg`, '--color': color, '--dist': `${28 + (i % 3) * 8}px`, '--delay': `${i * 0.02}s` }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   One skill
═══════════════════════════════════════════════════════ */
function SkillTile({ skill, cat, selected, onSelect, fillOnView }) {
  const color = colorOf(skill, cat)
  const [burst, setBurst] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const select = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setBurst(null), 700)
    onSelect(skill)
  }

  const fill = { width: `${skill.level}%` }
  return (
    <>
      <button
        type="button"
        className={`sk-tile${selected ? ' is-selected' : ''}`}
        style={{ '--c': color }}
        onClick={select}
        aria-pressed={selected}
        aria-label={`${skill.name}, ${skill.level}% — show details`}
      >
        <span className="sk-tile__frame">
          <span className="sk-tile__inner">
            <span className="sk-tile__icon"><SkillIcon skill={skill} color={color} /></span>
            <span className="sk-tile__name">{skill.name}</span>
            <span className="sk-tile__level">{skill.level}%</span>
            <span className="sk-tile__bar" aria-hidden="true">
              <motion.i
                initial={{ width: 0 }}
                {...(fillOnView ? { whileInView: fill, viewport: { once: true, amount: 0.6 } } : { animate: fill })}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              />
            </span>
          </span>
        </span>
      </button>
      {burst && <ParticleBurst x={burst.x} y={burst.y} color={color} />}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   What a skill is, how well I know it
═══════════════════════════════════════════════════════ */
function SkillDetail({ skill, cat }) {
  const color = colorOf(skill, cat)
  return (
    <motion.div
      key={skill.name}
      className="sk-detail"
      style={{ '--c': color }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sk-detail__top">
        <span className="sk-detail__icon"><SkillIcon skill={skill} color={color} /></span>
        <div>
          <p className="sk-detail__cat"><CategoryIcon id={cat.id} />{cat.title}</p>
          <h3 className="sk-detail__name">{skill.name}</h3>
        </div>
      </div>

      <div className="sk-detail__meter">
        <p>
          <span>Proficiency</span>
          <b>{skill.level}%</b>
        </p>
        <span className="sk-detail__track">
          <motion.i initial={{ width: 0 }} animate={{ width: `${skill.level}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} />
          {/* marks at the three tiers */}
          <em style={{ left: '75%' }} />
          <em style={{ left: '88%' }} />
        </span>
      </div>

      <p className="sk-detail__desc">{skill.desc}</p>
      <p className="sk-detail__tier">{tier(skill.level)}</p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Stacked layout: details open in a sheet (phones) or dialog
═══════════════════════════════════════════════════════ */
function DetailSheet({ skill, cat, onClose }) {
  const closeRef = useRef(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <>
      <motion.div className="sk-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
      <motion.div
        className="sk-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${skill.name} details`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } }}
        exit={{ opacity: 0, y: 40, transition: { duration: 0.25 } }}
      >
        <button type="button" className="sk-sheet__close" onClick={onClose} ref={closeRef} aria-label="Close details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <SkillDetail skill={skill} cat={cat} />
      </motion.div>
    </>
  )
}

function CategoryHead({ cat }) {
  return (
    <div className="sk-cat" style={{ '--c': cat.accent }}>
      <span className="sk-cat__icon"><CategoryIcon id={cat.id} /></span>
      <div>
        <h3 className="sk-cat__name">{cat.title}</h3>
        <p className="sk-cat__sub">{cat.subtitle}</p>
      </div>
      <span className="sk-cat__count">{cat.items.length} skills</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Main Skills Section
   Wide screens: the section pins and scrolling moves through the categories one at a time
   (each holds the screen for HOLD vh of scrolling); the selected skill's details stay
   beside the grid. Elsewhere: every category stacked, details in a sheet.
═══════════════════════════════════════════════════════ */
const PIN = '(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)'
const HOLD = 70
const N = categories.length

const SkillsBottom = () => {
  const { theme } = useTheme()
  const pinned = useMedia(PIN)
  const sectionRef = useRef(null)
  const tabsRef = useRef(null)
  const [active, setActive] = useState(0)
  const [selected, setSelected] = useState(null) // skill name
  const cat = categories[active]

  // 0 when the frame first sticks under the 70px navbar, 1 when the last category is reached.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 70px', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!pinned) return
    const f = p * (N - 1)
    tabsRef.current?.style.setProperty('--f', f.toFixed(3))
    const i = Math.max(0, Math.min(N - 1, Math.round(f)))
    setActive((a) => (a === i ? a : i))
  })

  const goTo = (i) => {
    if (!pinned) {
      document.getElementById(`skills-${categories[i].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - 70
    const distance = sectionRef.current.offsetHeight - (window.innerHeight - 70)
    window.scrollTo({ top: top + (i / (N - 1)) * distance, behavior: 'smooth' })
  }

  // In the pinned layout something is always shown: the selected skill, or the category's first.
  const shown = cat.items.find((s) => s.name === selected) ?? cat.items[0]
  const sheetCat = categories.find((c) => c.items.some((s) => s.name === selected))
  const sheetSkill = sheetCat?.items.find((s) => s.name === selected)
  const select = (skill) => setSelected((cur) => (pinned ? skill.name : cur === skill.name ? null : skill.name))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const head = (
    <motion.header className="sk-head" initial="hidden" whileInView="visible" viewport={{ amount: 0.5 }} transition={{ staggerChildren: 0.12 }}>
      <motion.h2 className="sk-title" variants={lineIn} data-text="My Skills">
        My Skills
      </motion.h2>
      <motion.p className="sk-sub" variants={lineIn}>
        <span aria-hidden="true">&gt;</span> Click any skill to reveal details · Hover for effects
      </motion.p>
    </motion.header>
  )

  return (
    <section
      className={`skills-v2 ${theme}${pinned ? ' skills-v2--pinned' : ''}`}
      ref={sectionRef}
      aria-label="Skills"
      style={pinned ? { height: `calc(100vh - 70px + ${(N - 1) * HOLD}vh)`, '--c': cat.accent } : undefined}
    >
      {pinned ? (
        <div className="sk-pin">
          <div className="sk-pin__top">
            {head}
            <div className="sk-tabs" ref={tabsRef} role="group" aria-label="Categories">
              {categories.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  className="sk-tab"
                  style={{ '--c': c.accent, '--i': i }}
                  aria-pressed={i === active}
                  onClick={() => goTo(i)}
                >
                  <CategoryIcon id={c.id} />
                  <span>{c.title}</span>
                  <i className="sk-tab__fill" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          <div className="sk-stage">
            <div className="sk-grid-wrap">
              <AnimatePresence mode="wait">
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18, transition: { duration: 0.2, ease: [0.55, 0, 1, 0.45] } }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <CategoryHead cat={cat} />
                  <div className="sk-grid">
                    {cat.items.map((skill, idx) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, y: 16, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.05 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <SkillTile skill={skill} cat={cat} selected={shown.name === skill.name} onSelect={select} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <aside className="sk-panel" style={{ '--c': cat.accent }} aria-live="polite">
              <AnimatePresence mode="wait">
                <SkillDetail key={`${cat.id}-${shown.name}`} skill={shown} cat={cat} />
              </AnimatePresence>
            </aside>
          </div>

          <p className="sk-foot" aria-hidden="true">
            <span><kbd>Scroll</kbd> to switch category</span>
            <span><b>{String(active + 1).padStart(2, '0')}</b> / {String(N).padStart(2, '0')}</span>
          </p>
        </div>
      ) : (
        <div className="sk-stack">
          {head}
          <nav className="sk-jump" aria-label="Categories">
            {categories.map((c, i) => (
              <button key={c.id} type="button" style={{ '--c': c.accent }} onClick={() => goTo(i)}>
                <CategoryIcon id={c.id} />
                {c.title}
              </button>
            ))}
          </nav>
          {categories.map((c) => (
            <motion.div
              key={c.id}
              id={`skills-${c.id}`}
              className="sk-block"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <CategoryHead cat={c} />
              <div className="sk-grid">
                {c.items.map((skill) => (
                  <SkillTile key={skill.name} skill={skill} cat={c} selected={selected === skill.name} onSelect={select} fillOnView />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {!pinned && sheetSkill && <DetailSheet key="sheet" skill={sheetSkill} cat={sheetCat} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  )
}

export default SkillsBottom
