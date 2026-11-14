"use client"

import Link from "next/link"
import { ArrowLeft, Check, CircleDollarSign, LoaderCircle, Wallet } from "lucide-react"
import { useState } from "react"

export default function CheckInPage() {
  const [connected, setConnected] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [streak, setStreak] = useState(12)
  const [pending, setPending] = useState(2480)
  const [balance, setBalance] = useState(18420)
  const [message, setMessage] = useState("")

  const run = (action: () => void, success: string) => {
    setLoading(true)
    setMessage("")
    window.setTimeout(() => {
      action()
      setLoading(false)
      setMessage(success)
    }, 1000)
  }

  return (
    <main>
      <div className="video-overlay" />
      <div className="noise" />
      <video className="background-video" src="https://files.catbox.moe/ef0gmt.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />

      <div className="site-shell">
        <header className="app-nav">
          <Link className="back-link" href="/"><ArrowLeft /> Back to CRYCODILE</Link>
          <div className="header-actions">
            <span className="preview-label"><span className="live-dot" />Preview Data</span>
            <button className="button header-wallet" onClick={() => setConnected((current) => !current)}>
              <Wallet />{connected ? "Wallet Connected" : "Connect Wallet"}
            </button>
          </div>
        </header>

        <section className="page-title checkin-page-title">
          <span className="eyebrow"><span /> PARTICIPATION LAYER</span>
          <h1>DAILY <span>CHECK-IN.</span></h1>
        </section>

        <div className="checkin-flow">
          <section className="glass-card checkin-target-panel" aria-labelledby="checkin-target-heading">
            <div className="checkin-target-main">
              <div className="checkin-target-copy">
                <span className="section-kicker">TODAY&apos;S COMMUNITY TARGET</span>
                <h2 id="checkin-target-heading">Keep the streak alive.</h2>
                <p className="card-description">The daily target is shared by every active checker on NEAR.</p>
              </div>
              <div className="checkin-target-progress">
                <div className="progress-track"><div className="progress-fill" style={{ width: "72%" }} /></div>
                <div className="progress-meta"><span>72 checkers</span><span>100 target</span></div>
              </div>
            </div>

            <button
              className="button secondary"
              disabled={!connected || checkedIn || loading}
              onClick={() => run(() => {
                setCheckedIn(true)
                setStreak((current) => current + 1)
                setPending((current) => current + 320)
              }, "Check-in confirmed. Reward added to pending balance.")}
            >
              {loading ? <LoaderCircle className="spin" /> : <Check />}
              {loading ? "Processing..." : checkedIn ? "Checked In Today" : "Check In"}
            </button>
            {message && <div className="message checkin-message" role="status" aria-live="polite">{message}</div>}
          </section>

          <section className="glass-card checkin-wallet-panel" aria-label="Wallet summary">
            <div className="checkin-metrics">
              <div className="checkin-metric"><span>Wallet status</span><strong>{connected ? "Connected" : "Not connected"}</strong><small>{connected ? "0x8C...CROC" : "Connect to begin"}</small></div>
              <div className="checkin-metric"><span>Current streak</span><strong>{streak} days</strong><small>+1 if you check in today</small></div>
              <div className="checkin-metric"><span>Pending rewards</span><strong>{pending.toLocaleString()}</strong><small>CROC available to claim</small></div>
              <div className="checkin-metric"><span>Wallet balance</span><strong>{balance.toLocaleString()}</strong><small>CROC</small></div>
            </div>
            <button
              className="button"
              disabled={!connected || pending === 0 || loading}
              onClick={() => run(() => {
                setBalance((current) => current + pending)
                setPending(0)
              }, "Rewards claimed and moved to wallet balance.")}
            >
              <CircleDollarSign /> Claim Rewards
            </button>
          </section>

          <section className="checkin-video-section" aria-label="CRYCODILE video">
            <video
              className="checkin-video"
              src="https://files.catbox.moe/m10av1.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              controls
              aria-label="CRYCODILE community video"
            />
          </section>
        </div>

        <p className="checkin-description">Your participation keeps the community streak alive. Connect a wallet to interact with the mock protocol.</p>
        <footer className="site-footer"><span>$CROC / CHECK-IN</span><span>Mock interaction layer</span></footer>
      </div>
    </main>
  )
}
