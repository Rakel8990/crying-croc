# CROC streak coin: RULES v5 (final)
TOKEN: NEP-141 via near-contract-standards, 1B max, 18 decimals,
integer math only, overflow-checks = true.
Launch: 300M in a burn-only treasury (the contract's own balance).
700M unminted emission pool. No presale, no team, no admin.

PARAMS fixed at init, no update method, readable by view calls:
DAY_LENGTH_NS, TARGET. day_index = block_timestamp_ns / DAY_LENGTH_NS.
Test config: 24h days, target 40. Fast copy: 5-minute days, target 5.
Final copy: 24h days, target 5.

SETTLE: anyone calls settle(). Max 7 days per call, each day exactly once.
Check-in and claim are blocked while a backlog exists.

CHECK-IN: once per account per day, NEP-145 storage-registered, no
minimum balance. Per account store last_checkin_day plus a resolved flag.
Order inside check_in: reject on backlog; pay the previous unresolved day
from its settled record; set resolved; record today.

GOOD DAY (check-ins >= TARGET):
  pot = floor(remaining_pool / 200)
  treasury_part = floor(pot / 10)
  checker_part = floor(pot * 90 / 100)
  per_checker = floor(checker_part / count)
  Mint per_checker * count + treasury_part. Dust is not minted.
  The full pot leaves the pool. Streak +1.
MISSED DAY: burn floor(treasury * 5 / 100). Streak = 0. No mint.

CLAIM: pays the last unresolved day exactly once.
storage_unregister is refused while a reward is unresolved, even with force.
EVENTS: every check-in, mint, burn, claim and streak change.
VIEWS: params, current streak, longest streak, today's count, pool,
treasury.
INVARIANTS: supply never above 1B. No hidden mint. No upgrade path.
Delete the contract keys only at the very end after final tests.
