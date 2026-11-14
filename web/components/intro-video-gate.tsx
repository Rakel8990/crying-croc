"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

type IntroPhase = "loading" | "playing" | "revealing" | "done"

export function IntroVideoGate({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasFinished = useRef(false)
  const [phase, setPhase] = useState<IntroPhase>("loading")
  const prefersReducedMotion = useReducedMotion()

  const finishIntro = useCallback(() => {
    if (hasFinished.current) return
    hasFinished.current = true
    videoRef.current?.pause()
    setPhase("done")
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      finishIntro()
      return
    }

    if (phase !== "loading") return

    const fallback = window.setTimeout(finishIntro, 9000)
    return () => window.clearTimeout(fallback)
  }, [finishIntro, phase, prefersReducedMotion])

  useEffect(() => {
    if (phase === "done") return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [phase])

  const beginPlayback = () => {
    if (hasFinished.current || prefersReducedMotion) {
      finishIntro()
      return
    }

    const video = videoRef.current
    if (!video) {
      finishIntro()
      return
    }

    void video.play().catch(finishIntro)
  }

  const contentOpacity = {
    loading: 0.82,
    playing: 0,
    revealing: 0.64,
    done: 1,
  }[phase]
  const blurOpacity = {
    loading: 0.32,
    playing: 0,
    revealing: 1,
    done: 0,
  }[phase]
  const videoOpacity = {
    loading: 0,
    playing: 1,
    revealing: 0.46,
    done: 0,
  }[phase]

  return (
    <div className="intro-gate">
      <motion.div
        className="intro-gate-content"
        animate={{ opacity: contentOpacity }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
      >
        {children}
      </motion.div>

      <motion.div
        className="intro-gate-blur"
        aria-hidden="true"
        animate={{ opacity: blurOpacity }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
      />

      <motion.video
        ref={videoRef}
        className="intro-gate-video"
        src="https://files.catbox.moe/ef0gmt.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlay={beginPlayback}
        onPlaying={() => {
          if (!hasFinished.current) setPhase("playing")
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          if (
            phase === "playing" &&
            Number.isFinite(video.duration) &&
            video.duration - video.currentTime <= 1.4
          ) {
            setPhase("revealing")
          }
        }}
        onEnded={finishIntro}
        onError={finishIntro}
        animate={{ opacity: videoOpacity }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
      />

      {(phase === "playing" || phase === "revealing") && (
        <button className="intro-gate-skip" type="button" onClick={finishIntro}>
          Skip intro
        </button>
      )}
    </div>
  )
}
