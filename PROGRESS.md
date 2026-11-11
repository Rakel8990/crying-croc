# Project progress

Updated 2026-11-11. Cargo is not installed on the developer PC; builds and unit tests run in GitHub Actions.

## Done

- Phase 1 items 1.1–1.5: metadata name and test; four read-only contract views and five tests; current-brand references in documentation; manual-only testnet playground workflow; keeper target configuration file.
- Latest completed matching main CI report: SHA `6c1b6cd7bc349988e19f753ee46684fa31abd44c`; `41 passed; 0 failed`; actionlint completed, release Wasm build completed; overall result `SUCCESS`.
- Existing testnet results: fast smoke run `42470768543`; final deployment and key-removal proof `42612804896`; keeper runs `42774913344` and `42776383812`.
- The 60-day simulations, charts, replay test, and reviewer documentation are present in the repository.
- The sandbox gas workflow remains manual and experimental; no gas run is claimed.

## In progress

- Milestone workflow reliability: bounded retries and boundary-based sleeps were committed as `0274a65` and pushed to `milestone`; Actions verification is pending.
- Milestone FT event verification: `internal_transfer` emits a NEP-141 transfer; the redundant manual event and import were removed. Its exactly-one-event test is included in `6c1b6cd` and covered by the matching successful 41-test CI report.
- Adaptive-target evidence simulation and report are written in `scripts/simulate_adaptive_target.py` and `docs/simulation/adaptive_target.md`, with an SVG chart. The local PC has no Python runtime, and the existing Actions workflow does not run this script, so Python execution/output regeneration is unverified.

## Not done

- The playground workflow has not been dispatched. No deployment was run as part of this update.
- Phase 2.2: milestone flags, exact basis-point settlement, treasury-to-escrow movement, combined reward payout, and bonus data in `get_day` are implemented.
- Phase 2.3: simulation and replay model the one-time bonuses, track daily escrow and treasury, and generate separate treasury charts. A milestone-only workflow runs the script, compares the supplemental replay fixture, and saves CSV/PNG output as an Actions artifact.
- Phase 2.4: a manual-only milestone testnet workflow uses five faucet-funded checkers and fast settings. It checks seven consecutive settlements and day-seven bonus accounting, claims the combined reward, verifies day eight pays no second bonus, and publishes only to `ci-logs`. It has not been dispatched.
- A day-50 milestone is not specified: the provided schedule gives rates only for days 7, 15, 25, and 100. No rate was invented.
- Testnet settle gas measurement remains outstanding.
- The first milestone deployment attempt (`43024199638`) deployed successfully, then failed reading the block timestamp. Its sanitized logs omit the HTTP status, so no status code is claimed.
- The probe testnet run was reported as successful in the handoff, but its run ID is not recorded in the available repository notes.

## Verification

- Unit-test definitions: 32 existing plus 9 milestone tests (41 total; milestone event test awaits Actions verification).
- Phase 1 final verified commit: `ab3c12db1e5c97934e09828c57bff333a04b97ca`.
- Latest Phase 2 main CI: SHA `6c1b6cd7bc349988e19f753ee46684fa31abd44c`; `41 passed; 0 failed`; Wasm build succeeded; actionlint step completed before tests.
- Phase 2 simulation workflow: run `42984363756` for SHA `7fddc7bbf7b1bf7b69dcd174225574ba6017e584` completed successfully.
- Earlier failed attempts: SHA `851ffb8` failed the added replay-file comparison because of a line-ending mismatch; SHA `f8d994a` and `7315b72` each had 39 passed and the replay test failed against a fixture that still had the old columns. The fixture and comparison setup were corrected; the latest matching reports above succeeded.
- No Cargo command was run on this PC.
