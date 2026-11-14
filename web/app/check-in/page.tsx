"use client"

import Link from "next/link"
import { ArrowLeft, Check, CircleDollarSign, LoaderCircle, Wallet, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"
import { useCrocData } from "../../lib/contract"
import { CONTRACT_ID } from "../../lib/config"
import {
  getConnectedAccountId,
  connectMeteor,
  disconnectMeteor,
  checkUserCheckinStatus,
  fetchUserBalance,
  executeCheckIn,
  executeClaim,
} from "../../lib/near-wallet"

export default function CheckInPage() {
  const { currentStreak, todayCheckins, target } = useCrocData()
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState("0")
  const [message, setMessage] = useState("")

  const targetNum = Number(target) || 5
  const checkinsNum = Number(todayCheckins) || 0
  const progressPercent = Math.min(100, Math.round((checkinsNum / targetNum) * 100))

  useEffect(() => {
    getConnectedAccountId().then(async (id) => {
      if (id) {
        setAccountId(id)
        setConnected(true)
        const [status, bal] = await Promise.all([
          checkUserCheckinStatus(id),
          fetchUserBalance(id),
        ])
        if (status.checkedInToday) setCheckedIn(true)
        if (bal) setBalance(bal)
      }
    })
  }, [])

  const handleWalletToggle = async () => {
    if (connected) {
      await disconnectMeteor()
      setConnected(false)
      setAccountId(null)
      setCheckedIn(false)
      setBalance("0")
      setMessage("Wallet disconnected.")
    } else {
      setLoading(true)
      setMessage("")
      const res = await connectMeteor()
      setLoading(false)
      if (res.success && res.accountId) {
        setAccountId(res.accountId)
        setConnected(true)
        setMessage(`Connected as ${res.accountId}`)
        const [status, bal] = await Promise.all([
          checkUserCheckinStatus(res.accountId),
          fetchUserBalance(res.accountId),
        ])
        if (status.checkedInToday) setCheckedIn(true)
        if (bal) setBalance(bal)
      } else if (res.message) {
        setMessage(res.message)
      }
    }
  }

  const handleCheckIn = async () => {
    if (!connected) {
      await handleWalletToggle()
      return
    }
    setLoading(true)
    setMessage("Please approve the check-in transaction in Meteor Wallet...")
    const res = await executeCheckIn()
    setLoading(false)
    setMessage(res.message)
    if (res.success) {
      setCheckedIn(true)
      if (accountId) {
        const bal = await fetchUserBalance(accountId)
        if (bal) setBalance(bal)
      }
    }
  }

  const handleClaim = async () => {
    if (!connected) return
    setLoading(true)
    setMessage("Please approve the claim transaction in Meteor Wallet...")
    const res = await executeClaim()
    setLoading(false)
    setMessage(res.message)
    if (res.success && accountId) {
      const bal = await fetchUserBalance(accountId)
      if (bal) setBalance(bal)
    }
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
            <button className="button header-wallet" onClick={handleWalletToggle} disabled={loading}>
              <Wallet />{connected ? (accountId ? accountId : "Wallet Connected") : "Connect Meteor"}
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
              {loading ? "Confirming..." : checkedIn ? "Checked In Today" : "Check In"}
            </button>
            {message && <div className="message checkin-message" role="status" aria-live="polite">{message}</div>}
          </section>

          <section className="glass-card checkin-wallet-panel" aria-label="Wallet summary">
            <div className="checkin-metrics">
              <div className="checkin-metric"><span>Wallet status</span><strong>{connected ? "Connected" : "Not connected"}</strong><small>{connected ? (accountId || "Connected") : "Connect Meteor to begin"}</small></div>
              <div className="checkin-metric"><span>Current streak</span><strong>{currentStreak !== "Unavailable" ? `${currentStreak} days` : "0 days"}</strong><small>+1 if you check in today</small></div>
              <div className="checkin-metric"><span>Pending rewards</span><strong>{checkedIn ? "Pending Settlement" : "0"}</strong><small>Minted at daily 24h settlement</small></div>
              <div className="checkin-metric"><span>Wallet balance</span><strong>{balance}</strong><small>CROC</small></div>
            </div>
            <button
              className="button"
              disabled={!connected || loading}
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
            <Check /> View Contract on NEARBlocks <ExternalLink style={{ width: "14px", height: "14px" }} />
          </a>
        </div>
        <footer className="site-footer"><span>$CROC / CHECK-IN</span><span>Testnet only. Not audited. No price shown.</span></footer>
      </div>
    </main>
  )
}
