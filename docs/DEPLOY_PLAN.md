# CROC testnet deployment plan

**Plan only. Do not deploy until the probe succeeds and the builder approves the next stage.** Every account, transaction, faucet request, and RPC endpoint in this plan is NEAR testnet only. No wallet key or recovery phrase is stored as a repository or GitHub secret.

## Operating model

- One self-contained `workflow_dispatch` workflow per copy, selected only from `main`. The only human action is **Actions → Run workflow** for the intended copy. The workflow must also reject runs unless `GITHUB_REF` is `refs/heads/main`.
- Each run creates a fresh testnet account through NEAR CLI's faucet-sponsored account option. It generates the key in the runner, stores it only under `$RUNNER_TEMP` with restrictive permissions, and deletes the key directory in an `always()` cleanup step. Do not cache the home/credential directory or upload it as an artifact. Use `set +x`; never print a key, key file, environment dump, or recovery phrase. Do not use GitHub Secrets.
- The public repository workflow may publish sanitized results with its narrowly scoped `GITHUB_TOKEN`; this token is not a NEAR key. Logs and results contain only public account IDs, non-secret transaction hashes, balances, status values, and real receipt measurements. Sanitize any CLI/RPC diagnostics before printing.
- Pin the near-cli-rs version and installer URL. Keep the testnet RPC URL hard-coded in workflow/script code; do not accept a network, RPC, or source ref as an input.
- Deploying Wasm and calling `new()` must be two ordered actions in **one atomic NEAR transaction**. If either action fails, the transaction must roll back; never deploy and initialize in separate transactions.
- The contract account needs NEAR for deployed code and per-day records. The final workflow must measure storage growth per day on testnet, calculate the projected storage reserve and its 2× buffer, and verify adequate funding before deleting any account key.

## Stage 0: faucet probe (completed)

`probe-testnet.yml` was a tiny manual workflow that installed pinned near-cli-rs in the GitHub runner, created one fresh faucet-sponsored testnet account, queried its balance through the hard-coded testnet RPC, printed only the public account ID and balance, and removed the temporary key files. It did not deploy code. This probe ran from `main` and verified testnet connectivity before contract deployment workflows were written.

If the faucet-sponsored creation fails, stop. Do not build `testnet-fast.yml`, retry with a different account-creation route, or add a fallback that stores credentials elsewhere. Record the exact sanitized CLI/faucet error and the probe commit SHA first.

## Stage 1: fast copy (write only after the probe succeeds)

Create one self-contained `testnet-fast.yml` with `workflow_dispatch` and no inputs that can change its scope: copy is hard-coded to fast, day length is 300 seconds (`300000000000` ns), and target is 5. It must:

1. Check out `main`, verify the ref, install Rust and the `wasm32-unknown-unknown` target in Actions, and build the release Wasm.
2. Create a fresh testnet contract account through the faucet-sponsored option. Keep its key only in the runner temp directory for the current run.
3. Submit one atomic transaction with the Wasm deployment followed by `new({"day_length_ns": 300000000000, "target": 5})`. Check the finalized receipt, then read back and assert `day_length_ns()` and `target()`.
4. Create five funded smoke-test accounts through the faucet (one claimer plus four supporting checkers). Each registers with exactly `storage_balance_bounds().min` and checks in on the same day. Five accounts are needed because this copy's target is 5; a single checker would earn no reward. Wait by polling testnet block timestamps until the next five-minute day, call `settle()`, and have the claimer call `claim()`.
5. Read the claimer and derived escrow (`escrow.` plus contract account ID) balances before and after claiming. Assert that the claim return amount equals the claimer balance increase and escrow decrease, and that the settled day met target. Then print today's check-ins, current streak, longest streak, pool, and treasury.
6. Read gas from the actual finalized transaction and receipt outcomes. Save only sanitized JSON/CSV and a short summary, with source SHA and Actions run ID, under a SHA/run-specific path on `ci-logs`. Copy the reviewed, sanitized output to `docs/testnet/` in a normal commit on `main`.
7. In an `always()` step, delete the contract and smoke-test key files and the temporary CLI home. The fast contract is immutable and has no admin or upgrade method. Its private key is discarded when the run ends; the account's public access-key record remains on testnet.

