import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
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
    accent: '#00f5ff', glow: 'rgba(0,245,255,0.35)', icon: '⚡',
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
    accent: '#a855f7', glow: 'rgba(168,85,247,0.35)', icon: '🛢️',
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
    accent: '#39ff14', glow: 'rgba(57,255,20,0.35)', icon: '🔧',
    items: [
      { name: 'Git', level: 92, desc: 'Branching strategies, interactive rebase, hooks, CI pipelines and merge conflict resolution.' },
      { name: 'VS Code', level: 95, desc: 'Power user: custom extensions, snippets, multi-cursor, launch configs and integrated debugger.' },
      { name: 'Vercel', level: 88, desc: 'Deploy Next.js/React with preview environments, edge functions, analytics and custom domains.' },
      { name: 'AWS', level: 65, desc: 'EC2, S3, Lambda, CloudFront CDN, RDS databases and IAM policy management.' }
    ]
  },
  {
    id: 'gamedev', title: 'Game Dev', subtitle: 'Engines & Languages',
    accent: '#ff6b35', glow: 'rgba(255,107,53,0.35)', icon: '🎮',
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
    accent: '#ff1493', glow: 'rgba(255,20,147,0.35)', icon: '🎬',
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
   Responsive hook — debounced so it's reliable
═══════════════════════════════════════════════════════ */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

/* ═══════════════════════════════════════════════════════
   Particle Burst — portalled to fixed position
═══════════════════════════════════════════════════════ */
function ParticleBurst({ x, y, color }) {
  return (
    <div
      className="sk-burst"
      style={{ '--px': `${x}px`, '--py': `${y}px` }}
      aria-hidden="true"
    >
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="sk-burst__p"
          style={{
            '--angle': `${i * 36}deg`,
            '--color': color,
            '--dist': `${28 + (i % 3) * 8}px`,
            '--delay': `${i * 0.02}s`
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Skill Card
═══════════════════════════════════════════════════════ */
function SkillCard({ skill, accent, glow, onSelect, isSelected }) {
  const brand = BrandIcons[skill.name]
  const color = brand?.color ?? accent
  const [burst, setBurst] = useState(null)
  const btnRef = useRef(null)

  const handleClick = useCallback(() => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      const t = setTimeout(() => setBurst(null), 700)
      return () => clearTimeout(t)
    }
    onSelect(skill)
  }, [onSelect, skill])

  const handleClickInner = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      setTimeout(() => setBurst(null), 700)
    }
    onSelect(skill)
  }

  return (
    <>
      <motion.button
        ref={btnRef}
        className={`sk-card${isSelected ? ' sk-card--active' : ''}`}
        style={{ '--accent': color, '--glow': glow }}
        onClick={handleClickInner}
        whileHover="hover"
        whileTap={{ scale: 0.91, transition: { duration: 0.12 } }}
        variants={{ hover: { y: -5, scale: 1.04, transition: { duration: 0.22, ease: 'easeOut' } } }}
        aria-label={`${skill.name} — click for details`}
        aria-pressed={isSelected}
      >
        <div className="sk-card__shimmer" aria-hidden="true" />
        <div className="sk-card__icon">
          {brand
            ? brand.svg
            : (
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="3" fill={color + '25'}/>
                <text x="16" y="20.5" textAnchor="middle" fontSize="9" fontWeight="900" fill={color} fontFamily="monospace">
                  {skill.name.slice(0, 3).toUpperCase()}
                </text>
              </svg>
            )}
        </div>
        <span className="sk-card__name">{skill.name}</span>
        <div className="sk-card__bar-wrap">
          <motion.div
            className="sk-card__bar"
            style={{ '--bc': color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${skill.level}%` }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>
        <div className="sk-card__ring" aria-hidden="true" />
        {isSelected && <div className="sk-card__dot" aria-hidden="true" />}
      </motion.button>
      {burst && <ParticleBurst x={burst.x} y={burst.y} color={color} />}
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   Detail Panel Content (inner, animates on skill change)
═══════════════════════════════════════════════════════ */
function PanelContent({ skill, category }) {
  const brand = BrandIcons[skill.name]
  const color = brand?.color ?? category.accent

  return (
    <motion.div
      key={skill.name}
      className="sk-detail__inner"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="sk-detail__icon" style={{ borderColor: `color-mix(in srgb, ${color} 35%, transparent)`, boxShadow: `0 0 20px color-mix(in srgb, ${color} 25%, transparent)` }}>
        {brand
          ? brand.svg
          : (
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="3" fill={color + '25'}/>
              <text x="16" y="20.5" textAnchor="middle" fontSize="9" fontWeight="900" fill={color} fontFamily="monospace">
                {skill.name.slice(0, 3).toUpperCase()}
              </text>
            </svg>
          )}
      </div>

      <h3 className="sk-detail__name">{skill.name}</h3>

      <div className="sk-detail__badge-row">
        <span className="sk-detail__cat-badge" style={{ '--accent': color }}>
          {category.icon} {category.title}
        </span>
      </div>

      <div className="sk-detail__meter">
        <div className="sk-detail__meter-head">
          <span>Proficiency</span>
          <span className="sk-detail__pct" style={{ color }}>{skill.level}%</span>
        </div>
        <div className="sk-detail__track">
          <motion.div
            className="sk-detail__fill"
            style={{ '--accent': color }}
            initial={{ width: 0 }}
            animate={{ width: `${skill.level}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
          <motion.div
            className="sk-detail__pip"
            style={{ '--accent': color }}
            initial={{ left: '0%' }}
            animate={{ left: `${skill.level}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>
      </div>

      <p className="sk-detail__desc">{skill.desc}</p>

      <div className="sk-detail__tags">
        {[
          'Proficient',
          skill.level >= 88 ? 'Expert' : skill.level >= 75 ? 'Advanced' : 'Intermediate'
        ].map(tag => (
          <span key={tag} className="sk-detail__tag" style={{ '--accent': color }}>{tag}</span>
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   Detail Panel Shell (persistent — never remounts while any skill is selected)
═══════════════════════════════════════════════════════ */
function DetailPanel({ skill, category, onClose, isMobile }) {
  // Lock body scroll on mobile
  useEffect(() => {
    if (!isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isMobile])

  // Desktop panel: smooth slide-in from right; mobile: sheet slides up from bottom
  const panelAnim = isMobile
    ? {
        initial: { y: '100%', opacity: 0 },
        animate: { y: 0, opacity: 1,
          transition: { duration: 0.48, ease: [0.25, 0.46, 0.45, 0.94] }
        },
        exit:    { y: '100%', opacity: 0,
          transition: { duration: 0.36, ease: [0.55, 0, 1, 0.45] }
        }
      }
    : {
        initial: { x: 48, opacity: 0, scale: 0.97 },
        animate: { x: 0,  opacity: 1, scale: 1,
          transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
        },
        exit:    { x: 28, opacity: 0, scale: 0.97,
          transition: { duration: 0.3, ease: [0.55, 0, 1, 0.45] }
        }
      }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="sk-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel shell */}
      <motion.div
        className="sk-detail"
        style={{ '--accent': category.accent, '--glow': category.glow }}
        initial={panelAnim.initial}
        animate={panelAnim.animate}
        exit={panelAnim.exit}
        role="dialog"
        aria-modal="true"
        aria-label={`${skill.name} skill details`}
      >
        <div className="sk-detail__orb" aria-hidden="true" />

        {/* Close button */}
        <button className="sk-detail__close" onClick={onClose} aria-label="Close detail panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Inner content — animates when switching skills */}
        <AnimatePresence mode="wait">
          <PanelContent key={skill.name} skill={skill} category={category} />
        </AnimatePresence>
      </motion.div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   Category Tab
═══════════════════════════════════════════════════════ */
function CategoryTab({ cat, isActive, onClick }) {
  return (
    <motion.button
      className={`sk-tab${isActive ? ' sk-tab--active' : ''}`}
      style={{ '--accent': cat.accent }}
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
      aria-pressed={isActive}
    >
      <span className="sk-tab__icon" aria-hidden="true">{cat.icon}</span>
      <span className="sk-tab__text">{cat.title}</span>
      {isActive && (
        <motion.div
          className="sk-tab__bar"
          layoutId="tab-bar"
          style={{ background: cat.accent }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════
   Main Skills Section
═══════════════════════════════════════════════════════ */
const SkillsBottom = () => {
  const { theme } = useTheme()
  const isMobile = useIsMobile()

  const [activeCat, setActiveCat] = useState(0)
  const [selectedSkill, setSelectedSkill] = useState(null)

  const cat = categories[activeCat]

  // Close panel + switch category
  const handleCatChange = useCallback((idx) => {
    setSelectedSkill(null)
    // Delay the category switch slightly so the panel exit animation has a head start
    setTimeout(() => setActiveCat(idx), 60)
  }, [])

  // Toggle skill: same skill = close; different skill = update content (panel stays)
  const handleSkillSelect = useCallback((skill) => {
    setSelectedSkill(prev => {
      if (prev?.name === skill.name) return null  // close
      return skill                                 // switch content
    })
  }, [])

  const handleClose = useCallback(() => setSelectedSkill(null), [])

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  return (
    <section
      id="skills-bottom"
      className={`skills-v2 ${theme}`}
      aria-label="Skills section"
    >
      {/* Ambient BG */}
      <div className="skills-v2__bg" aria-hidden="true">
        <div className="skills-v2__grid-bg" />
        <div className="skills-v2__orb orb--a" style={{ '--c': cat.accent }} />
        <div className="skills-v2__orb orb--b" style={{ '--c': cat.glow }} />
      </div>

      <div className="skills-v2__wrap">

        {/* Header */}
        <motion.header
          className="skills-v2__header"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="skills-v2__eyebrow">
            <span className="skills-v2__rule" />
            <span>TECH ARSENAL</span>
            <span className="skills-v2__rule" />
          </div>
          <h2 className="skills-v2__title">
            My{' '}
            <span className="skills-v2__title-hl" style={{ '--accent': cat.accent }}>
              Skills
            </span>
          </h2>
          <p className="skills-v2__sub">Click any skill to reveal details · Hover for effects</p>
        </motion.header>

        {/* Tabs */}
        <motion.div
          className="skills-v2__tabs"
          role="tablist"
          aria-label="Skill categories"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
        >
          {categories.map((c, i) => (
            <CategoryTab
              key={c.id}
              cat={c}
              isActive={i === activeCat}
              onClick={() => handleCatChange(i)}
            />
          ))}
        </motion.div>

        {/* Body */}
        <div className={`skills-v2__body${selectedSkill ? ' skills-v2__body--split' : ''}`}>

          {/* Skills grid */}
          <div className="skills-v2__panel">
            <AnimatePresence mode="wait">
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14, transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] } }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Category row */}
                <div className="skills-v2__cat-row">
                  <div className="skills-v2__cat-icon" style={{ '--accent': cat.accent }} aria-hidden="true">
                    {cat.icon}
                  </div>
                  <div className="skills-v2__cat-info">
                    <h3 className="skills-v2__cat-name" style={{ color: cat.accent }}>{cat.title}</h3>
                    <p className="skills-v2__cat-sub">{cat.subtitle}</p>
                  </div>
                  <span className="skills-v2__cat-count" style={{ '--accent': cat.accent }}>
                    {cat.items.length} skills
                  </span>
                </div>

                {/* Cards — stagger in smoothly, exit together */}
                <div className="skills-v2__cards">
                  {cat.items.map((skill, idx) => (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, scale: 0.88, y: 18 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.18 } }}
                      transition={{
                        duration: 0.45,
                        delay: idx * 0.045,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                    >
                      <SkillCard
                        skill={skill}
                        accent={cat.accent}
                        glow={cat.glow}
                        onSelect={handleSkillSelect}
                        isSelected={selectedSkill?.name === skill.name}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Detail panel — key is ALWAYS "panel"; AnimatePresence controls mount/unmount */}
          <AnimatePresence mode="wait">
            {selectedSkill && (
              <DetailPanel
                key="panel"
                skill={selectedSkill}
                category={cat}
                onClose={handleClose}
                isMobile={isMobile}
              />
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  )
}

export default SkillsBottom