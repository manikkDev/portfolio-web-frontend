import { useEffect, useState } from 'react'

/**
 * Loads the 3D world (worldScene.js) into `stageRef` and reports on it:
 *   { status: 'loading' | 'ready' | 'failed' | 'off', scene, progress }
 *
 * 'off' means it was never attempted (the visitor asked for reduced motion); 'failed' means
 * WebGL is not available. In both cases the page keeps its normal CSS background.
 *
 * With the intro, loading starts at once. Without it, loading waits until the browser is
 * idle so the hero's text and picture paint first.
 */
export function useWorld(stageRef, startInIntro) {
  const [world, setWorld] = useState({ status: 'loading', scene: null, progress: 0 })

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWorld({ status: 'off', scene: null, progress: 1 })
      return
    }

    let cancelled = false
    let scene = null
    const low =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4

    const load = async () => {
      if (cancelled) return
      try {
        const { createWorld } = await import('./worldScene.js')
        if (cancelled) return
        scene = await createWorld(stageRef.current, {
          low,
          mode: startInIntro ? 'intro' : 'hero',
          onProgress: (progress) => !cancelled && setWorld((w) => ({ ...w, progress })),
        })
        if (cancelled) return scene.dispose()
        setWorld({ status: 'ready', scene, progress: 1 })
      } catch (err) {
        console.warn('3D world unavailable, using the flat background.', err)
        if (!cancelled) setWorld({ status: 'failed', scene: null, progress: 1 })
      }
    }

    let idle
    if (startInIntro) load()
    else if (window.requestIdleCallback) idle = window.requestIdleCallback(load, { timeout: 1500 })
    else idle = setTimeout(load, 300)

    return () => {
      cancelled = true
      if (window.cancelIdleCallback && idle) window.cancelIdleCallback(idle)
      clearTimeout(idle)
      scene?.dispose()
    }
    // Runs once: the world outlives the intro and belongs to the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return world
}
