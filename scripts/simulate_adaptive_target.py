#!/usr/bin/env python3
"""Compare adaptive check-in targets; this is evidence only, not contract logic."""

import argparse
import csv
import math
from pathlib import Path


DAYS = 60
TOKEN = 10**18
INITIAL_TREASURY = 300_000_000 * TOKEN
INITIAL_POOL = 700_000_000 * TOKEN
MAX_SUPPLY = 1_000_000_000 * TOKEN
MILESTONES = ((7, 100), (15, 150), (25, 250), (100, 500))
POLICIES = ("A", "B", "C")
SCENARIOS = (
    ("steady_200", 200, "steady"),
    ("steady_500", 500, "steady"),
    ("steady_1000", 1000, "steady"),
    ("bot_spike_500", 500, "bot_spike"),
    ("sustained_bots_500", 500, "sustained_bots"),
    ("humans_fading_500", 500, "humans_fading"),
)


def daily_checkins(kind, crowd, day):
    """Return human and bot check-ins for day 1 through day 60."""
    if kind == "humans_fading":
        # Human participation falls linearly from 60% to 20% across 60 days.
        rate_percent = 60 * 59 - 40 * (day - 1)
        humans = crowd * rate_percent // (100 * 59)
    else:
        humans = crowd * 60 // 100
    if kind == "bot_spike":
        bots = 100 if day <= 7 else 0
    elif kind == "sustained_bots":
        bots = 100
    else:
        bots = 0
    return humans, bots


