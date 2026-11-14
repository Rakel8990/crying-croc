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
          aria-label={`${token.symbol} token. ${token.description}.`}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: [0, -7, 0],
                  rotateZ: index === 0 ? [-0.8, 0.8, -0.8] : [0.8, -0.8, 0.8],
                }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  y: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                  rotateZ: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 },
                }
          }
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        >
          <motion.span
            className="token-art-flip"
            animate={prefersReducedMotion ? undefined : { rotateY: [0, 0, 180, 180, 360] }}
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    rotateY: {
                      duration: 5.4,
                      times: [0, 0.64815, 0.73148, 0.91667, 1],
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }
            }
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="token-art-face token-art-face--front" aria-hidden="true">
              <img
                src={token.source}
                alt=""
                className="token-art-image"
                loading="eager"
                draggable={false}
              />
            </span>
            <span className="token-art-face token-art-face--back" aria-hidden="true">
              <img
                src={token.source}
                alt=""
                className="token-art-image"
                loading="eager"
                draggable={false}
              />
            </span>
          </motion.span>
        </motion.figure>
      ))}
    </div>
  )
}
