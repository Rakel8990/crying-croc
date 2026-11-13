"use client"

import { motion, useReducedMotion } from "framer-motion"

const tokenArtworks = [
  {
    symbol: "$NEAR",
    source:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ikKtf7XkrQMylrr6knAHiLD6pqeLy3.png",
    description: "Translucent NEAR arrow logo on a glowing emerald glass tile",
  },
  {
    symbol: "$CROC",
    source:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-f8vEQRdb9svNwYZmWrXqx7AORNSWkO.png",
    description: "Glass crocodile mascot embossed on a luminous emerald tile",
  },
]

export function TokenArtworkPair() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="token-showcase" role="group" aria-label="NEAR and CROC tokens">
      {tokenArtworks.map((token, index) => (
        <motion.figure
          key={token.symbol}
          className="token-art"
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -4, 0],
                  rotateZ: index === 0 ? [-0.55, 0.55, -0.55] : [0.55, -0.55, 0.55],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  y: { duration: 6 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                  rotateZ: { duration: 8 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                }
          }
          whileHover={prefersReducedMotion ? undefined : { scale: 1.04, rotateY: index === 0 ? 5 : -5 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <span aria-hidden="true" className="token-art-glow" />
          <motion.img
            src={token.source}
            alt={`${token.symbol} token: ${token.description}`}
            className="token-art-image"
            loading="eager"
            draggable={false}
          />
          <span aria-hidden="true" className="token-art-glint" />
        </motion.figure>
      ))}
    </div>
  )
}
