"use client"

import Link from "next/link"
import { ArrowLeft, Check, CircleDollarSign, LoaderCircle, Wallet, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { useCrocData } from "../../lib/contract"
import { CONTRACT_ID } from "../../lib/config"

export default function CheckInPage() {
  const { currentStreak, todayCheckins, target } = useCrocData()
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [streak, setStreak] = useState(0)
  const [pending, setPending] = useState(0)
  const [balance, setBalance] = useState(0)
  const [message, setMessage] = useState("")

  const targetNum = Number(target) || 5
  const checkinsNum = Number(todayCheckins) || 0
  const progressPercent = Math.min(100, Math.round((checkinsNum / targetNum) * 100))

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("croc_testnet_account") : null
    if (saved) {
      setAccountId(saved)
      setConnected(true)
    }
  }, [])

  const handleWalletToggle = () => {
    if (connected) {
      setConnected(false)
      setAccountId(null)
      setCheckedIn(false)
      setMessage("Wallet disconnected.")
      if (typeof window !== "undefined") {
        localStorage.removeItem("croc_testnet_account")
      }
    } else {
      const input = window.prompt("Connect NEAR Testnet Wallet:\nEnter your account ID (e.g. yourname.testnet):", accountId || "rakel.testnet")
      if (input && input.trim()) {
        const id = input.trim()
        setAccountId(id)
        setConnected(true)
        setMessage(`Connected as ${id}`)
        if (typeof window !== "undefined") {
          localStorage.setItem("croc_testnet_account", id)
        }
      }
    }
  }

  const handleCheckIn = () => {
    if (!connected) {
      handleWalletToggle()
      return
    }
    setLoading(true)
    setMessage("")
    window.setTimeout(() => {
      setCheckedIn(true)
      setStreak((current) => current + 1)
      setPending((current) => current + 320)
      setLoading(false)
      setMessage("Check-in confirmed for Day 0! +320 CROC added to pending rewards.")
    }, 1000)
  }

  const handleClaim = () => {
    if (!connected || pending === 0) return
    setLoading(true)
    setMessage("")
    window.setTimeout(() => {
      setBalance((current) => current + pending)
      setPending(0)
      setLoading(false)
      setMessage("Rewards claimed and moved to your wallet balance.")
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
            <span className="network"><span className="live-dot" />NEAR TESTNET</span>
            <button className="button header-wallet" onClick={handleWalletToggle}>
              <Wallet />{connected ? (accountId ? accountId : "Wallet Connected") : "Connect Wallet"}
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
                <p className="card-description">The daily target of {target} check-ins is shared by every active checker on NEAR.</p>
              </div>
              <div className="checkin-target-progress">
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
                <div className="progress-meta"><span>{todayCheckins} check-ins</span><span>{target} target</span></div>
              </div>
            </div>

            <button
              className="button secondary"
              disabled={!connected || checkedIn || loading}
              onClick={handleCheckIn}
            >
              {loading ? <LoaderCircle className="spin" /> : <Check />}
              {loading ? "Processing..." : checkedIn ? "Checked In Today" : "Check In"}
            </button>
            {message && <div className="message checkin-message" role="status" aria-live="polite">{message}</div>}
          </section>

          <section className="glass-card checkin-wallet-panel" aria-label="Wallet summary">
            <div className="checkin-metrics">
              <div className="checkin-metric"><span>Wallet status</span><strong>{connected ? "Connected" : "Not connected"}</strong><small>{connected ? (accountId || "0x8C...CROC") : "Connect to begin"}</small></div>
              <div className="checkin-metric"><span>Current streak</span><strong>{currentStreak !== "Unavailable" && currentStreak !== "0" ? `${currentStreak} days` : `${streak} days`}</strong><small>+1 if you check in today</small></div>
              <div className="checkin-metric"><span>Pending rewards</span><strong>{pending.toLocaleString()}</strong><small>CROC available to claim</small></div>
              <div className="checkin-metric"><span>Wallet balance</span><strong>{balance.toLocaleString()}</strong><small>CROC</small></div>
            </div>
            <button
              className="button"
              disabled={!connected || pending === 0 || loading}
              onClick={handleClaim}
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

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p className="checkin-description" style={{ margin: 0 }}>
            Your participation keeps the community streak alive. 5 check-ins every 24 hours protect the treasury and mint daily rewards.
          </p>
          <a
            className="button secondary"
            href={`https://testnet.nearblocks.io/address/${CONTRACT_ID}#contract-methods`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: "12px", padding: "8px 14px", textDecoration: "none" }}
          >
            <Check /> Check In on NEARBlocks Explorer <ExternalLink style={{ width: "14px", height: "14px" }} />
          </a>
        </div>
        <footer className="site-footer"><span>$CROC / CHECK-IN</span><span>Testnet only. Not audited. No price shown.</span></footer>
      </div>
    </main>
  )
}
