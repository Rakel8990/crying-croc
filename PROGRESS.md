# Project progress

Updated 2026-11-11. Cargo is not installed on the developer PC; builds and unit tests run in GitHub Actions.

## Done

- Phase 1 items 1.1–1.5: metadata name and test; four read-only contract views and five tests; current-brand references in documentation; manual-only testnet playground workflow; keeper target configuration file.
- Latest completed matching main CI report before the milestone stub: SHA `74c19c51d85c6bb33bc4fa74dfdb5bd46e52e9f5`; `32 passed; 0 failed`; release Wasm build completed; overall result `SUCCESS`.
- Existing testnet results: fast smoke run `42470768543`; final deployment and key-removal proof `42612804896`; keeper runs `42774913344` and `42776383812`.
- The 60-day simulations, charts, replay test, and reviewer documentation are present in the repository.
- The sandbox gas workflow remains manual and experimental; no gas run is claimed.

## In progress

- Phase 2.2: milestone flags, exact basis-point settlement, treasury-to-escrow movement, combined reward payout, and the updated day view have been added on `milestone`; matching Actions verification is pending.

## Not done

- The playground workflow has not been dispatched. No deployment was run as part of this update.
- The milestone workflow is a stub only; the real milestone workflow is not written yet.
- Phase 2 simulation/replay updates and the real milestone branch workflow are not done.
- A day-50 milestone is not specified: the provided schedule gives rates only for days 7, 15, 25, and 100. No rate was invented.
- Testnet settle gas measurement remains outstanding.
- The probe testnet run was reported as successful in the handoff, but its run ID is not recorded in the available repository notes.

## Verification

- Unit-test definitions: 32 existing plus 8 milestone tests (40 total); the latest milestone source SHA awaits Actions.
- Phase 1 final verified commit: `ab3c12db1e5c97934e09828c57bff333a04b97ca`.
- No Cargo command was run on this PC.