def next_target(policy, history, current_target):
    if policy == "A":
        ordered = sorted(history)
        median = ordered[len(ordered) // 2]
        return max(5, (4 * median + 4) // 5)  # ceil(0.8 * median)
    candidate = max(5, min(history) // 2)
    if policy == "B":
        return candidate
    if policy == "C":
        rise_limit = (5 * current_target + 3) // 4  # ceil(1.25 * current target)
        return max(5, min(candidate, rise_limit))
    raise ValueError(f"unknown target policy: {policy}")


def simulate(name, crowd, kind, policy):
    treasury = INITIAL_TREASURY
    pool = INITIAL_POOL
    escrow = 0
    streak = 0
    longest_streak = 0
    milestones_paid = set()
    history = [5] * 7
    target = 5
    rows = []
    burned_total = 0

    for day in range(1, DAYS + 1):
        humans, bots = daily_checkins(kind, crowd, day)
        checkins = humans + bots
        burned = 0
        if checkins >= target:
            pot = pool // 200
            treasury_mint = pot // 10
            checker_part = pot * 90 // 100
            per_checker = checker_part // checkins
            checker_mint = per_checker * checkins
            pool -= pot
            treasury += treasury_mint
            escrow += checker_mint
            streak += 1
            longest_streak = max(longest_streak, streak)
            if streak in (threshold for threshold, _ in MILESTONES):
                for threshold, basis_points in MILESTONES:
                    if threshold == streak and threshold not in milestones_paid:
                        milestones_paid.add(threshold)
                        bonus = treasury * basis_points // 10_000
                        moved = (bonus // checkins) * checkins
                        treasury -= moved
                        escrow += moved
                        break
        else:
            burned = treasury * 5 // 100
            treasury -= burned
            streak = 0
            burned_total += burned

        if treasury + escrow > MAX_SUPPLY:
            raise AssertionError("simulation exceeded the 1B CROC supply limit")
        rows.append({
            "scenario": name,
            "crowd_wallets": crowd,
            "policy": policy,
            "day": day,
            "target": target,
            "human_checkins": humans,
            "bot_checkins": bots,
            "total_checkins": checkins,
            "success": int(checkins >= target),
            "treasury_burned_yocto": burned,
            "treasury_yocto": treasury,
            "pool_yocto": pool,
            "escrow_yocto": escrow,
            "streak": streak,
            "longest_streak": longest_streak,
        })
        history.append(checkins)
        history = history[-7:]
        target = next_target(policy, history, target)

    missed = [row["day"] for row in rows if row["success"] == 0]
    recovery_days = 0
    if missed:
        recovered = next((day for day in range(missed[0] + 1, DAYS + 1)
                          if rows[day - 1]["success"] == 1), None)
        recovery_days = "not within 60 days" if recovered is None else recovered - missed[0]
    return rows, {
        "scenario": name,
        "crowd_wallets": crowd,
        "policy": policy,
        "missed_days": len(missed),
        "treasury_burned_yocto": burned_total,
        "treasury_burned_croc": f"{burned_total // TOKEN}.{burned_total % TOKEN:018d}",
        "days_to_recover_after_first_miss": recovery_days,
        "first_missed_day": missed[0] if missed else "none",
        "final_target": target,
        "final_treasury_yocto": treasury,
        "final_pool_yocto": pool,
    }


def weekly_challenge():
    """Illustrative one-week capture with 100 human and either 5 or 50 bots."""
    weekly_pool = INITIAL_TREASURY // 100
    rows = []
    for bots in (5, 50):
        eligible = 100 + bots
        per_wallet = weekly_pool // eligible
        captured = per_wallet * bots
        rows.append({
            "eligible_humans": 100,
            "bot_wallets": bots,
            "weekly_pool_yocto": weekly_pool,
            "weekly_pool_croc": f"{weekly_pool // TOKEN}.{weekly_pool % TOKEN:018d}",
            "bot_share_percent": f"{100 * bots / eligible:.4f}%",
            "bot_capture_yocto": captured,
            "bot_capture_croc": f"{captured // TOKEN}.{captured % TOKEN:018d}",
            "distributed_dust_yocto": weekly_pool - per_wallet * eligible,
        })
    return rows


def write_chart(path, all_rows):
    """Write a dependency-free SVG chart for the bot-spike scenario."""
    selected = [row for row in all_rows
                if row["scenario"] == "bot_spike_500"]
    series = {policy: [row for row in selected if row["policy"] == policy]
              for policy in POLICIES}
    width, height = 900, 440
    left, right, top, bottom = 70, 25, 45, 60
    plot_w, plot_h = width - left - right, height - top - bottom
    maximum = max(5, max(row["target"] for rows in series.values() for row in rows))
    maximum = math.ceil(maximum / 50) * 50
    colors = {"A": "#c43c35", "B": "#2474b5", "C": "#17834a"}
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
        '<text x="450" y="25" text-anchor="middle" font-family="sans-serif" font-size="18">Target response to a 7-day, 100-bot spike</text>',
    ]
    for value in range(0, maximum + 1, max(1, maximum // 5)):
        y = top + plot_h - value * plot_h / maximum
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{left + plot_w}" y2="{y:.1f}" stroke="#dddddd"/>')
        parts.append(f'<text x="{left - 10}" y="{y + 4:.1f}" text-anchor="end" font-family="sans-serif" font-size="11">{value}</text>')
    for day in (1, 10, 20, 30, 40, 50, 60):
        x = left + (day - 1) * plot_w / (DAYS - 1)
        parts.append(f'<text x="{x:.1f}" y="{height - 25}" text-anchor="middle" font-family="sans-serif" font-size="11">{day}</text>')
    parts.append(f'<text x="{left + plot_w / 2}" y="{height - 5}" text-anchor="middle" font-family="sans-serif" font-size="12">Day</text>')
    parts.append(f'<text transform="translate(18 {top + plot_h / 2}) rotate(-90)" text-anchor="middle" font-family="sans-serif" font-size="12">Target wallets</text>')
    for index, policy in enumerate(POLICIES):
        points = []
        for row in series[policy]:
            x = left + (row["day"] - 1) * plot_w / (DAYS - 1)
            y = top + plot_h - row["target"] * plot_h / maximum
            points.append(f"{x:.1f},{y:.1f}")
        parts.append(f'<polyline fill="none" stroke="{colors[policy]}" stroke-width="2.5" points="{" ".join(points)}"/>')
        legend_x = 610 + index * 75
        parts.append(f'<line x1="{legend_x}" y1="42" x2="{legend_x + 20}" y2="42" stroke="{colors[policy]}" stroke-width="3"/>')
        parts.append(f'<text x="{legend_x + 25}" y="46" font-family="sans-serif" font-size="12">Rule {policy}</text>')
    parts.append('</svg>')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(parts) + "\n", encoding="utf-8")


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=root / "docs" / "simulation")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    all_rows = []
    summaries = []
    for name, crowd, kind in SCENARIOS:
        for policy in POLICIES:
            rows, summary = simulate(name, crowd, kind, policy)
            all_rows.extend(rows)
            summaries.append(summary)

    daily_path = args.output_dir / "adaptive_target_daily.csv"
    summary_path = args.output_dir / "adaptive_target_summary.csv"
    challenge_path = args.output_dir / "adaptive_target_weekly_challenge.csv"
    with daily_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=all_rows[0].keys())
        writer.writeheader()
        writer.writerows(all_rows)
    with summary_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=summaries[0].keys())
        writer.writeheader()
        writer.writerows(summaries)
    challenges = weekly_challenge()
    with challenge_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=challenges[0].keys())
        writer.writeheader()
        writer.writerows(challenges)
    write_chart(args.output_dir / "adaptive_target.svg", all_rows)
    print(f"wrote {len(all_rows)} daily rows to {daily_path}")
    print(f"wrote {len(summaries)} policy summaries to {summary_path}")
    print(f"wrote weekly challenge cases to {challenge_path}")
    print(f"wrote bot-spike target chart to {args.output_dir / 'adaptive_target.svg'}")


if __name__ == "__main__":
    main()
