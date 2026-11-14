import Link from "next/link"
import { ArrowLeft, Check, Flame, Gauge, ShieldCheck, Sparkles } from "lucide-react"

const mechanics = [
  {
    icon: Check,
    number: "01",
    title: "Check in daily",
    copy: "Register a testnet wallet and make one check-in per 24-hour day to keep the community streak alive.",
  },
  {
    icon: Gauge,
    number: "02",
    title: "Build momentum",
    copy: "Every check-in moves the community closer to the shared daily target of 5 check-ins every 24 hours.",
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "Earn together",
    copy: "When target 5 is reached, 0.5% leaves the emission pool: 90% is shared among checkers, and 10% enters the treasury.",
  },
  {
    icon: Flame,
    number: "04",
    title: "Miss the target",
    copy: "If the community misses target 5, 5% of the treasury burns and the streak resets to 0. No new tokens are minted.",
  },
]

export default function MechanicPage() {
  return (
    <main className="page-shell mechanic-page">
      <video className="background-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="video-overlay" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span></div>
      <div className="noise" />
      <header className="topbar">
        <Link className="back-link" href="/"><ArrowLeft /> BACK TO $CROC</Link>
        <span className="network"><span className="live-dot" />NEAR TESTNET</span>
      </header>
      <section className="mechanic-hero">
        <span className="eyebrow"><span /> THE MECHANIC</span>
        <h1>SHOW UP.<br /><span>GET REWARDED.</span></h1>
        <p>The $CROC streak engine is simple: target 5, 24-hour days, shared momentum, and a 5% treasury burn when the target is missed.</p>
      </section>
      <section className="mechanic-grid" aria-label="How the $CROC mechanic works">
        {mechanics.map(({ icon: Icon, number, title, copy }) => (
          <article className="mechanic-card" key={number}>
            <div className="mechanic-card-top"><span>{number}</span><Icon /></div>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
      <div className="mechanic-note">
        <Sparkles />
        <span>Milestones at streaks 7, 15, 25, 100 move 1%, 1.5%, 2.5%, 5% of treasury to escrow (paid once each, moved not minted).</span>
      </div>
      <footer className="site-footer">
        <span>$CROC / THE MECHANIC</span>
        <span>Testnet only. Not audited. No price shown.</span>
      </footer>
    </main>
  )
}
