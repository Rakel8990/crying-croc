# NEAR testnet deployment and test plan

**Plan only. Nothing in this document deploys or changes a contract.** No deployment workflow is being added by this task. Keep every action on NEAR testnet; never put a mainnet account or key in these workflows.

## Security design

- Future deployment, bot, status, gas-measurement, and key-removal workflows should use `workflow_dispatch` only. They must accept a `copy` (`fast` or `final`), `day_length_ns`, and `target`, and reject values that do not match the selected copy: fast is 300,000,000,000 ns and target 5; final is 86,400,000,000,000 ns and target 5. The test config (24-hour days, target 40) is for CI/replay, not a deployment copy.
- Pin the GitHub runner to `main`, use a protected `near-testnet` GitHub Environment with required reviewer approval, and never accept a branch/ref or RPC URL from workflow inputs. Hard-code the testnet RPC endpoint. Keep `GITHUB_TOKEN` permissions minimal; only the results publishing job needs `contents: write`.
- Store only the disposable testnet contract account IDs and their corresponding testnet private keys as GitHub Environment secrets/variables. The repo is public: no key, mnemonic, recovery phrase, signed transaction, or key-containing artifact may enter the repository or Actions output. Expose secret values only to the single transaction step through environment variables; do not pass them as command-line arguments. Disable shell tracing, never print the process environment, mask any derived sensitive values, and make scripts log only public account IDs, transaction hashes, receipt gas numbers, and sanitized errors. GitHub masking is a backup, not a reason to print secrets.
- A runner should write temporary key material only under its temporary directory with restrictive permissions, delete it in an `always()` cleanup step, and never upload it as an artifact. Bot keys should be generated in memory during a single run, with bots funded as temporary subaccounts; do not persist those keys between runs.
- Build the Wasm from the checked-out commit using the existing Rust toolchain setup. Use a locked Node runtime and exact `near-api-js` dependency version for transaction scripts; commit its lockfile when those scripts are implemented. Keep Rust off the builder's PC.

## Manual workflows to implement later

Each workflow below is a design, not an existing workflow.

1. **`deploy-testnet.yml` — manual deploy/init.** `workflow_dispatch` inputs are `copy`, `day_length_ns`, and `target`. Validate the exact pair, build `wasm32-unknown-unknown --release`, then use a testnet-only signer from the protected environment. For the selected, separate contract account, submit a transaction containing Wasm deployment and `new({"day_length_ns": ..., "target": ...})`; confirm its successful receipt and read back `day_length_ns()` and `target()`. Never redeploy or reinitialize an existing account implicitly. Require a separate explicit replacement confirmation if a later design ever permits replacement.
2. **`testnet-operations.yml` — status, bot, and real gas runs.** Inputs include the copy and an operation (`status`, `bot-checkins`, `bot-farm`, or `settle-gas`). The status operation calls public views and prints today's check-ins, current streak, longest streak, emission pool, and treasury. Bot operations create several temporary funded test accounts, pay their NEP-145 registration deposit, and submit check-ins. A bot-farm run reports the registered accounts, check-ins, successes/misses, and resulting balances without claiming one wallet is one person. The gas run records the actual `settle()` transaction hash and gas burnt from the transaction outcome and each receipt outcome, plus the block height and RPC/network. Never estimate gas from a local or sandbox measurement and label it as a real receipt.
3. **`remove-testnet-keys.yml` — final cleanup only.** `workflow_dispatch` requires the exact contract account ID, copy name, and a confirmation string such as `DELETE_ALL_KEYS_FOR_THIS_TESTNET_ACCOUNT`. Validate the ID against the recorded testnet deployment result and require protected-environment approval. At the very end, submit `delete_key` actions for the contract account's access keys, then query the access-key list and save a proof with the account ID, transaction hash, and empty key list. Do this only after final contract tests, gas/bot runs, and result publishing; deletion is irreversible for that signer. Do not print or publish any key.

Use only successfully finalized receipts. For real gas, retain per-receipt `gas_burnt` as well as transaction status; a failed or timed-out call is reported as a failure, never as a successful measurement. `settle()` is capped at seven elapsed days per call. For the requested 7-day/40-check-in-per-day test on the fast copy, check in 40 test accounts during each five-minute day, wait until the seventh day has elapsed, then call `settle()` and record the real transaction/receipt gas. This takes at least about 35 minutes of chain time, in addition to runner and transaction waits.

## Results handling

Each run should save a sanitized, machine-readable CSV/JSON report and a short text summary, named with the tested source SHA, copy, and run ID. Publish these files to a SHA-specific directory on `ci-logs` using a narrowly scoped `GITHUB_TOKEN`. Do not put secrets or raw environment/config dumps in results. Once reviewed, copy the verified outputs into `docs/testnet/` in a normal commit on `main`; the docs commit should link to the originating SHA and transaction explorer pages. Never overwrite a result from a different SHA.

## Exact human actions (three)

