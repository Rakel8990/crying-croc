"use client"

import { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

interface TokenFlipCardProps {
  symbol: string
  tokenName: string
  frontImage: string
  frontAlt: string
  description: string
}

export function TokenFlipCard({
  symbol,
  tokenName,
  frontImage,
  frontAlt,
  description,
}: TokenFlipCardProps) {
  const [clickedFlipped, setClickedFlipped] = useState(false)
  const [hovered, setHovered] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const showBack = clickedFlipped || hovered
  const circuitId = `circuit-${tokenName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  return (
    <motion.button
      type="button"
      aria-label={`Flip ${tokenName} token`}
      aria-pressed={clickedFlipped}
      onClick={() => setClickedFlipped((current) => !current)}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.025 }}
      className="group relative block aspect-square w-[clamp(7.5rem,17vw,16rem)] min-w-[9rem] flex-none border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-4 focus-visible:ring-offset-zinc-950"
      style={{ perspective: "1000px", WebkitTapHighlightColor: "transparent" }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-5 -z-10 rounded-full bg-emerald-500/20 blur-3xl"
        animate={{ opacity: hovered ? 0.9 : 0.45, scale: hovered ? 1.18 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
      />

      <motion.span
        className="relative block h-full w-full rounded-[2rem]"
        animate={{
          rotateY: showBack ? 180 : 0,
          ...(prefersReducedMotion ? {} : { y: [0, -3, 0], rotateZ: [-0.4, 0.4, -0.4] }),
        }}
        transition={{
          rotateY: { duration: prefersReducedMotion ? 0.01 : 0.85, ease: "easeInOut" },
          ...(prefersReducedMotion
            ? {}
            : {
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                rotateZ: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              }),
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <span
          aria-hidden={showBack}
          className="absolute inset-0 isolate overflow-hidden rounded-[2rem] border border-emerald-200/25 bg-gradient-to-br from-emerald-100/[0.08] via-zinc-950/90 to-zinc-950/95 p-3 shadow-[0_22px_75px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="absolute inset-3 rounded-[1.55rem] border border-white/10 bg-[radial-gradient(circle_at_50%_12%,rgba(16,185,129,0.2),transparent_58%)]" />
          <span
            className="absolute inset-3 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(90deg,rgba(52,211,153,.13) 1px,transparent 1px),linear-gradient(rgba(52,211,153,.13) 1px,transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage: "linear-gradient(to bottom,black,transparent 82%)",
            }}
          />
          <img
            src={frontImage}
            alt={frontAlt}
            className="relative z-10 h-full w-full rounded-[1.55rem] object-contain mix-blend-screen drop-shadow-[0_0_26px_rgba(16,185,129,0.26)]"
          />
          <span className="absolute inset-x-3 bottom-3 z-20 flex items-end justify-between rounded-b-[1.4rem] bg-gradient-to-t from-zinc-950/95 via-zinc-950/55 to-transparent px-5 pb-5 pt-14">
            <span className="text-xl font-semibold tracking-tight text-white">{symbol}</span>
            <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-emerald-200/75">NEAR</span>
          </span>
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-[-25%] left-[-65%] z-30 w-1/2 rotate-[22deg] bg-gradient-to-r from-transparent via-white/45 to-transparent blur-[2px]"
            animate={hovered && !prefersReducedMotion ? { x: ["0%", "300%"], opacity: [0, 0.9, 0] } : { x: "0%", opacity: 0 }}
            transition={{ duration: 1.15, ease: "easeInOut" }}
          />
        </span>

        <span
          aria-hidden={!showBack}
          className="absolute inset-0 isolate overflow-hidden rounded-[2rem] border border-emerald-300/35 bg-zinc-950 p-5 shadow-[0_22px_80px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.16)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundImage:
              "radial-gradient(circle_at_50%_0%,rgba(16,185,129,.22),transparent_48%),linear-gradient(145deg,#181d1a,#090b0a 56%,#111815)",
          }}
        >
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 256 256" preserveAspectRatio="none">
            <defs>
              <pattern id={circuitId} width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M0 16h9v-9h9v9h14M16 0v7m0 18v7M0 30h7v-9h9" fill="none" stroke="rgba(52,211,153,.55)" strokeWidth=".7" />
                <circle cx="9" cy="7" r="1.5" fill="rgba(110,231,183,.85)" />
                <circle cx="16" cy="21" r="1.5" fill="rgba(110,231,183,.65)" />
              </pattern>
            </defs>
            <rect width="256" height="256" fill={`url(#${circuitId})`} />
          </svg>
          <span className="absolute inset-3 rounded-[1.5rem] border border-emerald-100/15" />
          <span className="absolute inset-x-0 top-8 text-center text-[9px] font-medium uppercase tracking-[0.24em] text-emerald-200/65">TOKEN • NEAR</span>
          <span className="relative z-10 flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl font-semibold tracking-[-0.06em] text-emerald-200 drop-shadow-[0_0_20px_rgba(16,185,129,0.42)]">{symbol}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-100">{tokenName}</span>
            <span className="max-w-[15rem] text-xs leading-relaxed text-zinc-400">{description}</span>
            <span className="mt-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-emerald-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              On-chain ecosystem
            </span>
          </span>
        </span>
      </motion.span>

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-2 z-40 grid h-6 w-6 place-items-center rounded-full border border-emerald-200/25 bg-zinc-900 text-[10px] text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.7 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      >
        ↻
      </motion.span>
    </motion.button>
  )
}
