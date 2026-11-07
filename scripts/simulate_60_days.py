#!/usr/bin/env python3
"""Deterministic 60-day CROC simulations using only Python's standard library."""

import argparse
import csv
import struct
import zlib
from pathlib import Path


DAY_COUNT = 60
CROWD_SIZES = (25, 50, 100, 200, 500)
TARGETS = (5, 40)
TOKEN = 10**18
INITIAL_TREASURY = 300_000_000 * TOKEN
INITIAL_POOL = 700_000_000 * TOKEN
MAX_SUPPLY = 1_000_000_000 * TOKEN
SCENARIOS = ("steady", "hype_fades", "weekend_dips", "bots_from_day_1")


def daily_human_checkins(scenario, crowd, day):
    """Return an exact integer count for day 1 through day 60."""
    if scenario in ("hype_fades", "bots_from_day_1"):
        # Participation fades linearly from 80% on day 1 to 20% on day 60.
        rate_numerator = 80 * 59 - 60 * (day - 1)
        return crowd * rate_numerator // (100 * 59)
    if scenario == "weekend_dips" and (day - 1) % 7 in (5, 6):
        return crowd * 25 // 100
    # Steady participation and non-weekend weekend-dip participation are 60%.
    return crowd * 60 // 100


def daily_checkins(scenario, crowd, day):
    humans = daily_human_checkins(scenario, crowd, day)
    bots = 120 if scenario == "bots_from_day_1" else 0
    return humans + bots, humans, bots


def settle_day(state, checkins, target):
    """Apply the same floor-based mint/burn formulas as RULES.md."""
    pool = state["pool"]
    treasury = state["treasury"]
    escrow = state["escrow"]
    streak = state["streak"]
    longest = state["longest_streak"]
    pot = treasury_mint = checker_mint = burn = dust = 0

    if checkins >= target:
        pot = pool // 200
        treasury_mint = pot // 10
        checker_part = pot * 90 // 100
        per_checker = checker_part // checkins
        checker_mint = per_checker * checkins
        dust = pot - treasury_mint - checker_mint
        pool -= pot
        treasury += treasury_mint
        escrow += checker_mint
        streak += 1
        longest = max(longest, streak)
    else:
        burn = treasury * 5 // 100
        treasury -= burn
        streak = 0

    supply = treasury + escrow
    if supply > MAX_SUPPLY:
        raise AssertionError("simulation exceeded the 1B CROC supply limit")

    next_state = {
        "pool": pool,
        "treasury": treasury,
        "escrow": escrow,
        "supply": supply,
        "streak": streak,
        "longest_streak": longest,
    }
    detail = {
        "pot_yocto": pot,
        "treasury_minted_yocto": treasury_mint,
        "checker_minted_yocto": checker_mint,
        "burned_yocto": burn,
        "dust_not_minted_yocto": dust,
        "pool_yocto": pool,
        "treasury_yocto": treasury,
        "escrow_yocto": escrow,
        "total_supply_yocto": supply,
        "streak": streak,
        "longest_streak": longest,
    }
    return next_state, detail


def run_scenario(scenario, crowd, target):
    state = {
        "pool": INITIAL_POOL,
        "treasury": INITIAL_TREASURY,
        "escrow": 0,
        "supply": INITIAL_TREASURY,
        "streak": 0,
        "longest_streak": 0,
    }
    rows = []
    for day in range(1, DAY_COUNT + 1):
        checkins, humans, bots = daily_checkins(scenario, crowd, day)
        state, result = settle_day(state, checkins, target)
        rows.append({
            "scenario": scenario,
            "crowd_size": crowd,
            "target": target,
            "day": day,
            "human_checkins": humans,
            "bot_checkins": bots,
            "total_checkins": checkins,
            "success": int(checkins >= target),
            **result,
        })
    return rows


def run_replay_schedule(schedule_path, target):
    state = {
        "pool": INITIAL_POOL,
        "treasury": INITIAL_TREASURY,
        "escrow": 0,
        "supply": INITIAL_TREASURY,
        "streak": 0,
        "longest_streak": 0,
    }
    rows = []
    with schedule_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for expected_day, row in enumerate(reader, start=1):
            day = int(row["day"])
            checkins = int(row["checkins"])
            if day != expected_day:
                raise ValueError("replay schedule days must be consecutive from day 1")
            state, result = settle_day(state, checkins, target)
            rows.append({
                "day": day,
                "checkins": checkins,
                "success": int(checkins >= target),
                "pot_yocto": result["pot_yocto"],
                "treasury_minted_yocto": result["treasury_minted_yocto"],
                "checker_minted_yocto": result["checker_minted_yocto"],
                "burned_yocto": result["burned_yocto"],
                "pool_yocto": state["pool"],
                "treasury_yocto": state["treasury"],
                "total_supply_yocto": state["supply"],
                "streak": state["streak"],
                "longest_streak": state["longest_streak"],
            })
    if len(rows) != DAY_COUNT:
        raise ValueError(f"replay schedule must have exactly {DAY_COUNT} days")
    return rows


