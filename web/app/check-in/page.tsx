"use client"

import Link from "next/link"
import { ArrowLeft, Check, CircleDollarSign, Info } from "lucide-react"
import { useCrocData } from "../../lib/contract"
import { CONTRACT_ID } from "../../lib/config"

export default function CheckInPage() {
  const {
    currentStreak,
    longestStreak,
    todayCheckins,
    target,
    nextDayToSettle,
    mascotState,
  } = useCrocData()

  const targetNum = Number(target) || 5
  const checkinsNum = Number(todayCheckins) || 0
  const progressPercent =
    target !== "Unavailable" && todayCheckins !== "Unavailable"
      ? Math.min(100, Math.round((checkinsNum / targetNum) * 100))
      : 0

  const mascotLabel =
    mascotState === "happy"
      ? "Happy Croc"
      : mascotState === "crying"
        ? "Crying Croc"
        : "Neutral Croc"

  const mascotSubtext =
    mascotState === "happy"
      ? "Target met on settled day"
      : mascotState === "crying"
        ? "Target missed on settled day (5% burned)"
        : "Initial cycle active"

  return (
    <main>
      <div className="video-overlay" /><div className="noise" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span></div>
      <video className="background-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="app-nav">
          <Link className="back-link" href="/"><ArrowLeft /> Back to $CROC</Link>
          <div className="header-actions">
            <span className="network"><span className="live-dot" />NEAR TESTNET</span>
            <Link className="button header-wallet" href="/protocol-stats"><Info /> Protocol Stats</Link>
          </div>
        </header>

        <section className="page-title checkin-page-title">
          <span className="eyebrow"><span /> PARTICIPATION LAYER</span>
          <h1>DAILY <span>CHECK-IN.</span></h1>
        </section>

        <div className="dashboard">
          <section className="glass-card">
            <span className="section-kicker">TODAY&apos;S COMMUNITY TARGET</span>
            <h2>Keep the streak alive.</h2>
            <p className="card-description">The daily target of {target} check-ins is shared by active testnet wallets across 24-hour cycles.</p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="progress-meta">
              <span>{todayCheckins} check-ins</span>
              <span>{target} target</span>
            </div>

            <div className="dashboard-actions" style={{ flexDirection: "column", alignItems: "stretch", gap: "12px" }}>
              <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#bdcbbb" }}>
                <strong style={{ color: "#eff8ee", display: "block", marginBottom: "8px" }}>How to check in on NEAR Testnet:</strong>
                <ol style={{ paddingLeft: "20px", margin: 0 }}>
                  <li>Create a testnet wallet (e.g. testnet.mynearwallet.com).</li>
                  <li>Register storage by calling <code>storage_deposit</code> with 0.00125 NEAR.</li>
                  <li>Call <code>check_in()</code> once per 24-hour day.</li>
                  <li>After the day closes, call <code>settle()</code>, then call <code>claim()</code> to receive your rewards.</li>
                </ol>
              </div>
              <a
                className="button secondary"
                href={`https://testnet.nearblocks.io/address/${CONTRACT_ID}#contract-methods`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Check /> View Contract Methods on NEARBlocks
              </a>
            </div>
          </section>

          <aside className="metric-stack">
            <div className="metric">
              <span>Mascot state</span>
              <strong>{mascotLabel}</strong>
              <small>{mascotSubtext}</small>
            </div>
            <div className="metric">
              <span>Current streak</span>
              <strong>{currentStreak} {currentStreak === "1" ? "day" : "days"}</strong>
              <small>Longest streak: {longestStreak} days</small>
            </div>
            <div className="metric">
              <span>Today&apos;s check-ins</span>
              <strong>{todayCheckins}</strong>
              <small>Target: {target} check-ins</small>
            </div>
            <div className="metric">
              <span>Settlement cycle</span>
              <strong>{nextDayToSettle !== null ? `Day ${nextDayToSettle}` : "Unavailable"}</strong>
              <small>24-hour day length (86,400s)</small>
            </div>
            <Link className="button" href="/protocol-stats">
              <CircleDollarSign /> View Protocol Stats
            </Link>
          </aside>
        </div>

        <p className="checkin-description">Your participation keeps the community streak alive. 5 check-ins every 24 hours protect the treasury and mint daily rewards.</p>
        <footer className="site-footer"><span>$CROC / CHECK-IN</span><span>Testnet only. Not audited. No price shown.</span></footer>
      </div>
    </main>
  )
}
