import Link from "next/link"
import { ArrowRight, BarChart3, Check, CircleDollarSign, ShieldCheck, Wallet } from "lucide-react"
import { StoryExperience } from "./story/story-experience"

const parameters = [
  ["Maximum supply", "1B CROC"],
  ["Initial treasury", "300M CROC"],
  ["Target", "Daily"],
  ["Presale", "None"],
  ["Team allocation", "None"],
]

const mechanics = [
  ["01", "Show up", "One daily check-in proves your wallet is part of the community."],
  ["02", "Hit the target", "The daily target turns individual participation into shared momentum."],
  ["03", "Share the outcome", "Successful days reward active checkers. Failed days burn the treasury."],
]

export default function Home() {
  return (
    <main>
      <div className="video-overlay" /><div className="noise" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span></div>
      <video className="background-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark">C</span><span>CRYING <em>CROC</em></span></Link>
          <nav className="nav" aria-label="Main navigation"><Link className="active" href="/">Home</Link><Link href="#story">The Story</Link><Link href="/check-in">Check In</Link><Link href="/protocol-stats">Protocol Stats</Link></nav>
          <div className="header-actions"><span className="network"><span className="live-dot" />NEAR TESTNET</span><button className="connect-btn"><Wallet />Connect Wallet</button></div>
        </header>
        <section className="hero"><div className="hero-copy"><span className="eyebrow"><span /> COMMUNITY TOKEN EXPERIMENT</span><h1>$CROC<br /><span>ON NEAR.</span></h1><p>One community. One daily target. Every check-in counts.</p><p className="card-description">Crying Croc is a community-powered token experiment built around daily participation. Show up, reach the target, and share in the rewards. Miss the target, and the treasury takes a hit.</p><div className="hero-actions"><Link className="button" href="/check-in">Enter the Check-In <ArrowRight /></Link><Link className="button secondary" href="/protocol-stats">Explore Protocol Stats <BarChart3 /></Link></div></div></section>
        <StoryExperience />
        <section className="parameter-strip" aria-label="Protocol parameters">{parameters.map(([label, value]) => <div className="parameter" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section>
        <section className="section"><div className="section-heading"><div><span className="section-kicker">THE DAILY LOOP</span><h2>Participation is<br /><span>the protocol.</span></h2></div><span className="preview-label"><span className="live-dot" />Preview Data</span></div><div className="card-grid">{mechanics.map(([number, title, copy]) => <article className="info-card" key={number}><span className="index">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
        <footer className="site-footer"><span>$CROC / NEAR</span><span>Frontend preview — contract data coming later</span></footer>
      </div>
    </main>
  )
}
