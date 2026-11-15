# Crycodile ($CROC)

> The tears are fake. The burn is real.

**Status:** NEAR testnet only. Not audited. No sale, no price. Built for NEAR Hackathon 2026, track **Memecoins With Mechanics**. MIT license.

## Links

| What | Where |
|---|---|
| Live app | https://crycodile.vercel.app |
| Demo video | https://x.com/22kian_eth/status/2121729005124522212 |
| Demo post on X | https://x.com/22kian_eth/status/2121729005124522212 |
| Contract (final, keys deleted) | `croc-final-43570992494-1.testnet` |
| Explorer | https://testnet.nearblocks.io/address/croc-final-43570992494-1.testnet |
| Deployment proof | `docs/testnet/final/` and https://github.com/Rakel8990/crying-croc/actions/runs/43570992494 |
| Repository | https://github.com/Rakel8990/crying-croc (the repo keeps its first name) |

## The Story Behind Crycodile 🐊

### Why Crycodile?

The name comes from two things: *cry* and *crocodile*. It's also a little play on the expression *crocodile tears* when someone cries, but you're never quite sure how genuine those tears are.

Our crocodile has a reason to cry. Actually, two.

Think of the community as the ones who brought Crycodile into the world. They're his parents, and he's their slightly dramatic child. He needs attention every day. You can't just adopt a crocodile and forget to feed him.

The community has to show up, check on him, and reach the daily target to keep things going.

When they do, new $CROC is created from the emission pool. 90% of the daily reward pot is shared among that day's check-ins, and the remaining 10% returns to the treasury. The streak continues.

That's when the tears disappear. He's just a crocodile again, chilling like nothing happened.

But when the target is missed, nobody gets rewarded. The streak resets, and 5% of the treasury is permanently burned.

That's when Crycodile comes out.

He's crying because his community didn't make it that day. He's also crying because 5% of his treasury just went up in smoke. Poor guy. Or maybe not. After all, crocodile tears are supposed to be fake.

And Crycodile isn't just a character watching numbers change. His mood follows what actually happens on-chain.

The website tracks contract activity and switches between two mascot videos: Crycodile chilling when the community succeeds, and Crycodile crying when the target is missed and the treasury is burned. No AI pretending to be alive, no person choosing his mood. The contract determines the outcome; the website brings it to life.

### We Created Him. The Community Owns His Future.

Here's the part that matters.

We came up with Crycodile. We designed him, built the contract, and brought him to life. But we didn't build him so that a development team could hold onto the controls forever.

There are no team tokens, no presale, and no admin keys. The contract's settings are fixed at deployment. After deployment and initialization, every contract access key was deleted on-chain.

And that changes things.

From that moment on, developers no longer have the keys to step in and change the rules, upgrade the contract, or decide what happens next. Crycodile isn't something the team can steer whenever it wants. His future is in the hands of the people who show up and participate.

We created Crycodile, but we don't own his future. That's the community's.

The starting treasury holds 300 million CROC, while another 700 million CROC remains in the emission pool, subject to the contract's daily reward rules.

Nobody gets to simply decide to mint more because they feel like it. The rules are already there. The community determines the daily outcome by participating.

We gave Crycodile a name, a face, and a home. The community gives him a reason to wake up every day.

And if nobody does? Well, you know what happens to Crycodile.

## How the mechanic works

| Rule | Behavior |
|---|---|
| Supply | 1,000,000,000 CROC maximum, 18 decimals. At launch 300,000,000 are held by the contract as a burn-only treasury, and 700,000,000 are an uncreated pool. |
| Day | `day = block_timestamp_ns / 86400000000000` (a UTC day). |
| Check-in | `check_in()` once per account per day. The account must first register with a small NEP-145 storage deposit. No minimum balance. |
| Closing a day | A contract cannot act on its own. Anyone calls `settle()` after a day ends. It closes up to 7 days per call, each day exactly once. Check-ins and claims are blocked while days are unsettled. A scheduled GitHub Action (`keeper.yml`) calls it daily at 00:15 UTC. |
| Good day (at least 5 check-ins) | pot = floor(pool / 200), which is 0.5% of the remaining pool. 90% is split equally among that day's checkers (rounded down, dust not created). 10% is created into the treasury. Streak +1. |
| Missed day (fewer than 5 check-ins) | 5% of the treasury is burned. Streak resets to 0. Nothing is created. The pool is untouched. |
| Rewards | Held in an internal escrow entry (`escrow.<contract>`) and paid exactly once, on your next check-in or when you call `claim()`. Nobody can sign as the escrow entry: only the contract account could create it, and its keys are deleted. |
| Milestone bonus | When the community streak first reaches 7, 15, 25 or 100 days, the treasury pays a one-time bonus of 1%, 1.5%, 2.5% or 5% of its balance to that day's checkers. It is moved from the treasury to escrow, not created. Each milestone pays once ever. |
| Unregister | `storage_unregister` is refused while a reward is unpaid, even with `force`. |