FONT = {
    " ": ("00000", "00000", "00000", "00000", "00000", "00000", "00000"),
    "-": ("00000", "00000", "00000", "11111", "00000", "00000", "00000"),
    "=": ("00000", "11111", "00000", "11111", "00000", "00000", "00000"),
    ".": ("00000", "00000", "00000", "00000", "00000", "00110", "00110"),
    ":": ("00000", "00110", "00110", "00000", "00110", "00110", "00000"),
    "(": ("00010", "00100", "01000", "01000", "01000", "00100", "00010"),
    ")": ("01000", "00100", "00010", "00010", "00010", "00100", "01000"),
    "/": ("00001", "00010", "00100", "01000", "10000", "00000", "00000"),
    "0": ("01110", "10001", "10011", "10101", "11001", "10001", "01110"),
    "1": ("00100", "01100", "00100", "00100", "00100", "00100", "01110"),
    "2": ("01110", "10001", "00001", "00010", "00100", "01000", "11111"),
    "3": ("11110", "00001", "00001", "01110", "00001", "00001", "11110"),
    "4": ("00010", "00110", "01010", "10010", "11111", "00010", "00010"),
    "5": ("11111", "10000", "10000", "11110", "00001", "00001", "11110"),
    "6": ("01110", "10000", "10000", "11110", "10001", "10001", "01110"),
    "7": ("11111", "00001", "00010", "00100", "01000", "01000", "01000"),
    "8": ("01110", "10001", "10001", "01110", "10001", "10001", "01110"),
    "9": ("01110", "10001", "10001", "01111", "00001", "00001", "01110"),
    "A": ("01110", "10001", "10001", "11111", "10001", "10001", "10001"),
    "B": ("11110", "10001", "10001", "11110", "10001", "10001", "11110"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "D": ("11110", "10001", "10001", "10001", "10001", "10001", "11110"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "F": ("11111", "10000", "10000", "11110", "10000", "10000", "10000"),
    "G": ("01111", "10000", "10000", "10111", "10001", "10001", "01111"),
    "H": ("10001", "10001", "10001", "11111", "10001", "10001", "10001"),
    "I": ("01110", "00100", "00100", "00100", "00100", "00100", "01110"),
    "J": ("00111", "00010", "00010", "00010", "10010", "10010", "01100"),
    "K": ("10001", "10010", "10100", "11000", "10100", "10010", "10001"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
    "M": ("10001", "11011", "10101", "10101", "10001", "10001", "10001"),
    "N": ("10001", "11001", "10101", "10011", "10001", "10001", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "P": ("11110", "10001", "10001", "11110", "10000", "10000", "10000"),
    "Q": ("01110", "10001", "10001", "10001", "10101", "10010", "01101"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
    "S": ("01111", "10000", "10000", "01110", "00001", "00001", "11110"),
    "T": ("11111", "00100", "00100", "00100", "00100", "00100", "00100"),
    "U": ("10001", "10001", "10001", "10001", "10001", "10001", "01110"),
    "V": ("10001", "10001", "10001", "10001", "10001", "01010", "00100"),
    "W": ("10001", "10001", "10001", "10101", "10101", "10101", "01010"),
    "X": ("10001", "10001", "01010", "00100", "01010", "10001", "10001"),
    "Y": ("10001", "10001", "01010", "00100", "00100", "00100", "00100"),
    "Z": ("11111", "00001", "00010", "00100", "01000", "10000", "11111"),
}


class Canvas:
    def __init__(self, width, height, color=(255, 255, 255)):
        self.width = width
        self.height = height
        self.pixels = bytearray(color * (width * height))

    def pixel(self, x, y, color):
        if 0 <= x < self.width and 0 <= y < self.height:
            offset = (y * self.width + x) * 3
            self.pixels[offset:offset + 3] = bytes(color)

    def line(self, x0, y0, x1, y1, color, thickness=1):
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        error = dx - dy
        while True:
            radius = thickness // 2
            for oy in range(-radius, radius + 1):
                for ox in range(-radius, radius + 1):
                    self.pixel(x0 + ox, y0 + oy, color)
            if x0 == x1 and y0 == y1:
                break
            twice = 2 * error
            if twice > -dy:
                error -= dy
                x0 += sx
            if twice < dx:
                error += dx
                y0 += sy

    def text(self, x, y, value, color=(30, 35, 40), scale=2):
        cursor = x
        for char in value.upper():
            glyph = FONT.get(char, FONT[" "])
            for gy, row in enumerate(glyph):
                for gx, bit in enumerate(row):
                    if bit == "1":
                        for oy in range(scale):
                            for ox in range(scale):
                                self.pixel(cursor + gx * scale + ox, y + gy * scale + oy, color)
            cursor += 6 * scale

    def png(self, path):
        raw = b"".join(
            b"\x00" + self.pixels[y * self.width * 3:(y + 1) * self.width * 3]
            for y in range(self.height)
        )

        def chunk(kind, data):
            body = kind + data
            return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

        image = b"\x89PNG\r\n\x1a\n"
        image += chunk(b"IHDR", struct.pack(">IIBBBBB", self.width, self.height, 8, 2, 0, 0, 0))
        image += chunk(b"IDAT", zlib.compress(raw, 9))
        image += chunk(b"IEND", b"")
        path.write_bytes(image)


COLORS = (
    (31, 119, 180), (255, 127, 14), (44, 160, 44), (214, 39, 40), (148, 103, 189),
    (140, 86, 75), (227, 119, 194), (127, 127, 127), (188, 189, 34), (23, 190, 207),
)


def write_chart(path, scenario, series):
    width, height = 1200, 720
    canvas = Canvas(width, height)
    left, right, top, bottom = 105, 830, 105, 610
    all_values = [value for points, _label, _color in series for value in points]
    low = min(all_values)
    high = max(all_values)
    span = max(1, high - low)
    lower = max(0, low - span // 10)
    upper = high + max(1, span // 10)
    if upper <= lower:
        upper = lower + 1

    canvas.text(85, 25, f"{scenario.replace('_', ' ')} - TOTAL SUPPLY", scale=3)
    canvas.text(85, 70, "M CROC", color=(90, 95, 100), scale=2)
    for tick in range(6):
        y = top + (bottom - top) * tick // 5
        value = upper - (upper - lower) * tick // 5
        canvas.line(left, y, right, y, (225, 228, 232))
        canvas.text(10, y - 7, str(value), (85, 90, 95), scale=1)
    canvas.line(left, top, left, bottom, (45, 50, 55), 2)
    canvas.line(left, bottom, right, bottom, (45, 50, 55), 2)

    for day in (1, 15, 30, 45, 60):
        x = left + (right - left) * (day - 1) // (DAY_COUNT - 1)
        canvas.line(x, bottom, x, bottom + 6, (45, 50, 55))
        canvas.text(x - 8, bottom + 13, str(day), (85, 90, 95), scale=1)
    canvas.text(430, 670, "DAY", (50, 55, 60), scale=2)

    for points, label, color in series:
        xy = []
        for index, value in enumerate(points):
            x = left + (right - left) * index // (DAY_COUNT - 1)
            y = bottom - (value - lower) * (bottom - top) // (upper - lower)
            xy.append((x, y))
        for first, second in zip(xy, xy[1:]):
            canvas.line(first[0], first[1], second[0], second[1], color, 2)

    for index, (_points, label, color) in enumerate(series):
        y = 125 + index * 42
        canvas.line(870, y + 7, 915, y + 7, color, 3)
        canvas.text(930, y, label, (40, 45, 50), scale=2)
    canvas.png(path)


def write_csv(path, rows):
    if not rows:
        raise ValueError("cannot write an empty simulation")
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument(
        "--replay-schedule",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "docs" / "simulation" / "replay_schedule.csv",
    )
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for scenario in SCENARIOS:
        scenario_rows = []
        series = []
        color_index = 0
        for crowd in CROWD_SIZES:
            for target in TARGETS:
                rows = run_scenario(scenario, crowd, target)
                scenario_rows.extend(rows)
                millions = [row["total_supply_yocto"] // 10**24 for row in rows]
                series.append((millions, f"N={crowd} T={target}", COLORS[color_index]))
                color_index += 1
        write_csv(args.output_dir / f"{scenario}.csv", scenario_rows)
        write_chart(args.output_dir / f"{scenario}.png", scenario, series)

    replay_rows = run_replay_schedule(args.replay_schedule, target=40)
    write_csv(args.output_dir / "replay_reference.csv", replay_rows)
    final = replay_rows[-1]
    summary = "\n".join([
        "Fixed replay: weekend_dips, 100 humans, target 40, 60 days",
        f"pool_yocto={final['pool_yocto']}",
        f"treasury_yocto={final['treasury_yocto']}",
        f"total_supply_yocto={final['total_supply_yocto']}",
        f"streak={final['streak']}",
        f"longest_streak={final['longest_streak']}",
    ]) + "\n"
    (args.output_dir / "replay_summary.txt").write_text(summary, encoding="utf-8")
    print(summary, end="")
    print(f"Wrote four scenario CSV files and four PNG charts to {args.output_dir}")


if __name__ == "__main__":
    main()
