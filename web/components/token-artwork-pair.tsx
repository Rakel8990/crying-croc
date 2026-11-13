"use client"

import { motion, useReducedMotion } from "framer-motion"

const tokenArtworks = [
  {
    symbol: "$NEAR",
    source:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/7ceec335-5782-4296-8bbd-0739b7b8468e-removebg-preview-KmsG1OphjwcdLEOp8sLDLJ9i93vOEv.png",
    description: "Glass NEAR arrow token on an emerald diamond",
  },
  {
    symbol: "$CROC",
    source:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1ebcaac1-4519-4653-b756-1c2cce9cbf5d-removebg-preview%20%281%29-GbuI3sYnfnJAPUZMyJfU0YYBJQDLzp.png",
    description: "Glass crocodile mascot on an emerald diamond",
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
                  y: [0, -7, 0],
                  rotateY: index === 0 ? [-2, 2, -2] : [2, -2, 2],
                  rotateZ: index === 0 ? [-0.8, 0.8, -0.8] : [0.8, -0.8, 0.8],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                  rotateY: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                  rotateZ: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                }
          }
          whileHover={prefersReducedMotion ? undefined : { scale: 1.04, rotateY: index === 0 ? 5 : -5 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <motion.img
            src={token.source}
            alt={`${token.symbol} token: ${token.description}`}
            className="token-art-image"
            loading="eager"
            draggable={false}
          />
        </motion.figure>
      ))}
    </div>
  )
}
