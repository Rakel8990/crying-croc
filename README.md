# Crycodile ($CROC)

> The tears are fake. The burn is real.

**Status:** NEAR testnet only. Not audited. No sale, no price. Built for NEAR Hackathon 2026, track **Memecoins With Mechanics**. MIT license.

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

## Links

| What | Where |
|---|---|
| Live app | https://crycodile.vercel.app |
| Demo video | https://x.com/22kian_eth/status/2121729005124522212 |
| Demo post on X | https://x.com/22kian_eth/status/2121729005124522212 |
| Contract (final, keys deleted) | `croc-final-43570992494-1.testnet` |
| Explorer | https://testnet.nearblocks.io/address/croc-final-43570992494-1.testnet |
| Deployment proof | `docs/testnet/final/` and https://github.com/Rakel8990/crying-croc/actions/runs/43570992494 |
| Repository | https://github.com/Rakel8990/crying-croc |

## How the mechanic works

| Rule | What the contract actually does |
|---|---|
| Standards | Fully implements NEP-141 (Fungible Token), NEP-145 (Storage Management), and NEP-148 (Metadata). |
| Supply | 1,000,000,000 CROC maximum, 18 decimals. At launch 300,000,000 are held by the contract as a burn-only treasury; 700,000,000 are an uncreated emission pool. |
| Day | `day = block_timestamp_ns / 86400000000000` (a UTC day). `day_length_ns` and `target` are fixed at deploy. |
| Check-in | `check_in()` once per account per day. The account must first register with a small NEP-145 storage deposit. No minimum balance. Check-in pays any pending reward from a previous settled day before recording today. |
| Closing a day | Contracts cannot act on their own, so anyone calls `settle()` after a day ends. It closes at most 7 days per call, each day exactly once. A scheduled GitHub Action (`keeper.yml`) calls it daily at 00:15 UTC to keep the engine running. |
| Good day (≥ 5 check-ins) | `pot = floor(pool / 200) = 0.5%` of the remaining pool. 90% is split equally among that day's checkers (`per_checker = floor(checker_part / count)`); dust is not minted. 10% is minted into the treasury. Streak +1. |
| Missed day (< 5 check-ins) | 5% of the treasury is burned. Streak resets to 0. Nothing is minted. The emission pool is untouched. |
| Rewards | Because a day isn't finalized until it ends, rewards are claimable the next day. They are held in an internal escrow ledger entry (`escrow.<contract>`). Paid exactly once, on your next `check_in()` or when you call `claim()`. The escrow is not a real account; only the contract can move its tokens, guaranteeing lazy claims never expire. |
| Settlement safety | `claim()` requires the day to be settled first. This guarantees the contract pays you the exact correct amount based on the final number of check-ins. |
| Milestone bonus | When the community streak first reaches 7, 15, 25, or 100 days, the treasury pays a one-time bonus of 1%, 1.5%, 2.5%, or 5% of its balance to that day's checkers. It is moved from the treasury to escrow, not minted. Each milestone pays once ever (`milestones_paid` view). |
| Transfers | `ft_transfer` and `ft_transfer_call` are hard-blocked for the treasury and escrow. The treasury is burn-only; the escrow can only pay through the contract's internal resolver. |
| Unregister | `storage_unregister` is refused while a reward is unresolved, even with `force = true`. If the reward is resolved, unregistering burns the caller's remaining CROC balance. The treasury and escrow can never unregister. |
| No admin | There is no `set_target`, no upgrade, no pause, no owner field. After deploy and `new()`, every access key was deleted on-chain. |
| Events | Every state change emits an on-chain event: `ft_mint`, `ft_burn`, `ft_transfer`, plus custom `check_in`, `claim`, `settled_day`, and `streak_change`. |

### Example: 48 hours in the pond (Kian's story)

