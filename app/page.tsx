"use client"

import { useState } from "react"
import { Check, CircleDollarSign, Droplets, Flame, Sparkles, Wallet } from "lucide-react"

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
      <div className="header-actions">
        <span className="network"><span className="live-dot" />NEAR TESTNET</span>
        <button className="connect-btn" onClick={() => setConnected((current) => !current)}><Wallet />{connected ? "Wallet Connected" : "Connect Wallet"}</button>
      </div>
    </header>
    <section className="hero hero-centered" id="top">
      <div className="hero-copy"><div className="eyebrow"><span /> $CROC</div><h1>$CROC<br /><span>ON NEAR.</span></h1><p>A community streak coin on NEAR. Check in every day, grow your streak, and keep the chain moving together.</p></div>
    </section>

    <section className="checkin-card" aria-labelledby="checkin-title">
      <div className="card-top"><div><span className="section-kicker">THE CHECK-IN HUB</span><h2 id="checkin-title">Keep the streak alive.</h2></div><span className="live-pill"><span className="live-dot" /> LIVE</span></div>
      <div className="stats-grid"><Stat label="Total supply" value="300M" detail="CROC" /><Stat label="Current streak" value={String(streak)} detail="DAYS" /><Stat label="Wallet balance" value={walletBalance.toLocaleString()} detail="CROC" /><Stat label="Pending rewards" value={pending.toLocaleString()} detail="CROC" /></div>
      <div className="action-row"><button className="checkin-btn" disabled={!connected || checkedIn || checkingIn} onClick={checkIn}>{checkingIn ? <span className="spinner" /> : checkedIn ? <Check /> : <Droplets />}{checkingIn ? "Checking in..." : checkedIn ? "Already Checked In" : "Check In"}</button><button className="claim-btn" disabled={!connected || pending === 0 || checkingIn} onClick={claim}>{checkingIn ? "Processing..." : "Claim Rewards"}<CircleDollarSign /></button></div>
      <div className="status-row"><span className={message ? "success" : "muted"}>{message || (!connected ? "Connect Wallet First" : "Target: 5 checkers. You are #1.")}</span><span className="status-target"><span className="pulse" /> 4 / 5 checked in</span></div>
    </section>

    <section className="how-section"><div className="section-heading"><span className="section-kicker">THE MECHANIC</span><h2>Built for the ones<br /><span>who keep showing up.</span></h2></div><div className="steps">{steps.map(({ number, title, copy, icon: Icon }) => <article className="step" key={number}><div className="step-number">{number}</div><div className="step-icon"><Icon /></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

  </main>
}