Example. Day 1: 5 wallets check in. The pot is 3,500,000 CROC, so 3,150,000 is shared (630,000 each, which happened on testnet) and 350,000 goes to the treasury. Day 2: only 2 wallets show up. 5% of the treasury is burned and the streak is 0.

Burning reduces supply. It does not promise any price.

## Try it (do X, see Y)

Set these in a bash shell (needs `curl` and `jq`):

```
RPC=https://test.rpc.fastnear.com
CONTRACT=croc-final-43570992494-1.testnet
```

1. **Open the app** at https://crycodile.vercel.app. You see the live streak, today's check-ins against the target, the treasury, and the milestone tracker. No wallet needed.
2. **Read a setting.** See `5`:
   ```
   curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"call_function","account_id":"'$CONTRACT'","method_name":"target","args_base64":"e30=","finality":"final"}}' | jq -r '.result.result | implode'
   ```
   Other views with no arguments: `day_length_ns` (`86400000000000`), `current_streak`, `longest_streak`, `today_checkins`, `emission_pool`, `treasury`, `ft_total_supply`, `next_day_to_settle`, `milestones_paid`. At launch the treasury is `300000000000000000000000000`. It is lower after missed days are settled.
3. **Confirm nobody can change the contract.** See an empty list (`[]`):
   ```
   curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_access_key_list","account_id":"'$CONTRACT'","finality":"final"}}' | jq '.result.keys'
   ```
4. **Confirm the deployed code is this repository's code.** See `3XFpskxNZx2dnewRdSZWfC94ewP1Aj79YBx5NyBF5kRG`:
   ```
   curl -s -X POST $RPC -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_account","account_id":"'$CONTRACT'","finality":"final"}}' | jq -r '.result.code_hash'
   ```
   The workflow compared it with the SHA-256 of the exact Wasm it built (`25778fb1169cf17c048bfafb803fefe0d89a671c08d7d673e533de430c6846cb`, the same value in base58). The proof is in `docs/testnet/final/`.
5. **Run the tests.** See 41 tests pass: `cargo test` (needs Rust). They also run on every push in GitHub Actions (`test.yml`).
6. **See the 60-day simulation.** Workflow `simulation.yml`. Tables and charts are in `docs/simulation/`.
7. **Check in yourself.** Open the app, connect a NEAR testnet wallet, register (small deposit), and press Check in. Once the day is settled, press Claim. You can also call `storage_deposit`, `check_in`, `settle` and `claim` directly from the explorer's contract page.

## Evidence

| Evidence | What it shows | Where |
|---|---|---|
| Final deployment, run 43570992494 | Deploy and `new()` in one transaction with two actions (`8BNW7DpPPDQwQtk7mT5G9KtjKbV21f2ioVwwCMrcgsGP`). Wasm hash equals on-chain code hash. All keys deleted (`G2ZyrHdp5r6RfjKvym5BMHuKFZAFKps7xD43bYkTNCnu`). Empty key list afterwards. Balance about 9.997 NEAR, storage in use 339,771 bytes. | `docs/testnet/final/` |
| Milestone test, run 43231347872 | Fresh contract, 5 check-ins a day for 8 days. Day-7 bonus moved about 2,874,135 CROC from treasury to escrow, supply unchanged by the bonus, exactly one transfer event, one claim paid reward plus bonus (about 1,186,161 CROC), no second bonus on day 8. | `docs/testnet/milestone/` |
| Fast copy smoke test, run 42470768543 | Deploy, 5 users register and check in, the day is settled, and one claim pays exactly 630,000 CROC with the balances moving by exactly that. | `docs/testnet/fast/` |
| 41 unit tests | Single check-in, single claim, reward paid before a new check-in, settle safe to call twice, backlog handling, rounding and dust, target met exactly and missed by one, supply cap, unregister refusal, milestone bonuses, views. | `src/tests.rs` |
| Simulation and replay test | Four situations over 60 days, and a replay of a 60-day schedule through the real contract code against an independent integer model. | `docs/simulation/`, `scripts/` |

## Simulation and scale

- If every day succeeds, about 14% of the pool is created by day 30 and 26% by day 60.
- Treasury burned after missed days (not necessarily in a row): 1 day 5%, 7 days 30%, 14 days 51%, 30 days 79%.
- With no check-ins at all, the treasury melts to almost nothing in about a year.
- A fixed target must sit below the quiet-day crowd. With a crowd far above it, no day is ever missed and nothing burns. The target is a deployment setting, so a mainnet version would choose it for its expected crowd.

## Bots and fake wallets: limits, stated plainly

The contract counts wallets, not people. One person with many wallets can take a large share of each day's reward and can keep the target met.

What exists today: one check-in per account per day, a required NEP-145 storage deposit per wallet (nearly free on testnet because test NEAR is free, a real cost on mainnet), and the published numbers below. Nothing here proves one human per wallet.

Share of a day's checker pot taken by one operator = bots / (humans + bots):

| Real checkers | 120 bot wallets | 1,000 bots | 5,000 bots |
|---|---|---|---|
| 200 | 37.5% | 83% | 96% |
| 10,000 | 1.2% | 9.1% | 33% |
| 60,000 | 0.2% | 1.6% | 7.7% |