1. **Create and fund two disposable testnet contract accounts.** Open [MyNearWallet testnet](https://testnet.mynearwallet.com/) → **Create account** → **Get started**, create the fast account, then use the wallet's **Add a Custom Address → Reserve my Account ID** flow for a separate final account if named account creation is available on testnet. Secure each key in the wallet; never paste a recovery phrase into chat, Actions, or this repository. Then open [NEAR testnet faucet](https://near-faucet.io/) → enter each public account ID in **Wallet Address** → choose an amount → **Request**. Faucet UI labels or availability may change; if it cannot fund the accounts, stop rather than substitute mainnet funds. This cannot safely be automated end-to-end because account creation/faucet authorization and any anti-abuse checks are controlled by the wallet/faucet, and Actions cannot securely write a newly generated private key into GitHub Secrets.
2. **Add the two disposable identities and keys to the protected GitHub Environment.** In the repository, click **Settings → Environments → New environment** (or select `near-testnet`), add required reviewers, then use **Add secret** for all four values: `CROC_FAST_ACCOUNT_ID`, `CROC_FAST_PRIVATE_KEY`, `CROC_FINAL_ACCOUNT_ID`, and `CROC_FINAL_PRIVATE_KEY`. The exact path is **Repository → Settings → Environments → near-testnet → Add secret**. Account IDs are not confidential, but storing them as secrets keeps the deployment configuration together. This handoff must be manual because the workflow is deliberately not allowed to display a secret or call GitHub's secret-writing interface; GitHub documents creating secrets through this UI and passing them explicitly to a workflow.
3. **Dispatch each later run and approve only the intended testnet action.** Open **Repository → Actions → `Deploy CROC to NEAR testnet` → Run workflow**, select branch `main`, select `fast` or `final`, and enter the matching day length and target. Review and approve the `near-testnet` environment deployment when GitHub prompts. Run the operations workflow through **Actions → `CROC testnet operations` → Run workflow**. Run key removal only as the final action through **Actions → `Remove CROC testnet keys` → Run workflow**, and type the full confirmation string for the exact account. These clicks remain manual by design: they are the human go/no-go gate for spending testnet funds, running bot activity, and irreversibly removing the last access keys.

## Risks and handling

| Risk | Handling |
|---|---|
| Testnet key leaks through logs, artifacts, process arguments, or public commits | Disposable testnet-only accounts; GitHub Environment secrets; explicit per-step env exposure; no shell tracing or secret output; sanitize logs; no key artifacts; cleanup temporary files; review every workflow diff before enabling it. Never use mainnet keys. |
| Public repository code or an untrusted ref can access deployment secrets | Dispatch only from `main`; enforce allowed branches on the protected `near-testnet` Environment; require a reviewer; no secrets on pull-request or push workflows; do not let inputs select code refs or RPC endpoints. |
| Faucet limits, cooldown, or service outage | Request funds manually for the two contract accounts; treat the faucet as best effort. If funding is insufficient, pause. Do not automate retries or use mainnet funds. |
| NEAR RPC/faucet rate limits or congestion | Keep bot concurrency low, use bounded exponential backoff only for read calls and explicitly retryable submissions, avoid duplicate transactions, save transaction hashes, and stop on ambiguous transaction status to avoid double actions. |
| Accidentally deploying the wrong settings or overwriting a live testnet copy | Allow only the two exact copy settings; read back immutable views after initialization; require a new disposable account for replacement rather than silently redeploying. |
| Key deletion locks the contract account permanently | Separate, final manual workflow; exact account ID and typed confirmation; protected reviewer approval; perform only after all tests/results/proofs; verify the access-key list is empty immediately after the deletion receipt. |
| Testnet gas/faucet results are not mainnet guarantees | Label all results as testnet observations with timestamp, SHA, network, and transaction/receipt references. |

## Estimated GitHub Actions time

| Order | Work | Approximate Actions time |
|---:|---|---:|
| 1 | Build Wasm and validate dispatch inputs | 2–5 minutes |
| 2 | Deploy and initialize one selected copy; read back parameters | 2–5 minutes |
| 3 | Status view calls | Under 1 minute |
| 4 | Create/fund temporary bots, register, and run one-day check-ins | 3–10 minutes, depending on RPC confirmation |
| 5 | Bot-farm run and result collection | 5–20 minutes, depending on account count and throttling |
| 6 | Seven-day real settle-gas run with 40 check-ins each day on the fast copy | At least 35 minutes of chain time, typically 40–55 minutes total |
| 7 | Publish sanitized results to `ci-logs`; later copy reviewed results to `docs/` | 1–3 minutes for publish; docs copy is a separate commit and ordinary CI run |
| 8 | Final explicit key deletion and empty-key-list proof | 2–5 minutes |

These are estimates, not measured run durations. Faucet/account setup is human time and is not included in Actions minutes.

## References

- [NEAR CLI guide: testnet faucet account creation and contract deploy/init](https://github.com/near/near-cli-rs/blob/main/docs/GUIDE.en.md)
- [near-api-js: Node transaction and contract-call library](https://github.com/near/near-api-js)
- [NEAR testnet faucet](https://near-faucet.io/)
- [GitHub Docs: create and use Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
