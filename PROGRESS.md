# CROC contract progress

- **Done:** Project skeleton and CI workflow committed as `f4078ba`.
- **Done:** Added the supplied white paper as `WHITEPAPER.md`; `RULES.md` remains authoritative for contract behavior.
- **In progress:** Step 1 — test-first coverage has been expanded and is awaiting GitHub Actions. Tests have not been run locally; this PC has no Cargo, and it must not be installed here.
- **Failing:** The prior Actions run stopped at compile time because the empty contract lacks methods used by the tests (31 compiler errors were reported). The new and adjusted tests have not yet run in Actions.
- **Next step:** Push the latest local commit and wait for the GitHub Actions result for the expanded tests before writing contract logic.

- **Done:** Step 0 synchronized WHITEPAPER.md to the supplied v5 text and appended the requested authority and workflow rules to AGENTS.md.
- **Done:** Step 1 reviewed both requested skills and attempted each once. NEAR skill: not installed because its installer could not start (`Python was not found`). Superpowers: not installed because the specified `.codex/INSTALL.md` returned 404; the official Codex app path requires a Plugins-panel click.
- **Done:** Step 2 workflow pushed in `e510c49b7ecf775c37f84cb8e32874e6cffbee7f`; its CI log was read from the `ci-logs` branch and the SHA matched. The Actions API and raw URL both returned 404, so the log was retrieved with a read-only Git fetch instead.
- **Failing:** On `e510c49b7ecf775c37f84cb8e32874e6cffbee7f`, `cargo test` exited 101 with 39 compile errors because the empty contract has no test API methods. `cargo build --target wasm32-unknown-unknown --release` completed successfully. This is the expected red skeleton state; no tests are reported as passing.
- **Done:** Step 3 compile-only stubs were pushed as `8c60263553cb649f376487fd54002df5f4fba1d5`. CI compiled and ran 16 tests; 9 failed at TODO stubs. Seven broad `#[should_panic]` cases were labeled `ok` because any stub panic satisfies them, so these are not behavioral verification. The Wasm build completed. No test is reported as passing.
- **In progress:** Step 4 — implementing contract parts in the requested order, starting with state and views.
- **Next:** Push the state and views part, then inspect the matching-SHA Actions log.
