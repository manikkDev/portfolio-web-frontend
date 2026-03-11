# Manik's Portfolio Website

A **high-performance, gamified portfolio website** built with React 19 and Vite 7. Features a cyberpunk/gaming-themed UI with interactive elements, smooth scroll animations, and an immersive user experience.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-FF0055?style=flat&logo=framer)

## ✨ Features

### 🎮 Gaming-Themed UI
- **Cyberpunk HUD** hero section with terminal window, XP bar, and code panel
- **Custom crosshair cursor** with click-to-fire animation
- **Neon glow effects** (cyan, magenta, yellow, green)
- **Scan-line and circuit-pattern** backgrounds
- **Intro overlay** with gaming icons and entrance animation

### 📱 Fully Responsive
- **Mobile-first CSS** — optimized for all screen sizes from 320px up
- **Flexible grid layouts** — auto-stacking on small screens
- **Dynamic font sizing** with `clamp()` throughout
- **Touch-friendly** interactions (44px+ touch targets)

### ⚡ Performance Optimized
- **Lazy loading** — below-fold sections load on scroll via `IntersectionObserver`
- **Code splitting** — `React.lazy()` + `Suspense` for deferred module loading
- **Reduced motion** — respects `prefers-reduced-motion` system setting
- **Optimized animations** — `requestAnimationFrame` batched scroll handlers

### 🌓 Theme System
- **Dark mode** (default) — cyberpunk neon aesthetic
- **Light mode** — clean professional look
- Toggle in the navbar with smooth transitions

## 📂 Project Structure

```
portfolio/
├── public/                # Static assets
├── src/
│   ├── api/
│   │   └── client.js      # Backend API client
│   ├── assets/            # Images, videos, logos
│   ├── components/
│   │   ├── About/         # About section with game HUD stats
│   │   ├── Contact/       # Contact form (connected to backend)
│   │   ├── Experience/    # Work experience timeline
│   │   ├── Footer/        # Site footer
│   │   ├── GeometryDash/  # Interactive game element
│   │   ├── Hero/          # Hero section with HUD
│   │   ├── LinkedPosts/   # LinkedIn blog posts (from API)
│   │   ├── Navbar/        # Fixed navbar with scroll tracking
│   │   ├── Projects/      # Project showcase
│   │   ├── Rating/        # Star rating & comments (from API)
│   │   ├── Skills/        # Tech stack with custom SVG icons
│   │   ├── Youtube/       # YouTube channel section
│   │   └── LazySection.jsx
│   ├── contexts/
│   │   ├── ThemeContext.js
│   │   └── ThemeProvider.jsx
│   ├── hooks/
│   │   ├── useTheme.js
│   │   └── useReducedMotion.js
│   ├── App.jsx
│   ├── App.css
│   └── index.css          # Global styles & CSS variables
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **npm** 9+

### Installation

```bash
git clone https://github.com/manikkDev/portfolio-web-frontend.git
cd portfolio-web-frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at **http://localhost:5173**

### Build

```bash
npm run build
npm run preview
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=http://localhost:3001/api
```

## 🗄️ Backend

This frontend connects to a separate backend API for:
- **Contact form** submissions
- **Star ratings** and comments
- **YouTube** video caching
- **LinkedIn** posts

See the [Backend Repository](https://github.com/manikkDev/portfolio-web-backend) for setup instructions.

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Framer Motion 12** | Scroll & interaction animations |
| **Three.js** | 3D elements |
| **Vanilla CSS** | Styling with CSS custom properties |

## 🎨 Design System

### CSS Custom Properties

The design uses CSS variables for consistent theming:

```css
--neon-cyan: #00f5ff;
--neon-magenta: #ff00ff;
--neon-yellow: #ffd700;
--neon-green: #39ff14;
--bg-primary: #0a0a0a;
--font-primary: 'Orbitron', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Sections

| Section | Description |
|---------|-------------|
| **Hero** | Full-screen HUD with profile, stats, and terminal |
| **About** | Bio with game-style HP/XP bars |
| **Experience** | Timeline of work/projects |
| **Projects** | Card grid with hover effects |
| **Skills** | Categorized tech stack with SVG icons |
| **YouTube** | Channel showcase with embedded video |
| **Blog** | LinkedIn posts feed |
| **Contact** | Form with backend integration |
| **Rating** | Star rating with live reviews |

## 📄 License

MIT © Manikaraj Anburaj
