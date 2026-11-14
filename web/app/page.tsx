import Link from "next/link"
import { Wallet } from "lucide-react"
import { StoryExperience } from "./story/story-experience"
import { TokenArtworkPair } from "../components/token-artwork-pair"

export default function Home() {
  return (
    <main>
      <div className="video-overlay" /><div className="noise" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span></div>
      <video className="background-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark">C</span><span>CRYING <em>CROC</em></span></Link>
          <nav className="nav" aria-label="Main navigation"><Link className="active" href="/">Home</Link><Link href="/check-in">Check In</Link><Link href="/protocol-stats">Protocol Stats</Link></nav>
          <div className="header-actions"><span className="network"><span className="live-dot" />NEAR TESTNET</span><Link className="connect-btn" href="/check-in"><Wallet />How to Check In</Link></div>
        </header>
        <section className="hero"><div className="hero-copy hero-copy-with-icons"><div className="hero-with-icons"><h1>$CROC<br /><span>ON NEAR.</span></h1><TokenArtworkPair /></div><p>One community. One daily target. Every check-in counts.</p><p className="card-description">Crying Croc is a community-powered token experiment built around daily participation. Show up, reach target 5, and share in the rewards. Miss the target, and 5% of the treasury is burned.</p></div></section>
        <StoryExperience />
        <footer className="site-footer"><span>$CROC / NEAR TESTNET</span><span>Testnet only. Not audited. No price shown.</span></footer>
      </div>
    </main>
  )
}
