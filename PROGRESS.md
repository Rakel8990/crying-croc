# Project progress

Updated 2026-11-11. Cargo is not installed on the developer PC; builds and unit tests run in GitHub Actions.

## Done

- Phase 1 items 1.1–1.5: metadata name and test; four read-only contract views and five tests; current-brand references in documentation; manual-only testnet playground workflow; keeper target configuration file.
- Latest completed matching main CI report before the milestone stub: SHA `74c19c51d85c6bb33bc4fa74dfdb5bd46e52e9f5`; `32 passed; 0 failed`; release Wasm build completed; overall result `SUCCESS`.
- Existing testnet results: fast smoke run `42470768543`; final deployment and key-removal proof `42612804896`; keeper runs `42774913344` and `42776383812`.
- The 60-day simulations, charts, replay test, and reviewer documentation are present in the repository.
- The sandbox gas workflow remains manual and experimental; no gas run is claimed.

## In progress

- Phase 2.1: eight milestone tests were added on branch `milestone` before production changes. The existing 32 tests were left unchanged. The milestone tests assert the 7, 15, 25, and 100 thresholds, one-time payment, exact movement and rounding, claim and lazy payout, zero-rounded bonus handling, and no bonus on a missed day. The production logic is not written yet.

## Not done

- The playground workflow has not been dispatched. No deployment was run as part of this update.
- The milestone workflow is a stub only; the real milestone workflow is not written yet.
- Phase 2 milestone-bonus production logic, simulation/replay updates, and its branch workflow are not done.
- A day-50 milestone is not specified: the provided schedule gives rates only for days 7, 15, 25, and 100. No rate was invented.
- Testnet settle gas measurement remains outstanding.
- The probe testnet run was reported as successful in the handoff, but its run ID is not recorded in the available repository notes.

## Verification

- Existing unit-test count: 32; 8 milestone tests are now added on `milestone` (40 total definitions, pending CI).
- Phase 1 final verified commit: `ab3c12db1e5c97934e09828c57bff333a04b97ca`.
- No Cargo command was run on this PC.
