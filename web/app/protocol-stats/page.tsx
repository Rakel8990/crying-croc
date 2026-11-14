"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { useCrocData, formatYoctoCroc } from "../../lib/contract"
import { CONTRACT_ID, REPO_URL } from "../../lib/config"

export default function ProtocolStatsPage() {
  const {
    currentStreak,
    longestStreak,
    todayCheckins,
    target,
    dayLengthNs,
    treasury,
    emissionPool,
    ftTotalSupply,
    recentDays,
    loading,
  } = useCrocData()

  const tokenStats = [
    ["Total supply", ftTotalSupply, "CROC"],
    ["Maximum supply", "1,000,000,000", "CROC"],
    ["Emission pool", emissionPool, "CROC"],
    ["Treasury balance", treasury, "CROC"],
  ]

  const targetNum = Number(target) || 5
  const checkinsNum = Number(todayCheckins) || 0
  const progressPercent =
    target !== "Unavailable" && todayCheckins !== "Unavailable"
      ? Math.min(100, Math.round((checkinsNum / targetNum) * 100))
      : 0

  const dayHours =
    dayLengthNs !== "Unavailable"
      ? `${Math.round(Number(dayLengthNs) / 3600000000000)}h`
      : "24h"

  return (
    <main>
      <div className="video-overlay" /><div className="noise" /><div className="ticker-field" aria-hidden="true"><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span><span>$CROC</span><span>$NEAR</span></div>
      <video className="background-video" src="https://files.catbox.moe/2pu9xu.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="app-nav">
          <Link className="back-link" href="/"><ArrowLeft /> Back to $CROC</Link>
          <span className="network"><span className="live-dot" />NEAR TESTNET</span>
        </header>

        <section className="page-title">
          <span className="eyebrow"><span /> TRANSPARENCY LAYER</span>
          <h1>PROTOCOL<br /><span>STATS.</span></h1>
          <p>Real-time on-chain parameters and live ledger metrics on NEAR Testnet.</p>
        </section>

        <div className="stats-grid">
          {tokenStats.map(([label, value, unit]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{unit} · Live View</small>
            </div>
          ))}
        </div>

        <section className="analytics-grid">
          <div className="glass-card">
            <span className="section-kicker">COMMUNITY STATISTICS</span>
            <div className="bar-list">
              <div className="bar-row">
                <div className="bar-label">
                  <span>Current streak</span>
                  <strong>{currentStreak} {currentStreak === "1" ? "day" : "days"}</strong>
                </div>
                <div className="bar">
                  <i style={{ width: `${Math.min(100, (Number(currentStreak) || 0) * 4)}%` }} />
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label">
                  <span>Longest streak</span>
                  <strong>{longestStreak} {longestStreak === "1" ? "day" : "days"}</strong>
                </div>
                <div className="bar">
                  <i style={{ width: `${Math.min(100, (Number(longestStreak) || 0) * 4)}%` }} />
                </div>
              </div>
              <div className="bar-row">
                <div className="bar-label">
                  <span>Today&apos;s target</span>
                  <strong>{todayCheckins} / {target}</strong>
                </div>
                <div className="bar">
                  <i style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <span className="section-kicker">CONTRACT INFORMATION</span>
            <div className="contract-grid">
              <div className="contract-item">
                <span>Network</span>
                <strong>NEAR Testnet</strong>
              </div>
              <div className="contract-item">
                <span>Token</span>
                <strong>CROC</strong>
              </div>
              <div className="contract-item">
                <span>Decimals</span>
                <strong>18</strong>
              </div>
              <div className="contract-item">
                <span>Target / Day</span>
                <strong>{target} check-ins ({dayHours})</strong>
              </div>
              <div className="contract-item" style={{ gridColumn: "1 / -1" }}>
                <span>Contract Address</span>
                <strong style={{ fontSize: "13px", wordBreak: "break-all" }}>{CONTRACT_ID}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
              <a
                className="button secondary"
                href={`https://testnet.nearblocks.io/address/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                NEARBlocks Explorer <ExternalLink />
              </a>
              <a
                className="button secondary"
                href={`${REPO_URL}/tree/main/docs/testnet/final`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Deployment Proofs <ExternalLink />
              </a>
              <a
                className="button secondary"
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Repository <ExternalLink />
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="activity">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PROTOCOL ACTIVITY</span>
              <h2>Settlement<br /><span>history.</span></h2>
            </div>
            <span className="network"><span className="live-dot" />Last 10 Settled Days</span>
          </div>

          <div className="table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Settlement</th>
                  <th>Status</th>
                  <th>Checkers</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {recentDays.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "28px", color: "#bdcbbb" }}>
                      {loading ? "Loading on-chain records..." : "No settled days yet. Round 0 in progress on NEAR Testnet."}
                    </td>
                  </tr>
                ) : (
                  recentDays.map((row) => (
                    <tr key={row.day}>
                      <td>Day {row.day}</td>
                      <td>{row.success ? "Successful" : "Missed target"}</td>
                      <td>{row.checkerCount}</td>
                      <td>
                        {row.success
                          ? `${formatYoctoCroc(row.rewardPerChecker)} CROC${
                              row.bonusPerChecker && row.bonusPerChecker !== "0"
                                ? ` (+${formatYoctoCroc(row.bonusPerChecker)} bonus)`
                                : ""
                            }`
                          : "5% burn"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="site-footer">
          <span>$CROC / PROTOCOL STATS</span>
          <span>Testnet only. Not audited. No price shown.</span>
        </footer>
      </div>
    </main>
  )
}
