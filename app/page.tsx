"use client"

import { useState } from "react"
import { ArrowRight, Check, CircleDollarSign, Droplets, Flame, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from "lucide-react"

const steps = [
  { number: "01", title: "Check in daily", copy: "Show up and prove you are not a bot wallet.", icon: Check },
  { number: "02", title: "Earn together", copy: "When the target is met, fresh CROC is shared with the checkers.", icon: Sparkles },
  { number: "03", title: "Feel the burn", copy: "Miss the target and 5% of the treasury is burned. Streak reset.", icon: Flame },
]

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="stat"><span className="stat-label">{label}</span><strong>{value}</strong>{detail && <span className="stat-detail">{detail}</span>}</div>
}

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [streak, setStreak] = useState(0)
  const [pending, setPending] = useState(0)
  const [walletBalance, setWalletBalance] = useState(0)
  const [message, setMessage] = useState("")

  const checkIn = () => {
    if (!connected || checkedIn || checkingIn) return
    setCheckingIn(true); setMessage("")
    window.setTimeout(() => { setCheckingIn(false); setCheckedIn(true); setStreak((current) => current + 1); setPending(1500); setMessage("Success! Reward added to pending balance.") }, 1000)
  }

  const claim = () => {
    if (!connected || pending === 0 || checkingIn) return
    setCheckingIn(true); setMessage("")
    window.setTimeout(() => { setCheckingIn(false); setWalletBalance((current) => current + pending); setPending(0); setMessage("Rewards claimed!") }, 1000)
  }

  return <main className="page-shell">
    <video className="background-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
      <source src="https://files.catbox.moe/2pu9xu.mp4" type="video/mp4" />
    </video>
    <div className="video-overlay" />
    <div className="noise" />
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Crying Croc home"><span className="brand-mark">C</span><span>Crying <em>Croc</em></span></a>
      <div className="header-actions"><span className="network"><span className="live-dot" /> NEAR TESTNET</span><button className="connect-btn" onClick={() => { setConnected(true); setMessage("Wallet connected. You can check in now.") }}>{connected ? "Connected: 0x123...abcd" : "Connect Wallet"}<ArrowRight /></button></div>
    </header>

    <section className="hero" id="top">
      <div className="hero-copy"><div className="eyebrow"><span /> THE STREAK COIN</div><h1>Real tears.<br /><span>Real streaks.</span></h1><p>CROC rewards the wallets that show up. Check in every day, grow your streak, and cry together when the bots miss.</p><div className="hero-meta"><span><ShieldCheck /> No presale</span><span><LockKeyhole /> No team tokens</span></div></div>
      <div className="hero-art" aria-label="Crying crocodile mascot illustration"><div className="sun-glow" /><div className="crocodile"><div className="croc-eyes"><i /><i /></div><div className="croc-snout"><b /><b /></div><div className="tear tear-one" /><div className="tear tear-two" /></div><span className="art-label">$CROC / 2026</span></div>
    </section>

    <section className="checkin-card" aria-labelledby="checkin-title">
      <div className="card-top"><div><span className="section-kicker">THE CHECK-IN HUB</span><h2 id="checkin-title">Keep the streak alive.</h2></div><span className="live-pill"><span className="live-dot" /> LIVE</span></div>
      <div className="stats-grid"><Stat label="Total supply" value="300M" detail="CROC" /><Stat label="Current streak" value={String(streak)} detail="DAYS" /><Stat label="Wallet balance" value={walletBalance.toLocaleString()} detail="CROC" /><Stat label="Pending rewards" value={pending.toLocaleString()} detail="CROC" /></div>
      <div className="action-row"><button className="checkin-btn" disabled={!connected || checkedIn || checkingIn} onClick={checkIn}>{checkingIn ? <span className="spinner" /> : checkedIn ? <Check /> : <Droplets />}{checkingIn ? "Checking in..." : checkedIn ? "Already Checked In" : "Check In"}</button><button className="claim-btn" disabled={!connected || pending === 0 || checkingIn} onClick={claim}>{checkingIn ? "Processing..." : "Claim Rewards"}<CircleDollarSign /></button></div>
      <div className="status-row"><span className={message ? "success" : "muted"}>{message || (!connected ? "Connect Wallet First" : "Target: 5 checkers. You are #1.")}</span><span className="status-target"><span className="pulse" /> 4 / 5 checked in</span></div>
    </section>

    <section className="how-section"><div className="section-heading"><span className="section-kicker">THE MECHANIC</span><h2>Built for the ones<br /><span>who keep showing up.</span></h2></div><div className="steps">{steps.map(({ number, title, copy, icon: Icon }) => <article className="step" key={number}><div className="step-number">{number}</div><div className="step-icon"><Icon /></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

    <footer><div className="footer-brand"><span className="brand-mark small">C</span><strong>Crying Croc</strong><span className="footer-token">$CROC</span></div><p>Crocodile tears mean fake crying — a joke about bot wallets.<br />No presale. No team.</p><span className="footer-note">A community experiment on NEAR <span>↗</span></span></footer>
  </main>
}