No bot-farm script, final-copy workflow, or key-deletion workflow is part of this stage.

## Later final-copy design (not to implement yet)

The final copy will use a separate, fresh faucet-sponsored testnet account and one self-contained manual workflow. It will hard-code 24-hour days (`86400000000000` ns) and target 5, build Wasm, atomically deploy and initialize, run the approved smoke checks, record results, and then delete the account's access keys as the final chain action in that same run. Before deletion it must verify all test receipts and results are saved, measure and fund contract storage with a 2× projected storage buffer plus transaction fees, and confirm the exact account ID. The private key stays in the runner temp directory only and is removed in `always()` cleanup whether the run succeeds or fails. No key deletion occurs in the fast-copy stage.

## Risks and handling

| Risk | Handling |
|---|---|
| Generated private key appears in terminal output, process logs, or artifacts | Generate it directly on the ephemeral runner, use a temp-only credentials directory, disable shell tracing, redirect CLI output to temp files, print only allow-listed public fields, redact key-shaped strings from diagnostics, upload no key files, and wipe temp credentials in `always()`. |
| Public code or a dispatch from the wrong branch runs | Reject unless the workflow ref is exactly `main`; no user-controlled ref/RPC inputs; require a human to click the manual dispatch; review the workflow diff before pushing. There are no NEAR secrets in GitHub. |
| Faucet limit, rate limit, or outage | One probe request only. On failure, stop and report the exact sanitized error; do not automatically retry or switch to another account/key method. |
| Faucet creates an account but the runner fails before key cleanup | Use a job-level `always()` cleanup; GitHub-hosted runners are disposable. The account may remain on testnet with an unusable public key, but no private key is retained. |
| Wrong configuration or partial initialization | Hard-code the copy settings; one transaction contains both deploy and `new()`; assert read-back values before any smoke calls. |
| Smoke test does not meet target and therefore has no positive reward | Use exactly five registered checkers on the fast copy and assert the settled day succeeded before interpreting the claim amount. |
| Testnet congestion and variable gas | Label only actual finalized receipt `gas_burnt` values as measurements, include transaction hashes/block height, and report failed or ambiguous transactions without retrying them blindly. |
| Unfunded or underfunded contract storage | Measure per-day storage usage on testnet, compute reserve for the planned horizon, fund 2× that projected storage cost plus a separate transaction-fee reserve, and verify balance before any final key deletion. |

## Estimated Actions time

| Order | Work | Approximate time |
|---:|---|---:|
| 0 | Install CLI and run the faucet probe | 2–5 minutes |
| 1 | Build Wasm and create the fast-copy account | 2–5 minutes |
| 2 | Atomic deploy/init and parameter read-back | 1–3 minutes |
| 3 | Five smoke check-ins, wait for the five-minute boundary, settle, claim, and verify balances | At least 5–8 minutes |
| 4 | Write sanitized output to `ci-logs` and commit reviewed results under `docs/testnet/` | 1–3 minutes |
| Later | Final-copy test run and final key deletion | Not estimated until the probe and fast stage are reviewed |

These are estimates, not measured durations. Faucet and RPC delays may make runs longer.

## References

- [near-cli-rs v0.31.1 release and prebuilt installer](https://github.com/near/near-cli-rs/releases/tag/v0.31.1)
- [near-cli-rs guide: faucet-sponsored account creation](https://github.com/near/near-cli-rs/blob/main/docs/GUIDE.en.md)
- [NEAR JSON-RPC testnet endpoint](https://rpc.testnet.near.org)