Explored for mainnet, not built: a larger refundable bond, a holding requirement, and proof-of-personhood such as zero-knowledge credentials or a NEAR proof-of-human registry (for example I-Am-Human). None can be demonstrated on testnet, and a money-based gate means nothing when test NEAR is free.

## What we skipped on purpose, and why

| Idea | Why it is not in this build |
|---|---|
| Adaptive target (simulated, not implemented) | The track asks for parameters fixed at launch, bots can raise the target and then stop (which burns the treasury), and it is new logic with no key left to fix a bug. Our simulation compares three rules. In the bot-spike scenario a median-based rule misses days 8 to 11 and burns about 55.5M CROC, while the min-based rule `max(5, floor(0.5 x lowest of the last 7 days))` avoids those misses. See `docs/simulation/adaptive_target.md`. |
| Governance or voting | Contradicts fixed parameters and no admin. |
| Zero-knowledge or proof-of-human gate | No verifier we could demonstrate on testnet, and it needs time. |
| Weekly challenge pool, soulbound badges | New payout and claim logic with no time to prove it. Evidence-only simulation of the pool's bot capture is in `docs/simulation/adaptive_target.md`. |
| Yapper, staker or community-fund rewards | Would need an admin or an oracle. The treasury is burn-only. |
| NEAR price or ATH trigger | Needs a price feed and breaks fixed parameters. |
| Admin key or upgrade path | Would break the central claim. |
| Seeding a trading pool | There is no pre-created supply: no presale, no team coins, and the treasury is burn-only. |

## Known limitations

- Unclaimed rewards stay in escrow forever. There is no expiry or recovery.
- Anyone can send tokens into the treasury, which changes the size of later burns.
- Someone must close each day. The keeper does it daily. If it fails, anyone can call `settle()`.
- With a very large crowd, a fixed target is always met and nothing burns.
- The contract pays storage for its small per-day records from its NEAR balance (about 9.997 NEAR at deployment). Anyone can top it up with a plain transfer.
- The mascot on the page reacts to today's live progress (crying while today's check-ins are below the target, happy once it is reached). The burn itself only happens when the day is settled.
- Wallet connection currently uses Meteor Wallet through the NEAR wallet selector. That is a current choice, not a commitment. Reading data needs no wallet.
- Testnet only. Not audited. AI-assisted reviews are not a professional audit.

## Mainnet plan (not built)

A mainnet version would be a new contract with its target and numbers chosen again, since nothing can change after the keys are deleted. Phase 0: check-in only, no sale. Phase 1: anyone who earned CROC and holds NEAR can open a pool on a NEAR exchange, with no permission needed. Phase 2: a new contract that seeds a locked pool at deployment, with the treasury split into a burn part and a liquidity part, plus stronger sybil gates. No price is promised.

## Hackathon track mapping

| Track wording | Implementation |
|---|---|
| Supply that reacts to the community | Check-ins decide whether coins are created (good day) or the treasury is burned (missed day). |
| Treasuries with rules | 10% of each good day goes in, 5% burns on each missed day, milestone bonuses move treasury coins to checkers once each. |
| Onchain rituals and challenges | The daily check-in, and the 7, 15, 25 and 100 day streak milestones. |
| Mechanic in the contract, not a backend | Every rule is in `src/lib.rs`. |
| Parameters fixed at launch, readable, no admin | `target()` and `day_length_ns()` are views, no update method, access keys deleted. |
| Page with streak, progress and log | The app shows the streak, today's progress, the milestone tracker and the settled-day log. |
| 60-day simulation | `docs/simulation/`. |

## Repository map

- `src/` the contract (`lib.rs`) and its 41 tests (`tests.rs`)
- `RULES.md` the rules, `REVIEW.md` a reviewer's guide (functions, invariants, tests)
- `config/contracts.json` the contract the keeper settles
- `scripts/` simulation and RPC helper scripts
- `web/` the app (Next.js)
- `docs/testnet/` sanitized results of the real testnet runs, `docs/simulation/` simulation outputs, `docs/DEPLOY_PLAN.md` deployment design, `docs/internal/` historical design notes
- `.github/workflows/` tests, simulation, testnet deployment and test runs, the daily keeper

## Built with

Rust, near-sdk 5.17.2, near-contract-standards 5.17.2 (NEP-141, NEP-145, NEP-148), near-cli-rs 0.31.1 and actionlint 1.7.12 (in GitHub Actions only), Python (simulations), GitHub Actions. App: Next.js, React, Tailwind CSS, Framer Motion and the NEAR wallet selector with Meteor Wallet (see `web/package.json`).

**AI use.** The builder is not a developer and directed the work with AI tools. The contract, tests, simulations and workflows were written by AI coding agents (OpenAI Codex, Google Antigravity). The UI was built with v0 and Antigravity. Claude, ChatGPT, DeepSeek and Gemini were used for design, review and guidance. The mascot artwork was generated. All results above come from real GitHub Actions and testnet runs, which are published.

## License

MIT
