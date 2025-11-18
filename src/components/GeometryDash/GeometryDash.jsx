import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'
import './GeometryDash.css'

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6 } } }
const titleVariants = { hidden: { y: 24, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } } }

const GeometryDash = () => {
  const { theme } = useTheme()
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { threshold: 0.2 })
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const stateRef = useRef({})
  const [phase, setPhase] = useState('start')
  const [difficulty, setDifficulty] = useState('easy')
  const [color, setColor] = useState(() => localStorage.getItem('gdash_color') || 'cyan')
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('gdash_sound') !== 'off')
  const [vfx, setVfx] = useState(() => localStorage.getItem('gdash_vfx') || 'high')

  const settings = useMemo(() => ({
    gravity: 0.62,
    jumpImpulse: -15,
    baseSpeed: 6,
    maxSpeed: 14,
    obstacleGapMin: 260,
    obstacleGapMax: 420,
    obstacleWidthMin: 32,
    obstacleWidthMax: 48,
    obstacleHeightMin: 36,
    obstacleHeightMax: 120,
    particleCount: 22,
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const jumpFrames = Math.round(Math.abs(settings.jumpImpulse) * 2 / settings.gravity)
    const S = { width: 0, height: 0, running: false, score: 0, speed: settings.baseSpeed, obstacles: [], particles: [], shake: 0, reduced, tune: { baseSpeed: 4.0, maxSpeed: 9.5, ramp: 0.015, gapMin: 360, gapMax: 540, hMax: 90 }, jumpHold: false, lastJumpTime: 0, lastGroundTime: 0, holdMax: 200, coyoteMs: 140, jumpFrames, jumpBufferMs: 140, jumpQueuedTime: 0 }
    const player = { x: 120, y: 0, w: 28, h: 28, vy: 0, onGround: false, trail: [] }
    S.player = player

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      S.width = Math.floor(rect.width)
      S.height = Math.floor(Math.max(280, rect.height))
      canvas.width = Math.floor(S.width * dpr)
      canvas.height = Math.floor(S.height * dpr)
      canvas.style.width = S.width + 'px'
      canvas.style.height = S.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    const skyGrad = ctx.createLinearGradient(0, 0, 0, S.height)
    skyGrad.addColorStop(0, theme === 'dark' ? '#0a0f1f' : '#eaf2ff')
    skyGrad.addColorStop(1, theme === 'dark' ? '#111833' : '#cfe0ff')

    const vfxScale = vfx === 'low' ? 0.6 : vfx === 'medium' ? 0.85 : 1
    S.vfxScale = vfxScale
    S.maxParticles = vfx === 'low' ? 60 : vfx === 'medium' ? 120 : 180
    const parallax = [
      { speed: 0.15, y: () => Math.floor(S.height * 0.35), peaks: 8, amp: Math.floor(24 * vfxScale) },
      { speed: 0.3, y: () => Math.floor(S.height * 0.55), peaks: 10, amp: Math.floor(32 * vfxScale) }
    ]
    S.parallax = parallax

    const groundY = () => Math.floor(S.height - 64)

    const makeObstacles = () => {
      S.obstacles.length = 0
      let x = S.width + 200
      for (let i = 0; i < 20; i++) {
        const gap = settings.obstacleGapMin + Math.random() * (settings.obstacleGapMax - settings.obstacleGapMin)
        const w = settings.obstacleWidthMin + Math.random() * (settings.obstacleWidthMax - settings.obstacleWidthMin)
        const h = settings.obstacleHeightMin + Math.random() * (settings.obstacleHeightMax - settings.obstacleHeightMin)
        S.obstacles.push({ x, y: groundY() - h, w, h })
        x += gap
      }
    }
    makeObstacles()

    const audio = { ctx: null }
    const tone = (freq = 420, ms = 120, vol = 0.08) => {
      if (!soundOn || S.reduced) return
      try {
        if (!audio.ctx) audio.ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audio.ctx.createOscillator()
        const gain = audio.ctx.createGain()
        gain.gain.value = vol
        osc.type = 'square'
        osc.frequency.value = freq
        osc.connect(gain)
        gain.connect(audio.ctx.destination)
        osc.start()
        setTimeout(() => { osc.stop(); osc.disconnect(); gain.disconnect() }, ms)
      } catch { return }
    }

    const jump = () => {
      const now = performance.now()
      if (player.onGround || now - S.lastGroundTime < S.coyoteMs) {
        player.vy = settings.jumpImpulse
        player.onGround = false
        S.lastJumpTime = now
        spawnJumpVfx(player.x + player.w / 2, player.y + player.h)
        tone(560, 90, 0.06)
      }
    }

    const spawnJumpVfx = (x, y) => {
      const base = S.reduced ? Math.floor(settings.particleCount * 0.4) : settings.particleCount
      const count = Math.floor(base * S.vfxScale)
      for (let i = 0; i < count && S.particles.length < S.maxParticles; i++) {
        const a = Math.random() * Math.PI
        const sp = 2 + Math.random() * 3
        S.particles.push({ x, y, vx: Math.cos(a) * sp, vy: -Math.abs(Math.sin(a)) * sp, life: 400 + Math.random() * 300 })
      }
      S.shake = 10
    }

    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); S.jumpHold = true; S.jumpQueuedTime = performance.now(); jump() }
      if (e.code === 'KeyP') { S.running = !S.running; setPhase(S.running ? 'running' : 'paused') }
      if (e.code === 'Escape') { S.running = false; setPhase('start') }
    }
    const onKeyUp = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { S.jumpHold = false } }
    const onClick = () => jump()
    const onMouseDown = () => { S.jumpHold = true }
    const onMouseUp = () => { S.jumpHold = false }
    const onTouchStart = () => { S.jumpHold = true; jump() }
    const onTouchEnd = () => { S.jumpHold = false }
    canvas.addEventListener('click', onClick)
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)

    const drawBackground = (t) => {
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, S.width, S.height)
      const scanY = (t / 20) % S.height
      ctx.fillStyle = theme === 'dark' ? 'rgba(0,255,255,0.05)' : 'rgba(0,0,0,0.03)'
      for (let i = -1; i < 2; i++) {
        ctx.fillRect(0, scanY + i * 80, S.width, 2)
      }
      ctx.save()
      ctx.fillStyle = theme === 'dark' ? 'rgba(0,120,200,0.25)' : 'rgba(0,0,0,0.1)'
      for (let k = 0; k < S.parallax.length; k++) {
        const layer = S.parallax[k]
        const offset = (t * layer.speed) % S.width
        ctx.beginPath()
        const baseY = layer.y()
        for (let x = -S.width; x <= S.width * 2; x += S.width / layer.peaks) {
          const y = baseY - Math.sin((x + offset) * 0.01) * layer.amp
          if (x === -S.width) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.lineTo(S.width * 2, S.height)
        ctx.lineTo(-S.width, S.height)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()
      ctx.fillStyle = theme === 'dark' ? '#08131f' : '#c7d9ff'
      ctx.fillRect(0, groundY(), S.width, S.height - groundY())
      ctx.fillStyle = theme === 'dark' ? 'rgba(0,245,255,0.25)' : 'rgba(0,0,0,0.08)'
      for (let i = 0; i < S.width; i += 24) ctx.fillRect(i, groundY(), 12, 2)
    }

    const collide = (a, b) => !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h)

    const drawPlayer = (t) => {
      ctx.save()
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2)
      const rot = (t / 240) % (Math.PI * 2)
      ctx.rotate(rot)
      const palette = { cyan: 'rgba(0,255,255,0.9)', magenta: 'rgba(255,0,255,0.9)', yellow: 'rgba(255,220,0,0.9)', green: 'rgba(57,255,20,0.9)' }
      const c = palette[color] || palette.cyan
      ctx.fillStyle = theme === 'dark' ? c : 'rgba(0,0,0,0.8)'
      ctx.shadowColor = theme === 'dark' ? c.replace('0.9', '0.6') : 'rgba(0,0,0,0.25)'
      ctx.shadowBlur = 12
      ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h)
      ctx.restore()

      player.trail.push({ x: player.x, y: player.y })
      if (player.trail.length > 10) player.trail.shift()
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < player.trail.length; i++) {
        const p = player.trail[i]
        const alpha = i / player.trail.length
        ctx.fillStyle = `rgba(0,255,255,${0.15 * alpha})`
        ctx.fillRect(p.x + 6, p.y + 6, player.w - 12, player.h - 12)
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    

    const drawPads = () => {
      ctx.fillStyle = theme === 'dark' ? 'rgba(57,255,20,0.9)' : 'rgba(0,0,0,0.9)'
      for (let i = 0; i < (S.pads?.length || 0); i++) {
        const p = S.pads[i]
        ctx.beginPath()
        ctx.moveTo(p.x, groundY())
        ctx.lineTo(p.x + 18, groundY())
        ctx.lineTo(p.x + 9, groundY() - 12)
        ctx.closePath()
        ctx.fill()
      }
    }

    const drawCoins = () => {
      for (let i = 0; i < (S.coins?.length || 0); i++) {
        const c0 = S.coins[i]
        const r = 7
        const grad = ctx.createRadialGradient(c0.x, c0.y, 2, c0.x, c0.y, r)
        grad.addColorStop(0, 'rgba(255,215,0,0.95)')
        grad.addColorStop(1, 'rgba(255,140,0,0.6)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(c0.x, c0.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawParticles = (dt) => {
      for (let i = S.particles.length - 1; i >= 0; i--) {
        const p = S.particles[i]
        p.life -= dt
        if (p.life <= 0 || p.x < -20 || p.x > S.width + 20 || p.y > S.height + 20) { S.particles.splice(i, 1); continue }
        p.x += p.vx
        p.y += p.vy
        p.vy += settings.gravity * 0.04
        ctx.fillStyle = 'rgba(0,255,255,0.6)'
        ctx.fillRect(p.x, p.y, 3, 3)
      }
    }

    const applyDifficulty = () => {
      if (difficulty === 'easy') { S.tune = { baseSpeed: 3.6, maxSpeed: 8.5, ramp: 0.014, gapMin: 380, gapMax: 560, hMax: 80 } }
      else if (difficulty === 'normal') { S.tune = { baseSpeed: 4.4, maxSpeed: 10.0, ramp: 0.020, gapMin: 340, gapMax: 520, hMax: 100 } }
      else { S.tune = { baseSpeed: 5.0, maxSpeed: 12.0, ramp: 0.026, gapMin: 320, gapMax: 480, hMax: 110 } }
    }

    const bestKey = (d) => `gdash_best_${d}`
    const restart = () => {
      applyDifficulty()
      S.score = 0
      S.speed = S.tune.baseSpeed
      player.x = 120
      player.y = groundY() - player.h
      player.vy = 0
      player.onGround = true
      player.trail.length = 0
      S.obstacles.length = 0
      S.coins = []
      S.pads = []
      S.combo = 0
      S.comboTimer = 1500
      S.shieldActive = false
      S.invTimer = 0
      let x = S.width + 200
      for (let i = 0; i < 20; i++) {
        const baseGap = S.tune.gapMin + Math.random() * (S.tune.gapMax - S.tune.gapMin)
        const requiredGap = Math.max(baseGap, Math.ceil(S.tune.baseSpeed * S.jumpFrames + 80))
        const w = settings.obstacleWidthMin + Math.random() * (settings.obstacleWidthMax - settings.obstacleWidthMin)
        const h = settings.obstacleHeightMin + Math.random() * (S.tune.hMax - settings.obstacleHeightMin)
        const shape = Math.random() < 0.3 ? 'tri' : 'rect'
        S.obstacles.push({ x, y: groundY() - h, w, h, shape })
        if (Math.random() < 0.5) S.coins.push({ x: x + w + 24, y: groundY() - h - 24 })
        if (Math.random() < 0.3) S.pads.push({ x: x - 34 })
        x += requiredGap
      }
      S.running = true
      setPhase('running')
    }

    const update = (dt, t) => {
      if (!S.running) {
        drawBackground(t)
        player.y = groundY() - player.h
        drawPlayer(t)
        return
      }
      S.score += dt * 0.01 * (1 + (S.combo || 0) * 0.25)
      S.speed = Math.min(S.tune.maxSpeed, S.tune.baseSpeed + S.score * S.tune.ramp)

      for (let i = 0; i < S.obstacles.length; i++) {
        const o = S.obstacles[i]
        o.x -= S.speed
      }
      if (S.obstacles.length && S.obstacles[0].x + S.obstacles[0].w < -20) {
        S.obstacles.shift()
        const last = S.obstacles[S.obstacles.length - 1]
        const baseGap = S.tune.gapMin + Math.random() * (S.tune.gapMax - S.tune.gapMin)
        const requiredGap = Math.max(baseGap, Math.ceil(S.speed * S.jumpFrames + 80))
        const w = settings.obstacleWidthMin + Math.random() * (settings.obstacleWidthMax - settings.obstacleWidthMin)
        const h = settings.obstacleHeightMin + Math.random() * (S.tune.hMax - settings.obstacleHeightMin)
        const shape = Math.random() < 0.35 ? 'tri' : 'rect'
        const nx = last.x + requiredGap
        S.obstacles.push({ x: nx, y: groundY() - h, w, h, shape })
        if (Math.random() < 0.55) S.coins.push({ x: nx + w + 24, y: groundY() - h - 24 })
        if (Math.random() < 0.35) S.pads.push({ x: nx - 34 })
      }

      for (let i = S.pads.length - 1; i >= 0; i--) { const p = S.pads[i]; p.x -= S.speed; if (p.x < -40) S.pads.splice(i, 1) }
      for (let i = S.coins.length - 1; i >= 0; i--) { const c0 = S.coins[i]; c0.x -= S.speed; if (c0.x < -40) S.coins.splice(i, 1) }

      player.vy += settings.gravity
      if (S.jumpHold && t - S.lastJumpTime < S.holdMax) { player.vy += -settings.gravity * 0.5 }
      player.y += player.vy
      if (player.y + player.h >= groundY()) {
        player.y = groundY() - player.h; player.vy = 0
        if (!player.onGround) { player.onGround = true; S.lastGroundTime = t }
        if (S.jumpQueuedTime && t - S.jumpQueuedTime < S.jumpBufferMs) { S.jumpQueuedTime = 0; jump() }
      }

      for (let i = 0; i < S.obstacles.length; i++) {
        const o = S.obstacles[i]
        if (collide({ x: player.x + 2, y: player.y + 2, w: player.w - 4, h: player.h - 4 }, { x: o.x, y: o.y, w: o.w, h: o.h })) {
          if (S.invTimer > 0) continue
          if (S.shieldActive) {
            S.shieldActive = false
            S.invTimer = 500
            player.vy = settings.jumpImpulse * 0.8
            player.onGround = false
            S.lastJumpTime = t
            spawnJumpVfx(player.x + player.w / 2, player.y + player.h)
            tone(700, 120, 0.06)
            continue
          }
          S.running = false
          setPhase('gameover')
          const best = Number(localStorage.getItem(bestKey(difficulty)) || 0)
          if (Math.floor(S.score) > best) localStorage.setItem(bestKey(difficulty), String(Math.floor(S.score)))
          tone(240, 220, 0.05)
          break
        }
      }

      for (let i = S.pads.length - 1; i >= 0; i--) {
        const p = S.pads[i]
        const nearGround = Math.abs(player.y + player.h - groundY()) < 2
        if (nearGround && player.x + player.w > p.x && player.x < p.x + 18) {
          player.vy = settings.jumpImpulse * 0.9
          player.onGround = false
          S.lastJumpTime = t
          spawnJumpVfx(player.x + player.w / 2, player.y + player.h)
          tone(620, 100, 0.06)
          S.pads.splice(i, 1)
          S.combo = (S.combo || 0) + 1
          S.comboTimer = 1500
        }
      }

      for (let i = S.coins.length - 1; i >= 0; i--) {
        const c0 = S.coins[i]
        const cx = player.x + player.w / 2
        const cy = player.y + player.h / 2
        const dx = c0.x - cx
        const dy = c0.y - cy
        if (dx * dx + dy * dy < 12 * 12) {
          S.score += 10
          tone(880, 80, 0.06)
          spawnJumpVfx(c0.x, c0.y)
          S.coins.splice(i, 1)
          S.combo = (S.combo || 0) + 1
          S.comboTimer = 1500
          if (!S.shieldActive && (S.combo || 0) >= 5) S.shieldActive = true
        }
      }

      if (S.shake > 0) S.shake -= dt * 0.04
      drawBackground(t)
      ctx.save()
      if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake)
      ctx.save()
      ctx.fillStyle = theme === 'dark' ? 'rgba(255,0,255,0.85)' : 'rgba(0,0,0,0.85)'
      for (let i = 0; i < S.obstacles.length; i++) {
        const o = S.obstacles[i]
        if (o.shape === 'tri') {
          ctx.beginPath()
          ctx.moveTo(o.x, o.y + o.h)
          ctx.lineTo(o.x + o.w, o.y + o.h)
          ctx.lineTo(o.x + o.w / 2, o.y)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.fillRect(o.x, o.y, o.w, o.h)
        }
      }
      ctx.restore()
      drawPads()
      drawCoins()
      drawPlayer(t)
      ctx.restore()
      drawParticles(dt)

      ctx.fillStyle = theme === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'
      ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto'
      const best = Number(localStorage.getItem(bestKey(difficulty)) || 0)
      ctx.fillText(`Score: ${Math.floor(S.score)} • Best(${difficulty}): ${best}`, 12, 22)
      if (S.combo && S.combo > 0) ctx.fillText(`x${Math.min(9, Math.floor(S.combo))}`, S.width - 40, 22)
      if (S.invTimer > 0 || S.shieldActive) ctx.fillText(`Shield`, S.width - 110, 22)

      if (S.comboTimer > 0) { S.comboTimer -= dt; if (S.comboTimer <= 0 && S.combo && S.combo > 0) { S.combo -= 1; S.comboTimer = 1500 } }
      if (S.invTimer > 0) S.invTimer -= dt
    }

    let rafId = 0
    const loop = () => {
      const now = performance.now()
      const dt = stateRef.current.last ? Math.min(32, now - stateRef.current.last) : 16
      stateRef.current.last = now
      update(dt, now)
      rafId = requestAnimationFrame(loop)
    }

    stateRef.current.restart = restart
    stateRef.current.jump = jump
    loop()

    const cleanup = () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
    stateRef.current.cleanup = cleanup
    return cleanup
  }, [theme, settings, difficulty, soundOn, color, vfx])

  return (
    <motion.section
      id="geometry-dash"
      className={`gdash ${theme}`}
      ref={sectionRef}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      <div className="gdash-container">
        <motion.div className="gdash-header" variants={titleVariants}>
          <h2 className="gdash-title">Geometry Dash — Interactive Mini‑Game</h2>
          <p className="gdash-sub">Performance‑tuned, with VFX and crisp controls</p>
        </motion.div>
        <div className="gdash-stage">
          <canvas ref={canvasRef} className="gdash-canvas" aria-label="Geometry Dash Canvas" />
          {phase !== 'running' && (
            <div ref={overlayRef} className={`gdash-overlay show ${phase}`}>
              {phase === 'start' && (
                <div className="gdash-menu">
                  <div className="gdash-title-mini">Geometry Dash</div>
                  <div className="gdash-desc">Click or Space to jump. Choose options and start.</div>
                  <div className="menu-grid">
                    <div className="menu-group">
                      <div className="group-title">Difficulty</div>
                      <div className="group-row">
                        <button className={`gdash-btn ${difficulty === 'easy' ? 'active' : ''}`} onClick={() => setDifficulty('easy')}>Easy</button>
                        <button className={`gdash-btn ${difficulty === 'normal' ? 'active' : ''}`} onClick={() => setDifficulty('normal')}>Normal</button>
                        <button className={`gdash-btn ${difficulty === 'hard' ? 'active' : ''}`} onClick={() => setDifficulty('hard')}>Hard</button>
                      </div>
                    </div>
                    <div className="menu-group">
                      <div className="group-title">Player</div>
                      <div className="group-row gdash-skins">
                        <button className={`gdash-color ${color === 'cyan' ? 'active' : ''}`} onClick={() => { setColor('cyan'); localStorage.setItem('gdash_color','cyan') }}>Cyan</button>
                        <button className={`gdash-color ${color === 'magenta' ? 'active' : ''}`} onClick={() => { setColor('magenta'); localStorage.setItem('gdash_color','magenta') }}>Magenta</button>
                        <button className={`gdash-color ${color === 'yellow' ? 'active' : ''}`} onClick={() => { setColor('yellow'); localStorage.setItem('gdash_color','yellow') }}>Yellow</button>
                        <button className={`gdash-color ${color === 'green' ? 'active' : ''}`} onClick={() => { setColor('green'); localStorage.setItem('gdash_color','green') }}>Green</button>
                      </div>
                    </div>
                    <div className="menu-group">
                      <div className="group-title">Graphics</div>
                      <div className="group-row gdash-vfx">
                        <button className={`gdash-color ${vfx === 'high' ? 'active' : ''}`} onClick={() => { setVfx('high'); localStorage.setItem('gdash_vfx','high') }}>High</button>
                        <button className={`gdash-color ${vfx === 'medium' ? 'active' : ''}`} onClick={() => { setVfx('medium'); localStorage.setItem('gdash_vfx','medium') }}>Medium</button>
                        <button className={`gdash-color ${vfx === 'low' ? 'active' : ''}`} onClick={() => { setVfx('low'); localStorage.setItem('gdash_vfx','low') }}>Low</button>
                      </div>
                    </div>
                  </div>
                  <div className="menu-actions">
                    <button className="gdash-btn primary" onClick={() => stateRef.current.restart && stateRef.current.restart()}>Start</button>
                    <button className="gdash-btn" onClick={() => { const v = !soundOn; setSoundOn(v); localStorage.setItem('gdash_sound', v ? 'on' : 'off') }}>{soundOn ? 'Sound: On' : 'Sound: Off'}</button>
                  </div>
                  <div className="menu-help">Space/Click to jump • P pause • Esc menu</div>
                </div>
              )}
          {phase === 'paused' && (
            <div className="gdash-banner">
              <div className="gdash-text">Paused</div>
              <div className="gdash-actions">
                <button className="gdash-btn" onClick={() => { stateRef.current && (stateRef.current.last = performance.now()); setPhase('running'); }}>Resume</button>
                <button className="gdash-btn" onClick={() => setPhase('start')}>Menu</button>
              </div>
            </div>
          )}
          {phase === 'gameover' && (
            <div className="gdash-banner">
              <div className="gdash-text">Game Over</div>
              <div className="gdash-desc">Best({difficulty}): {Number(localStorage.getItem(`gdash_best_${difficulty}`)||0)}</div>
              <div className="gdash-actions">
                <button className="gdash-btn" onClick={() => stateRef.current.restart && stateRef.current.restart()}>Restart</button>
                <button className="gdash-btn" onClick={() => setPhase('start')}>Menu</button>
              </div>
            </div>
          )}
        </div>
      )}
      {phase === 'running' && (
        <div className="gdash-hud">
          <div className="gdash-pill">{difficulty}</div>
          <button className="gdash-pause" onClick={() => { setPhase('paused'); stateRef.current && (stateRef.current.last = performance.now()); }}>Pause</button>
          <button className="gdash-jump" onClick={() => stateRef.current.jump && stateRef.current.jump()}>Jump</button>
          <button className="gdash-sound" onClick={() => { const v = !soundOn; setSoundOn(v); localStorage.setItem('gdash_sound', v ? 'on' : 'off') }}>{soundOn ? 'Sound: On' : 'Sound: Off'}</button>
          {stateRef.current && (
            <div className="gdash-badges">
              {stateRef.current.shieldActive && <div className="badge shield">Shield</div>}
              {stateRef.current.combo && stateRef.current.combo > 0 && <div className="badge combo">x{Math.min(9, Math.floor(stateRef.current.combo))}</div>}
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      <div className="section-bg" aria-hidden="true">
        <div className="circuit-pattern"></div>
        <div className="scan-grid"></div>
      </div>
    </motion.section>
  )
}

export default GeometryDash