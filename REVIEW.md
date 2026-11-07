# CROC contract review guide

`RULES.md` is authoritative. This document maps the current implementation and tests to the main review questions; it does not change the contract rules.

## Five likely bug areas (WHITEPAPER.md §8)

| Bug area | Handling code | Tests |
|---|---|---|
| Claim ordering, overwrite, and duplicate payment | `Contract::check_in`, `Contract::resolve_pending_reward`, `Contract::claim` | `pending_reward_is_paid_before_a_new_check_in_is_recorded`, `claim_twice_is_rejected`, `claim_on_the_same_day_as_check_in_is_rejected_until_settlement`, `claim_moves_exactly_the_recorded_reward_from_escrow_to_claimer`, `storage_unregister_with_force_is_refused_for_unresolved_reward`, `storage_unregister_without_force_is_refused_for_unresolved_reward` |
| Settlement pointer, exactly-once ordering, and backlog blocking | `Contract::settle`, `Contract::settle_one_day`, `Contract::check_in`, `Contract::claim` | `settle_is_safe_to_call_twice`, `ten_day_backlog_settles_seven_days_then_the_remaining_three`, `check_in_is_blocked_until_a_three_day_backlog_is_cleared`, `three_day_backlog_settles_in_day_order_and_then_allows_check_in`, `skipped_days_block_check_in_until_settle_is_called`, `claim_is_rejected_while_a_backlog_exists`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
| Integer rounding and unminted dust | `Contract::settle_one_day` | `exact_rounding_leaves_checker_dust_unminted`, `target_met_exactly_is_successful`, `target_missed_by_one_burns_exactly_five_percent_of_treasury`, `zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
| Treasury versus emission pool accounting | `Contract::new`, `Contract::treasury`, `Contract::emission_pool`, `Contract::settle_one_day` | `exact_rounding_leaves_checker_dust_unminted`, `target_missed_by_one_burns_exactly_five_percent_of_treasury`, `zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury`, `claim_moves_exactly_the_recorded_reward_from_escrow_to_claimer`, `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
| Nanosecond timestamps and day boundaries | `Contract::new`, `Contract::check_in`, `Contract::settle`, `Contract::today_checkins` | `controllable_clock_uses_the_selected_day`, `check_in_twice_in_one_day_is_rejected`, `skipped_days_block_check_in_until_settle_is_called`, `three_day_backlog_settles_in_day_order_and_then_allows_check_in`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |

## Public methods and who can call them

No owner or administrator role exists. Init arguments are immutable.

| Public method | Caller / access |
|---|---|
| `new(day_length_ns, target)` | Any account may initialize an uninitialized contract once; requires positive values. |
| `check_in()` | A registered caller, at most once per day, after clearing any settlement backlog. Pays a prior unresolved reward before recording today's check-in. |
| `settle()` | Anyone; processes up to seven elapsed days in order. |
| `claim()` | A registered caller with an unresolved settled reward, after clearing any backlog. |
| `day_length_ns()`, `target()`, `current_streak()`, `longest_streak()`, `today_checkins()`, `emission_pool()`, `treasury()` | Public read-only views; any caller. |
| `ft_transfer(receiver_id, amount, memo)` | Registered token holder; NEP-141 requires one yoctoNEAR. Treasury and derived reward escrow cannot send. Receiver must be registered. |
| `ft_transfer_call(receiver_id, amount, memo, msg)` | Same caller and deposit rules as `ft_transfer`; asynchronous receiver call is resolved through the private callback. Treasury and derived escrow cannot send. |
| `ft_total_supply()`, `ft_balance_of(account_id)` | Public NEP-141 read-only views. |
| `ft_resolve_transfer(sender_id, receiver_id, amount)` | Private NEP-141 callback; only callable by the contract itself. |
| `storage_deposit(account_id, registration_only)` | Payable NEP-145 method; caller can fund registration according to standard rules. |
| `storage_withdraw(amount)` | Registered caller withdrawing their own available storage balance, subject to NEP-145 rules. |
| `storage_unregister(force)` | Caller unregisters their own account. Refused while a reward is unresolved even when `force` is true; treasury and escrow registrations are permanent. |
| `storage_balance_bounds()`, `storage_balance_of(account_id)` | Public NEP-145 read-only views. |
| `ft_metadata()` | Public NEP-148 metadata view. |

Test-only helpers such as `balance_of`, `total_supply`, and `last_settled_day` are compiled only under `cfg(test)` and are not deployed contract entry points.

## Supply invariant

The expected accounting identity is `total_supply = treasury balance + reward escrow balance + all user balances`, and supply must remain at or below 1,000,000,000 CROC. The contract uses the NEP-141 token ledger's `total_supply`; the treasury is the contract account's balance, and unpaid checker rewards are held by the derived escrow account (`escrow.` plus the contract account ID). `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer` checks the identity through a good day, claim, missed day, and transfer. `total_supply_never_exceeds_one_billion` checks the cap. The 60-day replay test independently checks the identity and cap each day, along with pool, treasury, and streak values.

