"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

export function HomeOutro() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isComplete, setIsComplete] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    if (prefersReducedMotion) {
      setIsComplete(true)
      return
    }

    let started = false
    const startVideo = () => {
      if (started) return
      started = true
      void video.play().catch(() => setIsComplete(true))
    }

    if (!("IntersectionObserver" in window)) {
      startVideo()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startVideo()
      },
      { threshold: 0.35 },
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  return (
    <section className="home-outro" ref={sectionRef} aria-labelledby="home-outro-heading">
      <h2 id="home-outro-heading" className="sr-only">The CRYCODILE story continues</h2>
      <div className="home-outro-frame">
        <video
          ref={videoRef}
          className="home-outro-video"
          src="https://files.catbox.moe/m10av1.mp4"
          muted
          playsInline
          preload="metadata"
          controls
          aria-label="CRYCODILE story outro"
          onEnded={() => setIsComplete(true)}
          onError={() => setIsComplete(true)}
        />
      </div>

      {isComplete && (
        <motion.nav
          className="home-outro-actions"
          aria-label="Explore CRYCODILE"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <Link className="home-outro-link" href="/">Home</Link>
          <Link className="home-outro-link" href="/check-in">Check In</Link>
          <Link className="home-outro-link" href="/protocol-stats">Stats</Link>
        </motion.nav>
      )}
    </section>
  )
}
