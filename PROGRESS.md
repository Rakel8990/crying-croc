# CROC contract progress

- **Done:** Step 0 — synchronized `WHITEPAPER.md`, appended the requested authority and workflow rules to `AGENTS.md`, and committed as `256cd97`.
- **Done:** Step 1 — reviewed and attempted each requested skill once. NEAR skill install did not start because Python was unavailable. Superpowers was not installed: its specified install file returned 404 and the official Codex app path requires a Plugins-panel click.
- **Done:** Step 2 — CI log workflow committed and pushed as `e510c49b7ecf775c37f84cb8e32874e6cffbee7f`. The `ci-logs` branch wrote the matching-SHA report. GitHub's Actions API and raw file URL returned 404, so reports were retrieved by read-only Git fetch.
- **Done:** Step 3 — panic API stubs compiled and ran in Actions at `8c60263553cb649f376487fd54002df5f4fba1d5`. The log showed 9 TODO-stub failures; 7 broad `#[should_panic]` tests were labeled `ok` because any panic satisfied them, which is not behavioral verification. Wasm build completed.
- **Done:** State and views were added. The first CI attempt (`0caa33f`) found two invalid `.copied()` calls; they were removed.
- **Failing:** CI for `296488f78815f98f19ee5cb7f214c8c2fcaba44f` compiled and ran all 16 tests, but 9 still failed at intentional `storage_deposit` or `settle` stubs. Seven broad panic tests were labeled `ok` due to TODO panics. Wasm build completed. No test is reported as passing.
- **Done:** Settlement was pushed as `723246809a6fca6e7b7ebb606c85324110142d0d`; the matching CI log shows `cargo test` ran with 7 failures and `cargo build` completed. CI listed the idempotent-settle and empty-day burn assertions as `ok`; the broader red result is due to remaining registration/check-in stubs. No overall test-suite success is claimed.
- **Done:** Check-in code was pushed as `48f82d8452ba3b2ca2c803c018b797f4df8de0e6`; the matching log shows it compiled, but 7 tests remain red at the `storage_deposit` stub before registered-account checks can run. Wasm build completed. The overall run remains red.
- **Done:** Claim code was pushed as `6f16d2c815b0114d15ab051b6ae3b75bab803989`; it compiled, but 7 tests still stop at `storage_deposit` before reaching claim assertions. Wasm build completed; the full run remains red.
- **In progress:** NEP-141 and NEP-145 storage implementation, including storage funding for per-account check-in state and the unresolved-reward unregister guard. Awaiting CI.
- **Next:** Push the standards/storage part and inspect the matching-SHA report; fix any CI issues without changing tests.