## Differences from RULES.md

- **Reward escrow:** RULES.md specifies lazy payment but does not prescribe an escrow account. The account is derived as `escrow.` plus the contract account ID (for example, `escrow.croc.testnet`); earned checker rewards are minted there and transferred to each user on their next check-in or `claim()`. The treasury and derived escrow are both blocked from initiating ordinary FT transfers; escrow can only pay through `resolve_pending_reward`.
- **Unregister burn:** NEP-141 standard storage unregistration removes a caller's remaining token balance. This implementation emits the standard burn event for that balance. RULES.md requires refusing unregistration during an unresolved reward but does not describe what happens to an otherwise eligible unregistering holder's balance.
- **Additional settlement record fields:** Each day record also retains success, treasury-minted amount, and burned amount for the emitted settlement event, alongside the checker count and per-checker reward described in the design.

No other intentional change to the CROC arithmetic or user rules is known. There is no admin or upgrade method.

## Test inventory

- `check_in_twice_in_one_day_is_rejected` — rejects a second check-in from the same account on the same day.
- `unregistered_account_cannot_check_in` — rejects check-in without NEP-145 registration.
- `claim_twice_is_rejected` — permits resolving a reward only once.
- `claim_on_the_same_day_as_check_in_is_rejected_until_settlement` — checks the exact failure when a user claims before their check-in day has been settled.
- `pending_reward_is_paid_before_a_new_check_in_is_recorded` — pays yesterday's reward before recording a new check-in.
- `settle_is_safe_to_call_twice` — a repeated settlement call does not settle the same day twice.
- `ten_day_backlog_settles_seven_days_then_the_remaining_three` — verifies the seven-day per-call limit and that a second call settles the remaining three days.
- `check_in_is_blocked_until_a_three_day_backlog_is_cleared` — rejects check-in while settlement is behind.
- `three_day_backlog_settles_in_day_order_and_then_allows_check_in` — settles three elapsed days in order and permits check-in after clearing them.
- `skipped_days_block_check_in_until_settle_is_called` — a time jump blocks check-in until settlement runs.
- `exact_rounding_leaves_checker_dust_unminted` — floors per-checker allocation and leaves residual dust unminted.
- `target_met_exactly_is_successful` — treats a count exactly equal to target as a successful day.
- `target_missed_by_one_burns_exactly_five_percent_of_treasury` — burns exactly the floored five percent when one below target.
- `zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury` — applies the same burn to a settled day with no check-ins.
- `total_supply_never_exceeds_one_billion` — verifies supply remains within the one-billion cap.
- `storage_unregister_with_force_is_refused_for_unresolved_reward` — refuses unregister with `force` while reward is unresolved.
- `storage_unregister_without_force_is_refused_for_unresolved_reward` — refuses unregister without `force` while reward is unresolved.
- `claim_is_rejected_while_a_backlog_exists` — rejects claiming while elapsed days remain unsettled.
- `controllable_clock_uses_the_selected_day` — uses the mocked nanosecond clock to select the expected day and daily count.
- `reward_escrow_cannot_transfer_with_ft_transfer` — rejects a direct escrow transfer.
- `reward_escrow_cannot_transfer_with_ft_transfer_call` — rejects an escrow transfer-call.
- `treasury_cannot_transfer_with_ft_transfer` — rejects a direct treasury transfer with the expected burn-only message.
- `treasury_cannot_transfer_with_ft_transfer_call` — rejects a treasury transfer-call with the expected burn-only message.
- `claim_moves_exactly_the_recorded_reward_from_escrow_to_claimer` — verifies the first claim credits exactly the recorded reward and debits escrow by the same amount.
- `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer` — checks supply components after mint, claim, burn, and user transfer.
- `sixty_day_replay_matches_independent_reference_and_simulation_csv` — compares 60 daily contract settlements against independent Rust integer calculations and the checked-in simulation reference CSV.

## Known limitations

- The contract sees account addresses, not people. One person can use many wallets; the 120-bot scenario shows bots can help keep the target met.
- Targets and day length are fixed at initialization. Different deployments require fresh simulations.
- The 60-day files are deterministic scenarios, not observed user behavior or a forecast.
- Rust and Cargo are intentionally not installed on the developer PC. Compilation and tests must be evaluated from GitHub Actions reports for the exact commit SHA.
- The sandbox settle gas workflow is manual and experimental. `settle()` processes at most seven days per call; its per-day work uses stored counters. Real gas still needs measurement on testnet using the five-minute copy.
- Unclaimed rewards remain in escrow indefinitely until the account claims or checks in again.
- Anyone can transfer tokens into the treasury or derived escrow account. Such donations change treasury burn sizes or the escrow balance; they do not mint tokens.
- Contract initialization must be atomic with Wasm deployment so no other caller can initialize the account first.
- The contract's NEAR balance pays for its per-day records. Measure storage per day on testnet, fund a stated safety buffer before running, and do not delete contract access keys until all required records and tests are complete.
- No testnet deployment or real-world gas measurement is represented by the unit tests or simulations.
