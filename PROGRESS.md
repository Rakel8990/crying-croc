# CROC contract progress

- **Done:** Project skeleton and CI workflow committed as `f4078ba`.
- **Done:** Added the supplied white paper as `WHITEPAPER.md`; `RULES.md` remains authoritative for contract behavior.
- **In progress:** Step 1 — test-first coverage has been expanded and is awaiting GitHub Actions. Tests have not been run locally; this PC has no Cargo, and it must not be installed here.
- **Failing:** The prior Actions run stopped at compile time because the empty contract lacks methods used by the tests (31 compiler errors were reported). The new and adjusted tests have not yet run in Actions.
- **Next step:** Push the latest local commit and wait for the GitHub Actions result for the expanded tests before writing contract logic.

- **Done:** Step 0 synchronized WHITEPAPER.md to the supplied v5 text and appended the requested authority and workflow rules to AGENTS.md.
- **Done:** Step 1 reviewed both requested skills and attempted each once. NEAR skill: not installed because its installer could not start (`Python was not found`). Superpowers: not installed because the specified `.codex/INSTALL.md` returned 404; the official Codex app path requires a Plugins-panel click.
- **In progress:** Step 2 — adding the CI log loop. No push has been made yet.
- **Next:** Push the CI workflow and verify the run and matching-SHA log from the `ci-logs` branch.
