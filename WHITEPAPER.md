# Crying Croc ($CROC): white paper (v5, matches RULES.md)

**Authority:** RULES.md is the source of truth for contract behavior. If this document and RULES.md disagree, RULES.md wins. Ask the builder before changing anything listed under "Decisions".

Status: design locked, contract not yet written. Tests are written first and run only on GitHub Actions.

## 1. What we are building

A fungible token (NEP-141) on NEAR whose supply reacts to the community. Each day, wallets check in once. If at least TARGET wallets check in, new coins are minted and shared among that day's checkers, and 10% of the batch goes to the treasury. If not, 5% of the treasury is burned and the streak resets. The longest streak is shown like a high score. Mascot: a crying crocodile (crocodile tears = fake crying = bot wallets).

Hackathon: NEAR Hackathon 2026, track "Memecoins With Mechanics". Deadline 14 Nov 2026 23:59 UTC. Aim to submit by 13 Nov.

## 2. What the track requires (from the track page)

- NEP-141 token with the mechanic inside the contract, not a backend someone could switch off.
- All parameters (target, mint size, burn size) set at launch, readable by anyone, no admin key that can change them.
- Sybil resistance good enough for a demo, with its limits written plainly in the README.
- A page with the current streak, today's progress and a log of every mint and burn.
- A 60-day simulation of community behavior under a few scenarios.
- Judging: Claude Code and Codex screen every submission first (does it run, does it match the README), then human judges. The mechanic is scored, not the price chart.
- Submission: public GitHub repo, public X demo post tagging @NEARProtocol and #NEARHackathon, and a form with both links and a NEAR wallet address.

## 3. How it works (plain language)

- 1B max supply. At launch: 300M in a burn-only treasury (the contract's own balance), 700M unminted emission pool. No presale, no team, no admin.
- Day = floor(block_timestamp_ns / DAY_LENGTH_NS). Contracts cannot act on their own, so the first call after a day ends closes it (settle). Anyone can call settle(), max 7 days per call, each day exactly once, check-ins and claims blocked while a backlog exists.
- Good day (check-ins >= TARGET): pot = floor(pool/200). 90% split equally among checkers (floor per checker, dust not minted), 10% to the treasury, streak +1.
- Missed day: burn floor(treasury * 5/100), streak = 0, no mint.
- Lazy claim: your reward for your last check-in day is paid on your next check-in or on claim(), exactly once. Per account store only last_checkin_day and a resolved flag. Per settled day store checker_count and reward_per_checker.
- Check-in requires NEP-145 storage registration (the user pays their own deposit; the contract never spends its own NEAR on strangers). No minimum balance.

## 4. Parameters per deployment (fixed at init, no update method)

| Copy | Day length | Target | Purpose |
|---|---|---|---|
| Test config | 24h | 40 | Large-crowd tests and simulation replay |
| Fast copy | 5 minutes | 5 | Live testing and the demo video (run only while in use, 288 days per real day) |
| Final copy | 24h | 5 | Submission |

Target guidance: set it below the expected quiet-day check-ins. Rule of thumb for about a 1% accidental miss chance: target = N*p - 2.3*sqrt(N*p*(1-p)), where N is registered wallets and p is the quiet-day check-in rate.

## 5. Numbers (all formulas, integer math in the contract)

- Day-1 pot 3,500,000. Day-1 reward per checker = 3,150,000 / checkers.
- Share of the 700M pool minted if every day succeeds: 14% by day 30, 26% by day 60, 50% by day 138, 84% by day 365, 90% by day 459.
- Treasury burned after missed days (not necessarily consecutive): 1 = 5%, 3 = 14%, 7 = 30%, 14 = 51%, 30 = 79%.
- Total supply never exceeds 1B. Supply = treasury + minted - burned.
- Bot share of a day's checker pot = bots / (humans + bots). Examples: 200 humans with 120 bots = 37.5%, with 1,000 bots = 83%. 10,000 humans with 1,000 bots = 9.1%, with 5,000 bots = 33%. 60,000 humans with 1,000 bots = 1.6%.
- At large crowds a fixed target of 5 or 40 is always met, so burns stop happening. A mainnet version would need a re-chosen target and fresh simulations (parameters are immutable after deploy).

## 6. Bots and fake wallets (README must say this plainly)

The contract only sees addresses, not people. One person with many wallets can take a large share, and bots that start on day 1 can keep the target met forever. What we do: required storage registration (a small deposit per wallet), a published bot attack run with real numbers, and an honest README. We do not claim one human per wallet.

## 7. Decisions (do not re-open without asking the builder)

Removed from v1: personal streak multiplier and snooze (our own simulation showed they do not stop bots that start on day 1, and they add test cases).

Rejected: refundable bond in v1 (moves real NEAR, the riskiest code; stretch goal only if all core tests are green by 11 Nov); rewards proportional to balance (new wallets would earn nothing); adaptive target formula (track says parameters are fixed at launch); contract-paid storage (drainable); hand-written token (use near-contract-standards); sentinel values for "paid" (use the resolved flag).

Kept: lazy claim, 7-day settle cap, 90/10 split, burn-only treasury.

## 8. Most likely AI-written bugs (check these first)

1. Claim ordering: pay the previous unresolved day, mark resolved, then record today. Never overwrite before paying. Never pay twice.
2. Settlement pointer: each day settled exactly once, in order, backlog blocks check-ins.
3. Rounding and dust: use the exact formulas in RULES.md, supply accounting must match.
4. Treasury versus emission pool confusion.
5. Time units: block_timestamp is nanoseconds.

Also: overflow-checks = true, storage_unregister must be refused while a reward is unresolved (even with force), and no admin or upgrade path.

## 9. Testing and execution rules

- Rust is NOT installed on the builder's PC and will not be. GitHub Actions compiles and tests. Never claim a test passes; the builder pastes the Actions result back.
- Never edit, skip or weaken a test to turn it green. If a test seems wrong, stop and explain.
- Required tests: check-in twice rejected; unregistered cannot check in; claim twice rejected; pending reward paid before a new check-in; settle() safe to call twice; 3-day backlog settles in order and blocks check-ins; exact rounding; target met exactly and missed by one (burn exactly 5%); supply never above 1B; unregister refused with unresolved reward (with and without force); a zero-check-in day burns 5%; claim blocked during backlog.
- Later: a gas test for settle() with 7 days and 40 check-ins each; a simulation script (60 days, several crowds and a bot scenario) with a chart; a replay test comparing contract supply to the simulation; a bot-farm script on testnet that saves real results.
- Deploying and running scripts without local Rust: propose a way (GitHub Actions manual workflow with testnet-only secrets, or Node-based scripts). Never commit keys. Testnet only. Never ask for or print any recovery phrase.

## 10. Deliverables

Contract and tests; simulation script and chart; bot attack script and saved results; a `status` command printing today's check-ins, streak, longest streak, pool and treasury; a live-data web page (crying croc, ticker, streak, today's progress, full mint/burn log, honest limits page, built after the contract works); README (how it works, how to run, bot limits, scaling tables, test results); final steps: run all tests on the final deployment, then delete the contract's access keys and link the explorer page showing none remain.

## 11. Out of scope

Personal multipliers, snooze, bonds, balance-based rewards, adaptive targets, NFTs, governance, trading pools, mainnet, animations and analytics.

## 12. Schedule

8 Nov: core logic passing tests in Actions. 10 Nov: deployed on testnet and working. 11 Nov: feature freeze. 13 Nov: submit. If late, cut in this order: wallet check-in button, live run with friends, scaling section. Never cut the tests, the key-deletion proof or the honest README.
