# CROC contract progress

- **Done:** Step 0 — synchronized `WHITEPAPER.md`, appended the requested authority and workflow rules to `AGENTS.md`, and committed as `256cd97`.
- **Done:** Step 1 — reviewed and attempted each requested skill once. NEAR skill install did not start because Python was unavailable. Superpowers was not installed: its specified install file returned 404 and the official Codex app path requires a Plugins-panel click.
- **Done:** Step 2 — CI log workflow committed and pushed as `e510c49b7ecf775c37f84cb8e32874e6cffbee7f`. The `ci-logs` branch wrote the matching-SHA report. GitHub's Actions API and raw file URL returned 404, so reports were retrieved by read-only Git fetch.
- **Done:** Step 3 — panic API stubs compiled and ran in Actions at `8c60263553cb649f376487fd54002df5f4fba1d5`. The log showed 9 TODO-stub failures; 7 broad `#[should_panic]` tests were labeled `ok` because any panic satisfied them, which is not behavioral verification. Wasm build completed.
- **Done:** State and views were added. The first CI attempt (`0caa33f`) found two invalid `.copied()` calls; they were removed.
- **Failing:** CI for `296488f78815f98f19ee5cb7f214c8c2fcaba44f` compiled and ran all 16 tests, but 9 still failed at intentional `storage_deposit` or `settle` stubs. Seven broad panic tests were labeled `ok` due to TODO panics. Wasm build completed. No test is reported as passing.
- **In progress:** Settlement implementation (max 7 completed days per call, ordered records, exact pool and treasury math, supply cap, streak updates, and events). It has not been run in Actions yet.
- **Next:** Commit and push settlement; inspect the report for its exact commit SHA before adding check-in logic.
