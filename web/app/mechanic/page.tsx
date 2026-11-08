import Link from "next/link"
import { ArrowLeft, Check, Flame, Gauge, ShieldCheck, Sparkles } from "lucide-react"

const mechanics = [
  { icon: Check, number: "01", title: "Check in daily", copy: "Connect your wallet and make one simple daily check-in to keep your streak alive." },
  { icon: Gauge, number: "02", title: "Build momentum", copy: "Every consecutive check-in moves the community closer to the shared reward target." },
  { icon: ShieldCheck, number: "03", title: "Earn together", copy: "When the target is reached, active checkers receive fresh $CROC rewards." },
  { icon: Flame, number: "04", title: "Miss the target", copy: "If the community misses, 5% of the treasury burns and the streak resets." },
]

export default function MechanicPage() {
  return (
    <main className="page-shell mechanic-page">
      <video className="background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="https://files.catbox.moe/2pu9xu.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>NEAR</span><span>$CROC</span><span>NEAR</span><span>$CROC</span><span>NEAR</span></div>
      <div className="noise" />
      <header className="topbar">
        <Link className="back-link" href="/"><ArrowLeft /> BACK TO $CROC</Link>
        <span className="network"><span className="live-dot" />NEAR TESTNET</span>
      </header>
      <section className="mechanic-hero">
        <span className="eyebrow"><span /> THE MECHANIC</span>
        <h1>SHOW UP.<br /><span>GET REWARDED.</span></h1>
        <p>The $CROC streak engine is simple: daily proof, shared momentum, and a little pain when the community disappears.</p>
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
      <div className="mechanic-note"><Sparkles /><span>$CROC on NEAR. One streak. One community.</span></div>
    </main>
  )
}