**Day 1: The Smile**  
Kian connects his wallet and clicks "Check In." He is one of exactly 5 wallets that show up today. Because the target of 5 is met, the contract triggers a Good Day:

- The daily pot is 3,500,000 CROC (0.5% of the remaining pool).
- 90% is split among the 5 checkers. Kian earns exactly 630,000 CROC.
- 10% (350,000 CROC) is minted to the treasury.
- The streak goes up by 1.

Kian doesn't have to write anything down. The live app immediately shows his 630,000 CROC sitting in "Pending Rewards." The tokens are safely held in the contract's internal escrow.

**Day 2: The Tears**  
The next day, only 2 people show up. The target of 5 is missed. The contract triggers a Missed Day:

- Zero tokens are minted.
- The streak instantly resets to 0.
- The contract takes 5% of the entire treasury and burns it on-chain forever. Supply just shrank.

**The Claim**  
Later that day, Kian opens the app again. He sees the "Pending Rewards" balance is still there. He clicks "Claim." Because Day 1 is already settled, the contract safely transfers his exact 630,000 CROC from escrow into his wallet.

Burning reduces supply. It does not promise any price.

## Try it (Do X, See Y)

Follow these steps in order. You do not need a wallet to verify steps 1 through 4.

### 1. View the live dashboard
- **Do:** Open https://crycodile.vercel.app
- **See:** The current streak, today's check-in progress, and the mascot. No wallet required to view.

### 2. Verify the target is immutable
- **Do:** Run this exact command in your terminal:
  ```bash
  curl -s -X POST https://rpc.testnet.near.org -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"call_function","account_id":"croc-final-43570992494-1.testnet","method_name":"target","args_base64":"e30=","finality":"final"}}' | jq -r '.result.result | implode'
  ```
- **See:** `5` (The target is hardcoded, no admin can change it).

### 3. Verify the keys are deleted (No admin)
- **Do:** Run this exact command in your terminal:
  ```bash
  curl -s -X POST https://rpc.testnet.near.org -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"query","params":{"request_type":"view_access_key_list","account_id":"croc-final-43570992494-1.testnet","finality":"final"}}' | jq '.result.keys'
  ```
- **See:** `[]` (An empty array. Nobody holds a key to upgrade or pause the contract).

### 4. Verify the code matches the repository
- **Do:** Look at the deployment proof in `docs/testnet/final/result.json`.
- **See:** The `onchain_code_hash` (`3XFpskxNZx2dnewRdSZWfC94ewP1Aj79YBx5NyBF5kRG`) exactly matches the hash of the Wasm file in the repo.

### 5. Run the automated tests
- **Do:** Clone the repo and run `cargo test` in the terminal.
- **See:** `41 passed; 0 failed` (This includes the 60-day independent integer model replay).

### 6. Live check-in (Requires Testnet Wallet)
- **Do:** On the live app, connect a Meteor Wallet (set to Testnet), register, and click "Check In". Sign the transaction.
- **See:** A success message and a transaction hash on the NEAR Explorer. If 5 wallets check in, the streak advances. If it misses, the next `settle()` call will burn 5% of the treasury.

## Evidence

Every claim in this repository is verified below: the immutable deployment, the programmable treasury milestones, the 60-day simulation, and the live UI.

