import { Canvas, useFrame } from '@react-three/fiber'
import { Html, useProgress, Stars, Float, Text, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Glitch, Noise } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import React, { Suspense, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import './GameIntro.css'

// Custom loading screen
function Loader({ progress }) {
  return (
    <Html center>
      <div className="loader-container">
        <div className="loader-text">INITIALIZING SYSTEMS...</div>
        <div className="loader-bar-bg">
          <div className="loader-bar-fg" style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-percentage">{Math.round(progress)}%</div>
      </div>
    </Html>
  )
}

function SciFiRings() {
  const ringsRef = useRef()

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.x += delta * 0.1
      ringsRef.current.rotation.y += delta * 0.15
      ringsRef.current.rotation.z += delta * 0.05
    }
  })

  return (
    <group ref={ringsRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * (Math.PI / 3)]}>
          <torusGeometry args={[3 + i * 0.8, 0.02, 16, 100]} />
          <meshStandardMaterial emissive="#00ffff" emissiveIntensity={2} color="#00ffff" wireframe={true} />
        </mesh>
      ))}
    </group>
  )
}

function FloatingShapes() {
  const shapesRef = useRef()
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (shapesRef.current) {
      shapesRef.current.rotation.y = t * 0.2
    }
  })

  return (
    <group ref={shapesRef}>
      <Float speed={2} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[-4, 2, -5]}>
          <octahedronGeometry args={[1]} />
          <meshStandardMaterial color="#ff00ff" wireframe={true} emissive="#ff00ff" emissiveIntensity={1.5} />
        </mesh>
      </Float>
      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
        <mesh position={[4, -2, -3]}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#00ffff" wireframe={true} emissive="#00ffff" emissiveIntensity={1.5} />
        </mesh>
      </Float>
      <Float speed={2.5} rotationIntensity={2.5} floatIntensity={1.5}>
        <mesh position={[0, -4, -6]}>
          <icosahedronGeometry args={[1.2]} />
          <meshStandardMaterial color="#ffff00" wireframe={true} emissive="#ffff00" emissiveIntensity={1} />
        </mesh>
      </Float>
    </group>
  )
}

function Scene({ entering }) {
  return (
    <>
      <color attach="background" args={['#030510']} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      
      <SciFiRings />
      <FloatingShapes />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} />
        <ChromaticAberration offset={[0.002, 0.002]} />
        <Noise opacity={0.1} />
        {entering && <Glitch delay={[0, 0]} duration={[0.2, 0.4]} strength={[0.2, 0.4]} mode={GlitchMode.CONSTANT_MILD} />}
      </EffectComposer>
    </>
  )
}

export default function GameIntro({ onEnter }) {
  const { progress } = useProgress()
  const [loaded, setLoaded] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (progress === 100) {
      const t = setTimeout(() => setLoaded(true), 500)
      return () => clearTimeout(t)
    }
  }, [progress])

  const handleEnter = () => {
    setEntering(true)
    setTimeout(() => {
      onEnter()
    }, 800) // Delay to show glitch effect before unmounting
  }

  return (
    <div className="game-intro-container">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ powerPreference: "high-performance" }}>
        <Suspense fallback={<Loader progress={progress} />}>
          <Scene entering={entering} />
        </Suspense>
      </Canvas>

      <AnimatePresence>
        {loaded && !entering && (
          <motion.div 
            className="intro-ui"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
          >
            <div className="intro-title-wrapper">
              <h1 className="cyber-title" data-text="PORTFOLIO_OS">PORTFOLIO_OS</h1>
              <div className="cyber-subtitle">SYSTEM VERSION 1.0.0 // READY</div>
            </div>
            
            <button className="cyber-button" onClick={handleEnter}>
              <span className="btn-text">INITIALIZE SEQUENCE</span>
              <span className="btn-glitch"></span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="scanning-line"></div>
      <div className="vignette"></div>
    </div>
  )
}
