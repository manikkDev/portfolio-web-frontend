import React, { useCallback, useEffect, useRef, useState } from 'react'
import './GameIntro.css'

/**
 * Site intro: a HUD and title in HTML over the shared 3D world (src/world), which App
 * owns and passes in as `world`. When the intro ends, that same world becomes the hero's
 * background, so there is no cut between the two.
 *
 * Phases: boot (assets load, log types out) -> reveal (world fades in, gamepad
 * materialises) -> ready (waiting for the player) -> launch (the flight into the hero
 * begins) -> out (the interface fades while the page fades in and the flight finishes).
 * If the 3D world is unavailable the same sequence runs over a CSS backdrop.
 */

const TITLE = 'MANIK-DEV'
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&/<>*+'
const MIN_BOOT_MS = 1700 // long enough to read the log even when assets are cached
const AUTO_START_MS = 7000 // nobody gets stuck on the intro
const EXIT_MS = 500

// Arrow keys and WASD play with the D-pad; these light the face buttons.
const KEY_TO_CONTROL = {
  ArrowUp: 'Dpad_Up', KeyW: 'Dpad_Up',
  ArrowDown: 'Dpad_Down', KeyS: 'Dpad_Down',
  ArrowLeft: 'Dpad_Left', KeyA: 'Dpad_Left',
  ArrowRight: 'Dpad_Right', KeyD: 'Dpad_Right',
  KeyJ: 'Btn_X', KeyK: 'Btn_A', KeyL: 'Btn_B', KeyI: 'Btn_Y',
}
const START_KEYS = new Set(['Enter', 'Space', 'NumpadEnter'])

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Returns `text`, decoding left to right out of random glyphs once `active` turns true. */
function useScramble(text, active, duration = 1100) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!active) return undefined
    const started = performance.now()
    const id = setInterval(() => {
      const done = Math.min(1, (performance.now() - started) / duration)
      const solved = Math.floor(done * text.length)
      setOut(
        [...text]
          .map((ch, i) => (i < solved || ch === '-' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      )
      if (done === 1) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [text, active, duration])
  return out
}

export default function GameIntro({ world, onLeave, onEnter }) {
  const scene = world.scene
  const loading = world.status === 'loading'
  const has3D = world.status === 'ready'

  const mountedAt = useRef(performance.now())
  const sceneRef = useRef(scene)
  const readoutRef = useRef(null)
  const startRef = useRef(null)
  const phaseRef = useRef('boot')
  // Kept in refs so new props from the parent never restart the sequence.
  const onEnterRef = useRef(onEnter)
  const onLeaveRef = useRef(onLeave)
  useEffect(() => {
    onEnterRef.current = onEnter
    onLeaveRef.current = onLeave
    sceneRef.current = scene
  })

  const [phase, setPhaseState] = useState('boot')
  const [logLines, setLogLines] = useState(1)
  const [gamepad, setGamepad] = useState(false)
  const [inputs, setInputs] = useState(0) // bumps on key presses to restart the auto-start timer

  const setPhase = useCallback((next) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const title = useScramble(TITLE, phase !== 'boot')

  // Hands the world to the hero and fades the intro out while the page fades in under it
  // (onLeave); onEnter then removes the intro. Works from any phase (skip).
  const finish = useCallback(() => {
    if (phaseRef.current === 'out') return
    sceneRef.current?.enterHero()
    setPhase('out')
    onLeaveRef.current?.()
    setTimeout(() => onEnterRef.current?.(), EXIT_MS)
  }, [setPhase])

  const start = useCallback(async () => {
    if (phaseRef.current !== 'ready') return
    setPhase('launch')
    await (sceneRef.current ? sceneRef.current.launch() : wait(1250))
    finish()
  }, [finish, setPhase])

  // Once the world has loaded (or failed), run boot -> reveal -> ready.
  useEffect(() => {
    if (loading) return undefined
    let cancelled = false
    const run = async () => {
      await wait(Math.max(0, MIN_BOOT_MS - (performance.now() - mountedAt.current)))
      if (cancelled || phaseRef.current !== 'boot') return
      setPhase('reveal')
      await (scene ? scene.reveal() : wait(1600))
      if (cancelled || phaseRef.current !== 'reveal') return
      setPhase('ready')
    }
    run()
    return () => {
      cancelled = true
    }
  }, [loading, scene, setPhase])

  // A real controller can start the intro too.
  useEffect(() => {
    if (!scene) return undefined
    scene.onGamepadButton = () => start()
    return () => {
      scene.onGamepadButton = null
    }
  }, [scene, start])

  // Boot log types out one line at a time.
  useEffect(() => {
    if (logLines >= 5) return undefined
    const id = setTimeout(() => setLogLines((n) => n + 1), 330)
    return () => clearTimeout(id)
  }, [logLines])

  // The page behind must not scroll while the intro is up.
  useEffect(() => {
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = overflow
    }
  }, [])

  // Keyboard: Enter/Space start, Escape skips, arrows/WASD and IJKL play with the gamepad.
  useEffect(() => {
    const onKey = (e) => {
      const down = e.type === 'keydown'
      const control = KEY_TO_CONTROL[e.code]
      if (control) {
        e.preventDefault()
        sceneRef.current?.press(control, down)
        if (down && !e.repeat) setInputs((n) => n + 1)
        return
      }
      if (!down || e.repeat) return
      if (e.code === 'Escape') finish()
      else if (START_KEYS.has(e.code)) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [finish, start])

  // Auto-start so the intro never blocks anyone; playing with the keys restarts the wait.
  useEffect(() => {
    if (phase !== 'ready') return undefined
    startRef.current?.focus({ preventScroll: true })
    const id = setTimeout(start, AUTO_START_MS)
    return () => clearTimeout(id)
  }, [phase, inputs, start])

  useEffect(() => {
    const sync = () => setGamepad(Boolean(navigator.getGamepads?.().some((g) => g?.connected)))
    window.addEventListener('gamepadconnected', sync)
    window.addEventListener('gamepaddisconnected', sync)
    return () => {
      window.removeEventListener('gamepadconnected', sync)
      window.removeEventListener('gamepaddisconnected', sync)
    }
  }, [])

  const onPointerMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -((e.clientY / window.innerHeight) * 2 - 1)
    sceneRef.current?.setPointer(x, y)
    if (readoutRef.current) {
      readoutRef.current.textContent = `X ${x >= 0 ? '+' : ''}${x.toFixed(2)}  Y ${y >= 0 ? '+' : ''}${y.toFixed(2)}`
    }
  }

  const percent = Math.round(world.progress * 100)
  const log = [
    'BOOT MANIK-DEV // PORTFOLIO.SYS',
    `RENDER CORE ${'.'.repeat(9)} ${loading || has3D ? 'WEBGL' : 'FLAT'}`,
    `LOADING ASSETS ${'.'.repeat(6)} ${String(percent).padStart(3, '0')}%`,
    'INPUT: KEYS / MOUSE / TOUCH / GAMEPAD',
    phase === 'boot' ? 'LINKING ...' : 'LINK ESTABLISHED',
  ].slice(0, logLines)

  return (
    <div
      className={`gi${has3D ? ' gi--3d' : ''}${!loading && !has3D ? ' gi--flat' : ''}`}
      data-phase={phase}
      role="dialog"
      aria-label="Intro. Press Enter to start or Escape to skip."
      onPointerMove={onPointerMove}
      onClick={start}
    >
      <div className="gi-backdrop" aria-hidden="true" />
      <div className="gi-scan" aria-hidden="true" />

      <div className="gi-hud">
        <span className="gi-corner gi-corner--tl" aria-hidden="true" />
        <span className="gi-corner gi-corner--tr" aria-hidden="true" />
        <span className="gi-corner gi-corner--bl" aria-hidden="true" />
        <span className="gi-corner gi-corner--br" aria-hidden="true" />

        <div className="gi-top">
          <p className="gi-tag">
            <span className="gi-dot" aria-hidden="true" /> MANIK-DEV <span className="gi-dim">// PORTFOLIO.SYS</span>
          </p>
          <button
            type="button"
            className="gi-skip"
            onClick={(e) => {
              e.stopPropagation()
              finish()
            }}
          >
            SKIP <span aria-hidden="true">▸▸</span>
          </button>
        </div>

        <ul className="gi-log" aria-hidden="true">
          {log.map((line) => (
            <li key={line.slice(0, 12)}>{line}</li>
          ))}
        </ul>

        <p className="gi-readout" aria-hidden="true">
          <span ref={readoutRef}>X +0.00  Y +0.00</span>
          <span className={gamepad ? 'gi-on' : ''}>GAMEPAD {gamepad ? 'LINKED' : 'NOT FOUND'}</span>
        </p>
      </div>

      <div className="gi-ui">
        <div className="gi-center">
          <p className="gi-kicker">WELCOME, PLAYER ONE</p>
          <p className="gi-title" data-text={title || TITLE} aria-label={TITLE}>
            {title || ' '}
          </p>
          <p className="gi-roles">GAME DEVELOPER <i>/</i> FULL STACK <i>/</i> CREATOR</p>
        </div>

        <div className="gi-bottom">
          <div className="gi-loader" role="progressbar" aria-label="Loading" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className="gi-loader-bar">
              <span style={{ transform: `scaleX(${world.progress})` }} />
            </div>
            <p>
              <span>INITIALIZING</span>
              <span>{String(percent).padStart(3, '0')}%</span>
            </p>
          </div>

          <div className="gi-start-wrap">
            <button
              type="button"
              className="gi-start"
              ref={startRef}
              tabIndex={phase === 'ready' ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation()
                start()
              }}
            >
              <span aria-hidden="true">▶</span> PRESS START
            </button>
            <p className="gi-hint">
              <span className="gi-hint-desktop">
                ENTER / CLICK<span className="gi-hint-pad"> &nbsp;·&nbsp; ARROWS + IJKL PLAY THE PAD</span>
              </span>
              <span className="gi-hint-touch">TAP ANYWHERE</span>
            </p>
            <span key={inputs} className="gi-auto" aria-hidden="true" style={{ animationDuration: `${AUTO_START_MS}ms` }} />
          </div>
        </div>
      </div>

      <div className="gi-flash" aria-hidden="true" />
    </div>
  )
}