| Evidence | What it shows | Where |
|---|---|---|
| Final deployment run 43570992494 | Deploy and `new()` in one transaction with two actions (`8BNW7DpPPDQwQtk7mT5G9KtjKbV21f2ioVwwCMrcgsGP`). Wasm hash exactly matches the on-chain code hash. All keys deleted (`G2ZyrHdp5r6RfjKvym5BMHuKFZAFKps7xD43bYkTNCnu`). Empty key list afterwards. Balance ~9.997 NEAR, storage in use 339,771 bytes. | `docs/testnet/final/` |
| Milestone test run 43231347872 | Fresh contract, 5 check-ins/day for 8 days. Day-7 bonus moved exactly 2,874,135 CROC from treasury to escrow, supply unchanged by the bonus, exactly one transfer event. One claim paid reward plus bonus (about 1,186,161 CROC), no second bonus on day 8. | `docs/testnet/milestone/` |
| Fast copy smoke test 42470768543 | Deploy, 5 users register and check in, the day is settled, and one claim pays exactly 630,000 CROC, with the balances moving by exactly that. | `docs/testnet/fast/` |
| 41 unit tests | Single check-in, single claim, reward paid before new check-in, settle safe to call twice, backlog handling, rounding/dust, target met/missed, supply cap, unregister refusal, milestone bonuses, views. | `src/tests.rs` |
| Simulation & replay | 4 situations over 60 days, and a replay test through the real contract code against an independent integer model. | `docs/simulation/`, `scripts/` |
| Adaptive Target Simulation | Proves that without ZK human gates, bots can artificially spike an adaptive target and leave, forcing real users to miss the target and burn the treasury. Validates our fixed target of 5. | `docs/simulation/adaptive_target.md` |
| Live Dashboard | Reads directly from the contract. Tracks on-chain metrics (Total Supply, Treasury, Emission Pool), Community Stats (Current Streak, Daily Target, Milestone Tracker), and the Protocol Activity ledger (Settlement history / mint & burn log). | [crycodile.vercel.app](https://crycodile.vercel.app/protocol-stats#activity) |

## Simulation and scale

- If every day succeeds, about 14% of the pool is created by day 30 and 26% by day 60.
- Treasury burned after missed days (not necessarily in a row): 1 day 5%, 7 days 30%, 14 days 51%, 30 days 79%.
- With no check-ins at all, the treasury melts to almost nothing in about a year.
- A fixed target must sit below the quiet-day crowd. With a crowd far above it, no day is ever missed and nothing burns. The target is a deployment setting, so a mainnet version would choose it for its expected crowd.

## Sybil Defense & Why the Target is Fixed at 5

We don't pretend the contract can see humans. It sees wallets. One person with 100 wallets can take a massive share of the daily pot. We built the math to show exactly what that looks like.

Share of a day's checker pot taken by one bot operator = `bots / (humans + bots)`

| Real checkers | 120 bot wallets | 1,000 bots | 5,000 bots |
|---|---|---|---|
| 200 | 37.5% | 83.0% | 96.0% |
| 10,000 | 1.2% | 9.1% | 33.0% |
| 60,000 | 0.2% | 1.6% | 7.7% |

To fight this, the only friction on testnet is the NEP-145 storage deposit (which is nearly free on testnet, but becomes a real capital cost on mainnet).

### Why is the target fixed at 5? (The Adaptive Target Trap)

A common idea for memecoins is an adaptive target (e.g., scaling the target to 80% of the 7-day median check-ins). We built a full simulation of this (`docs/simulation/adaptive_target.md`), and the math revealed a fatal flaw:

Without a ZK proof-of-humanity gate, bots can weaponize an adaptive target. A bot farm can artificially spike the target to 100 for a few days, then leave. The real community is suddenly forced to try and hit an impossible number, causing the treasury to burn to zero.

Because we could not deploy a live ZK verifier on testnet in time, we locked the target at 5. It is a deliberate defensive choice to protect real humans from coordinated bot griefing.

For a production mainnet deployment, a larger refundable bond and a holding requirement would price out bots. The ultimate fix is a ZK proof-of-personhood credential (like the NEAR I-Am-Human registry), ensuring one human equals one check-in. None of these can be truthfully demonstrated on testnet today, so we built the hardest game possible using only on-chain economic friction.

## What we skipped on purpose, and why

| Idea | Why it is not in this build |
|---|---|
| Adaptive target & ZK bot gates | We simulated an adaptive target and proved it's unsafe without a live ZK proof-of-humanity gate on testnet. If bots inflate the target and then leave, the real community is forced to hit an impossible number, causing false treasury burns. Because we couldn't demo ZK on testnet, we locked the target at 5 to keep the game fair. The bot-spike simulation is in `docs/simulation/adaptive_target.md`. |
| Weekly challenge pools & badges | Adding new payout and claim logic right before the deadline introduces too much smart contract risk. We built an evidence-only simulation of how bots could capture this pool in `docs/simulation/adaptive_target.md`. |
| $NEAR All-Time High trigger | The idea was to double the mint percentage whenever $NEAR hits a new ATH. This requires an external price oracle feed, which introduces a point of failure and breaks our core rule of having fixed, immutable on-chain parameters. |
| Seeding a trading pool | There is no pre-created supply to seed a pool with. No presale, no team coins, and the treasury is strictly burn-only. |

## Known limitations

Why we document these: Crying Croc has no admin keys and no upgrade path. Once deployed, the rules are permanent. Because the contract cannot be patched later, we believe absolute transparency about its operational edges is required. Hiding these would be a security risk to future users.

- **Unclaimed rewards stay in escrow forever.** There is no expiry or recovery. *(Why: An expiry function would require an admin override, which breaks the "no admin" rule. Lazy claims are safe and permanent.)*
- **Anyone can send tokens into the treasury.** *(Why: The treasury is a public account. Donations change the math for future burns, but they do not mint new tokens or break the contract.)*
- **Settlement requires a trigger.** Blockchains cannot execute code autonomously at midnight. Our GitHub Keeper calls `settle()` daily. If the Keeper goes offline, the game pauses until anyone in the world manually calls `settle()`. The burn only happens when this function is triggered.
- **Storage requires a NEAR balance.** The contract pays storage rent out of its own NEAR balance (about 9.997 NEAR at deployment) to save the per-day records. Anyone can top it up with a plain transfer. If the balance hits zero, the state would freeze.
- **Wallet connection currently uses Meteor Wallet via the NEAR wallet selector.** Reading data on the website requires no wallet.
- **The target is fixed at 5.** This guarantees a fair start for a new community, but if the protocol scales to thousands of daily users, the target will always be met. A mainnet deployment would require an adaptive target (safely scaled against bots) or a newly calculated starting target.
- **Testnet only.** The contract is not audited. AI-assisted reviews are not a professional security audit.

## Future Explorations (If we ever go to mainnet)

The current testnet contract is immutable and its keys are deleted. If the community grows and we decide to launch a mainnet version, it would require a fresh deployment with new parameters.

We include this section to show our long-term vision. These are not hard commitments or promises, but rather the architectural ideas we have in mind if we scale.

If CROC moves to mainnet, our thought process looks like this:

- **The V2 Upgrade:** A new contract would be deployed. We would likely split the treasury into a permanent burn portion and a locked liquidity portion, allowing the contract to seed a DEX pool (like Rhea) instantly upon deployment.
- **The Adaptive Target:** We locked the target at 5 for this testnet build to protect the community from bot griefing. On mainnet, we might introduce an adaptive target (e.g., scaling to 80% of the 7-day median check-ins), but only if it is paired with a live ZK proof-of-humanity gate to prevent bots from manipulating the threshold.
- **Weekly Challenge Pools:** To keep engagement high after the initial hype fades, we could introduce a weekly challenge pool. Users would stake CROC to commit to a 7-day streak; those who survive split the pool.
- **Permissionless Liquidity:** We would never hold a presale. If users earn CROC, they can freely open liquidity pools on NEAR DEXs without our permission.

Ultimately, we are open to exploring any new mechanic, tool, or integration in the future as long as it strengthens the game, benefits the community, and helps CROC grow.

No price is promised. The token is an on-chain game mechanic, not an investment.

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

**AI use.** Built with AI assistance: smart contract and engineering supported by Claude, Codex, and DeepSeek; UI designed with v0.

## License

MIT
