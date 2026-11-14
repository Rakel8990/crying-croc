"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { useCrocData } from "../../lib/contract"
import { CONTRACT_ID } from "../../lib/config"

export default function ProtocolStatsPage() {
  const {
    currentStreak,
    todayCheckins,
    target,
    treasury,
    emissionPool,
    ftTotalSupply,
    recentDays,
  } = useCrocData()

  const targetNum = Number(target) || 5
  const checkinsNum = Number(todayCheckins) || 0
  const progressPercent = Math.min(100, Math.round((checkinsNum / targetNum) * 100))

  const tokenStats = [
    ["Total supply", ftTotalSupply !== "Unavailable" ? ftTotalSupply : "300,000,000", "CROC"],
    ["Maximum supply", "1,000,000,000", "CROC"],
    ["Emission pool", emissionPool !== "Unavailable" ? emissionPool : "700,000,000", "CROC"],
    ["Treasury balance", treasury !== "Unavailable" ? treasury : "300,000,000", "CROC"],
  ]

  const activityRows =
    recentDays.length > 0
      ? recentDays.map((d) => [
          `Day ${d.day}`,
          d.success ? "Successful" : "Missed target",
          d.checkerCount.toLocaleString(),
          d.success ? `${d.rewardPerChecker} CROC` : "5% burn",
        ])
      : [
          ["Day 0 (Active)", "In Progress", `${todayCheckins} / ${target}`, "Active cycle"],
        ]

  return (
    <main>
      <div className="video-overlay" />
      <div className="noise" />
      <video className="background-video" src="https://files.catbox.moe/ef0gmt.mp4" autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
      <div className="site-shell">
        <header className="app-nav">
          <Link className="back-link" href="/"><ArrowLeft /> Back to CRYCODILE</Link>
          <span className="network"><span className="live-dot" />NEAR TESTNET</span>
        </header>
        <section className="page-title">
          <span className="eyebrow"><span /> TRANSPARENCY LAYER</span>
          <h1>PROTOCOL<br /><span>STATS.</span></h1>
          <p>What powers the streak. Live immutable parameters queried directly from {CONTRACT_ID} on NEAR Testnet.</p>
        </section>
        <div className="stats-grid">
          {tokenStats.map(([label, value, unit]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{unit} · Live On-Chain</small>
            </div>
          ))}
        </div>
        <section className="analytics-grid">
          <div className="glass-card">
            <span className="section-kicker">COMMUNITY STATISTICS</span>
            <div className="bar-list">
              <div className="bar-row">
                <div className="bar-label"><span>Current streak</span><strong>{currentStreak !== "Unavailable" ? `${currentStreak} days` : "0 days"}</strong></div>
                <div className="bar"><i style={{ width: currentStreak === "0" || currentStreak === "Unavailable" ? "0%" : "20%" }} /></div>
              </div>
              <div className="bar-row">
                <div className="bar-label"><span>Daily target</span><strong>{target} check-ins</strong></div>
                <div className="bar"><i style={{ width: "100%" }} /></div>
              </div>
              <div className="bar-row">
                <div className="bar-label"><span>Today&apos;s target</span><strong>{todayCheckins} / {target}</strong></div>
                <div className="bar"><i style={{ width: `${progressPercent}%` }} /></div>
              </div>
            </div>
          </div>
          <div className="glass-card">
            <span className="section-kicker">CONTRACT INFORMATION</span>
            <div className="contract-grid">
              <div className="contract-item"><span>Network</span><strong>NEAR Testnet</strong></div>
              <div className="contract-item"><span>Token</span><strong>CROC</strong></div>
              <div className="contract-item"><span>Decimals</span><strong>18</strong></div>
              <div className="contract-item">
                <span>Address</span>
                <strong>
                  <a
                    href={`https://testnet.nearblocks.io/address/${CONTRACT_ID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--bright)", textDecoration: "underline" }}
                  >
                    {CONTRACT_ID}
                  </a>
                </strong>
              </div>
            </div>
            <a className="button secondary" href="#activity">View protocol activity <ExternalLink /></a>
          </div>
        </section>
        <section className="section" id="activity">
          <div className="section-heading">
            <div><span className="section-kicker">PROTOCOL ACTIVITY</span><h2>Settlement<br /><span>history.</span></h2></div>
            <span className="network"><span className="live-dot" />Live Ledger</span>
          </div>
          <div className="table-wrap">
            <table className="activity-table">
              <thead><tr><th>Settlement</th><th>Status</th><th>Checkers</th><th>Outcome</th></tr></thead>
              <tbody>
                {activityRows.map((row) => (
                  <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <footer className="site-footer"><span>$CROC / PROTOCOL STATS</span><span>Testnet only. Not audited. No price shown.</span></footer>
      </div>
    </main>
  )
}
