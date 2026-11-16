import Link from "next/link"
import { Wallet } from "lucide-react"
import { StoryExperience } from "./story/story-experience"
import { TokenArtworkPair } from "../components/token-artwork-pair"

export default function Home() {
  return (
    <main>
      <div className="video-overlay" /><div className="noise" />
      <video className="background-video" src="https://files.catbox.moe/ef0gmt.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark"><img src="https://files.catbox.moe/n14ikl.jpg" alt="" /></span><span>CRYCODILE</span></Link>
          <nav className="nav" aria-label="Main navigation"><Link className="active" href="/">Home</Link><Link href="/check-in">Check In</Link><Link href="/protocol-stats">Protocol Stats</Link></nav>
          <div className="header-actions"><span className="network"><span className="live-dot" />NEAR TESTNET</span><Link className="connect-btn" href="/check-in"><Wallet />Connect Wallet</Link></div>
        </header>
        <section className="hero"><div className="hero-copy hero-copy-with-icons"><div className="hero-with-icons"><h1>$CROC<br /><span>ON NEAR.</span></h1><TokenArtworkPair /></div><p>One community. One daily target. Every check-in counts.</p><p className="card-description">Crying Croc ($CROC) is a community-powered memecoin experiment built on NEAR for the 2026 NEAR Hackathon. It puts a simple question to the test: what if a community didn&apos;t just support a memecoin, but actually shaped how it works?</p></div></section>
        <StoryExperience />
      </div>
    </main>
  )
}
