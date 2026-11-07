# CROC Review Bundle

This file concatenates the current rules, selected white paper section, review guide, contract source, and test files for convenient review.

## RULES.md

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

## WHITEPAPER.md — Section 8

## 8. Most likely AI-written bugs (check these first)

1. Claim ordering: pay the previous unresolved day, mark resolved, then record today. Never overwrite before paying. Never pay twice.
2. Settlement pointer: each day settled exactly once, in order, backlog blocks check-ins.
3. Rounding and dust: use the exact formulas in RULES.md, supply accounting must match.
4. Treasury versus emission pool confusion.
5. Time units: block_timestamp is nanoseconds.
Also: overflow-checks = true, storage_unregister must be refused while a reward is unresolved (even with force), and no admin or upgrade path.

## REVIEW.md

# CROC contract review guide

`RULES.md` is authoritative. This document maps the current implementation and tests to the main review questions; it does not change the contract rules.

## Five likely bug areas (WHITEPAPER.md §8)

| Bug area | Handling code | Tests |
|---|---|---|
| Claim ordering, overwrite, and duplicate payment | `Contract::check_in`, `Contract::resolve_pending_reward`, `Contract::claim` | `pending_reward_is_paid_before_a_new_check_in_is_recorded`, `claim_twice_is_rejected`, `storage_unregister_with_force_is_refused_for_unresolved_reward`, `storage_unregister_without_force_is_refused_for_unresolved_reward` |
| Settlement pointer, exactly-once ordering, and backlog blocking | `Contract::settle`, `Contract::settle_one_day`, `Contract::check_in`, `Contract::claim` | `settle_is_safe_to_call_twice`, `check_in_is_blocked_until_a_three_day_backlog_is_cleared`, `three_day_backlog_settles_in_day_order_and_then_allows_check_in`, `skipped_days_block_check_in_until_settle_is_called`, `claim_is_rejected_while_a_backlog_exists`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
| Integer rounding and unminted dust | `Contract::settle_one_day` | `exact_rounding_leaves_checker_dust_unminted`, `target_met_exactly_is_successful`, `target_missed_by_one_burns_exactly_five_percent_of_treasury`, `zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
| Treasury versus emission pool accounting | `Contract::new`, `Contract::treasury`, `Contract::emission_pool`, `Contract::settle_one_day` | `exact_rounding_leaves_checker_dust_unminted`, `target_missed_by_one_burns_exactly_five_percent_of_treasury`, `zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury`, `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer`, `sixty_day_replay_matches_independent_reference_and_simulation_csv` |
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
| `ft_transfer(receiver_id, amount, memo)` | Registered token holder; NEP-141 requires one yoctoNEAR. Treasury and reward escrow cannot send. Receiver must be registered. |
| `ft_transfer_call(receiver_id, amount, memo, msg)` | Same caller and deposit rules as `ft_transfer`; asynchronous receiver call is resolved through the private callback. Treasury and escrow cannot send. |
| `ft_total_supply()`, `ft_balance_of(account_id)` | Public NEP-141 read-only views. |
| `ft_resolve_transfer(sender_id, receiver_id, amount)` | Private NEP-141 callback; only callable by the contract itself. |
| `storage_deposit(account_id, registration_only)` | Payable NEP-145 method; caller can fund registration according to standard rules. |
| `storage_withdraw(amount)` | Registered caller withdrawing their own available storage balance, subject to NEP-145 rules. |
| `storage_unregister(force)` | Caller unregisters their own account. Refused while a reward is unresolved even when `force` is true; treasury and escrow registrations are permanent. |
| `storage_balance_bounds()`, `storage_balance_of(account_id)` | Public NEP-145 read-only views. |
| `ft_metadata()` | Public NEP-148 metadata view. |

Test-only helpers such as `balance_of`, `total_supply`, and `last_settled_day` are compiled only under `cfg(test)` and are not deployed contract entry points.

## Supply invariant

The expected accounting identity is `total_supply = treasury balance + reward escrow balance + all user balances`, and supply must remain at or below 1,000,000,000 CROC. The contract uses the NEP-141 token ledger's `total_supply`; the treasury is the contract account's balance, and unpaid checker rewards are held by the fixed `rewards.croc` escrow account. `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer` checks the identity through a good day, claim, missed day, and transfer. `total_supply_never_exceeds_one_billion` checks the cap. The 60-day replay test independently checks the identity and cap each day, along with pool, treasury, and streak values.

## Differences from RULES.md

- **Reward escrow:** RULES.md specifies lazy payment but does not prescribe an escrow account. This implementation mints earned checker rewards to the fixed `rewards.croc` account, then transfers each user's reward to them on their next check-in or `claim()`. The treasury and escrow are both blocked from initiating ordinary FT transfers; escrow can only pay through `resolve_pending_reward`.
- **Unregister burn:** NEP-141 standard storage unregistration removes a caller's remaining token balance. This implementation emits the standard burn event for that balance. RULES.md requires refusing unregistration during an unresolved reward but does not describe what happens to an otherwise eligible unregistering holder's balance.
- **Additional settlement record fields:** Each day record also retains success, treasury-minted amount, and burned amount for the emitted settlement event, alongside the checker count and per-checker reward described in the design.

No other intentional change to the CROC arithmetic or user rules is known. There is no admin or upgrade method.

## Test inventory

- `check_in_twice_in_one_day_is_rejected` — rejects a second check-in from the same account on the same day.
- `unregistered_account_cannot_check_in` — rejects check-in without NEP-145 registration.
- `claim_twice_is_rejected` — permits resolving a reward only once.
- `pending_reward_is_paid_before_a_new_check_in_is_recorded` — pays yesterday's reward before recording a new check-in.
- `settle_is_safe_to_call_twice` — a repeated settlement call does not settle the same day twice.
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
- `supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer` — checks supply components after mint, claim, burn, and user transfer.
- `sixty_day_replay_matches_independent_reference_and_simulation_csv` — compares 60 daily contract settlements against independent Rust integer calculations and the checked-in simulation reference CSV.

## Known limitations

- The contract sees account addresses, not people. One person can use many wallets; the 120-bot scenario shows bots can help keep the target met.
- Targets and day length are fixed at initialization. Different deployments require fresh simulations.
- The 60-day files are deterministic scenarios, not observed user behavior or a forecast.
- Rust and Cargo are intentionally not installed on the developer PC. Compilation and tests must be evaluated from GitHub Actions reports for the exact commit SHA.
- The sandbox settle gas workflow is manual and experimental. `settle()` processes at most seven days per call; its per-day work uses stored counters. Real gas still needs measurement on testnet using the five-minute copy.
- No testnet deployment or real-world gas measurement is represented by the unit tests or simulations.

## src/lib.rs

```rust
use near_contract_standards::fungible_token::{
    core_impl::{Balance, FungibleToken},
    events::FtMint,
    FungibleTokenCore,
    FungibleTokenResolver,
    metadata::{FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC},
};
use near_contract_standards::storage_management::{
    StorageBalance, StorageBalanceBounds, StorageManagement,
};
use near_sdk::{
    borsh::BorshSerialize,
    env,
    json_types::U128,
    near,
    NearToken,
    PromiseOrValue,
    store::LookupMap,
    AccountId,
    BorshStorageKey,
    PanicOnDefault,
};

const TOKEN_DECIMALS: u8 = 18;
const INITIAL_TREASURY: Balance = 300_000_000 * 1_000_000_000_000_000_000;
const INITIAL_POOL: Balance = 700_000_000 * 1_000_000_000_000_000_000;

#[near(serializers = [borsh])]
struct AccountProgress {
    last_checkin_day: u64,
    resolved: bool,
}

#[near(serializers = [borsh])]
struct DaySettlement {
    checker_count: u32,
    reward_per_checker: Balance,
    succeeded: bool,
    minted_to_treasury: Balance,
    burned: Balance,
}

#[derive(BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    Token,
    CheckinCounts,
    AccountProgress,
    DaySettlements,
}

const MAX_SUPPLY: Balance = 1_000_000_000 * 1_000_000_000_000_000_000;

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    token: FungibleToken,
    contract_account_id: AccountId,
    reward_escrow_account_id: AccountId,
    day_length_ns: u64,
    target: u32,
    emission_pool: Balance,
    current_streak: u64,
    longest_streak: u64,
    next_day_to_settle: u64,
    checkin_counts: LookupMap<u64, u32>,
    account_progress: LookupMap<AccountId, AccountProgress>,
    day_settlements: LookupMap<u64, DaySettlement>,
}

#[near]
impl Contract {
    #[init]
    pub fn new(day_length_ns: u64, target: u32) -> Self {
        assert!(day_length_ns > 0, "DAY_LENGTH_NS must be greater than zero");
        assert!(target > 0, "TARGET must be greater than zero");

        let contract_account_id = env::current_account_id();
        let reward_escrow_account_id: AccountId = "rewards.croc"
            .parse()
            .expect("fixed reward escrow account is valid");
        let mut token = FungibleToken::new(StorageKey::Token);
        token.internal_register_account(&contract_account_id);
        token.internal_register_account(&reward_escrow_account_id);
        token.internal_deposit(&contract_account_id, INITIAL_TREASURY);
        FtMint {
            owner_id: &contract_account_id,
            amount: U128(INITIAL_TREASURY),
            memo: Some("initial burn-only treasury"),
        }
        .emit();

        let mut contract = Self {
            token,
            contract_account_id,
            reward_escrow_account_id,
            day_length_ns,
            target,
            emission_pool: INITIAL_POOL,
            current_streak: 0,
            longest_streak: 0,
            next_day_to_settle: env::block_timestamp() / day_length_ns,
            checkin_counts: LookupMap::new(StorageKey::CheckinCounts),
            account_progress: LookupMap::new(StorageKey::AccountProgress),
            day_settlements: LookupMap::new(StorageKey::DaySettlements),
        };
        contract.measure_registered_account_storage();
        contract
    }

    pub fn check_in(&mut self) {
        let account_id = env::predecessor_account_id();
        let current_day = env::block_timestamp() / self.day_length_ns;
        assert!(
            self.next_day_to_settle >= current_day,
            "settlement backlog must be cleared before check-in"
        );
        assert!(
            self.token.accounts.contains_key(&account_id),
            "account must register token storage before check-in"
        );
        if let Some(progress) = self.account_progress.get(&account_id) {
            assert_ne!(
                progress.last_checkin_day, current_day,
                "account has already checked in today"
            );
        }

        self.resolve_pending_reward(&account_id, "check_in");

        let count = self.checkin_counts.get(&current_day).copied().unwrap_or(0);
        let new_count = count.checked_add(1).expect("daily check-in count overflow");
        self.checkin_counts.insert(current_day, new_count);
        self.account_progress.insert(
            account_id.clone(),
            AccountProgress {
                last_checkin_day: current_day,
                resolved: false,
            },
        );
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"croc\",\"version\":\"1.0.0\",\"event\":\"check_in\",\"data\":[{{\"account_id\":\"{}\",\"day\":{},\"day_count\":{}}}]}}",
            account_id, current_day, new_count
        ));
    }

    pub fn settle(&mut self) {
        let current_day = env::block_timestamp() / self.day_length_ns;
        let mut settled = 0;
        while self.next_day_to_settle < current_day && settled < 7 {
            let day = self.next_day_to_settle;
            self.settle_one_day(day);
            self.next_day_to_settle = day
                .checked_add(1)
                .expect("day index overflow while settling");
            settled += 1;
        }
    }

    pub fn claim(&mut self) -> U128 {
        let current_day = env::block_timestamp() / self.day_length_ns;
        assert!(
            self.next_day_to_settle >= current_day,
            "settlement backlog must be cleared before claim"
        );
        let account_id = env::predecessor_account_id();
        assert!(
            self.token.accounts.contains_key(&account_id),
            "account must be registered to claim"
        );
        let has_unresolved_reward = self
            .account_progress
            .get(&account_id)
            .is_some_and(|progress| !progress.resolved);
        assert!(has_unresolved_reward, "there is no unresolved reward to claim");

        U128(self.resolve_pending_reward(&account_id, "claim"))
    }

    pub fn day_length_ns(&self) -> u64 {
        self.day_length_ns
    }

    pub fn target(&self) -> u32 {
        self.target
    }

    pub fn current_streak(&self) -> U128 {
        U128(self.current_streak as u128)
    }

    pub fn longest_streak(&self) -> U128 {
        U128(self.longest_streak as u128)
    }

    pub fn today_checkins(&self) -> U128 {
        let day = env::block_timestamp() / self.day_length_ns;
        U128(self.checkin_counts.get(&day).copied().unwrap_or(0) as u128)
    }

    pub fn emission_pool(&self) -> U128 {
        U128(self.emission_pool)
    }

    pub fn treasury(&self) -> U128 {
        U128(
            self.token
                .accounts
                .get(&self.contract_account_id)
                .unwrap_or(0),
        )
    }

}

impl Contract {
    fn measure_registered_account_storage(&mut self) {
        let account_id: AccountId = "a".repeat(64).parse().expect("valid measurement account");
        let initial_storage_usage = env::storage_usage();
        self.token.internal_register_account(&account_id);
        self.account_progress.insert(
            account_id.clone(),
            AccountProgress {
                last_checkin_day: 0,
                resolved: true,
            },
        );
        let registered_account_storage = env::storage_usage() - initial_storage_usage;
        self.token.accounts.remove(&account_id);
        self.account_progress.remove(&account_id);
        self.token.account_storage_usage = registered_account_storage;
    }

    fn resolve_pending_reward(&mut self, account_id: &AccountId, trigger: &str) -> Balance {
        let pending = self
            .account_progress
            .get(account_id)
            .map(|progress| (progress.last_checkin_day, progress.resolved));
        let Some((day, resolved)) = pending else {
            return 0;
        };
        if resolved {
            return 0;
        }

        let reward = self
            .day_settlements
            .get(&day)
            .expect("the check-in day must be settled before reward resolution")
            .reward_per_checker;
        if reward > 0 {
            self.token.internal_transfer(
                &self.reward_escrow_account_id,
                account_id,
                reward,
                Some("CROC check-in reward".to_string()),
            );
        }
        self.account_progress.insert(
            account_id.clone(),
            AccountProgress {
                last_checkin_day: day,
                resolved: true,
            },
        );
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"croc\",\"version\":\"1.0.0\",\"event\":\"claim\",\"data\":[{{\"account_id\":\"{}\",\"day\":{},\"amount\":\"{}\",\"trigger\":\"{}\"}}]}}",
            account_id, day, reward, trigger
        ));
        reward
    }

    fn settle_one_day(&mut self, day: u64) {
        assert!(
            !self.day_settlements.contains_key(&day),
            "day has already been settled"
        );
        let checker_count = self.checkin_counts.get(&day).copied().unwrap_or(0);
        let treasury_before = self
            .token
            .accounts
            .get(&self.contract_account_id)
            .unwrap_or(0);
        let (succeeded, reward_per_checker, minted_to_treasury, burned) =
            if checker_count >= self.target {
                let pot = self.emission_pool / 200;
                let treasury_part = pot / 10;
                let checker_part = pot
                    .checked_mul(90)
                    .expect("checker reward calculation overflow")
                    / 100;
                let reward_per_checker = checker_part / u128::from(checker_count);
                let checker_mint = reward_per_checker
                    .checked_mul(u128::from(checker_count))
                    .expect("checker mint calculation overflow");
                let total_mint = checker_mint
                    .checked_add(treasury_part)
                    .expect("daily mint calculation overflow");
                assert!(total_mint <= pot, "daily mint exceeds the emission pot");
                let resulting_supply = self
                    .token
                    .total_supply
                    .checked_add(total_mint)
                    .expect("total supply overflow");
                assert!(resulting_supply <= MAX_SUPPLY, "maximum supply exceeded");
                self.emission_pool = self
                    .emission_pool
                    .checked_sub(pot)
                    .expect("emission pool underflow");

                if checker_mint > 0 {
                    self.token
                        .internal_deposit(&self.reward_escrow_account_id, checker_mint);
                    FtMint {
                        owner_id: &self.reward_escrow_account_id,
                        amount: U128(checker_mint),
                        memo: Some("daily checker rewards escrow"),
                    }
                    .emit();
                }
                if treasury_part > 0 {
                    self.token
                        .internal_deposit(&self.contract_account_id, treasury_part);
                    FtMint {
                        owner_id: &self.contract_account_id,
                        amount: U128(treasury_part),
                        memo: Some("daily treasury allocation"),
                    }
                    .emit();
                }
                (true, reward_per_checker, treasury_part, 0)
            } else {
                let burned = treasury_before
                    .checked_mul(5)
                    .expect("treasury burn calculation overflow")
                    / 100;
                if burned > 0 {
                    self.token
                        .internal_withdraw(&self.contract_account_id, burned);
                    near_contract_standards::fungible_token::events::FtBurn {
                        owner_id: &self.contract_account_id,
                        amount: U128(burned),
                        memo: Some("missed day treasury burn"),
                    }
                    .emit();
                }
                (false, 0, 0, burned)
            };

        let old_streak = self.current_streak;
        if succeeded {
            self.current_streak = self
                .current_streak
                .checked_add(1)
                .expect("streak overflow");
            self.longest_streak = self.longest_streak.max(self.current_streak);
        } else {
            self.current_streak = 0;
        }
        if old_streak != self.current_streak {
            env::log_str(&format!(
                "EVENT_JSON:{{\"standard\":\"croc\",\"version\":\"1.0.0\",\"event\":\"streak_change\",\"data\":[{{\"previous\":{},\"current\":{},\"longest\":{}}}]}}",
                old_streak, self.current_streak, self.longest_streak
            ));
        }

        self.day_settlements.insert(
            day,
            DaySettlement {
                checker_count,
                reward_per_checker,
                succeeded,
                minted_to_treasury,
                burned,
            },
        );
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"croc\",\"version\":\"1.0.0\",\"event\":\"settled_day\",\"data\":[{{\"day\":{},\"checker_count\":{},\"succeeded\":{},\"reward_per_checker\":\"{}\",\"minted_to_treasury\":\"{}\",\"burned\":\"{}\"}}]}}",
            day,
            checker_count,
            succeeded,
            reward_per_checker,
            minted_to_treasury,
            burned
        ));
    }
}

#[near]
impl FungibleTokenCore for Contract {
    #[payable]
    fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        let sender_id = env::predecessor_account_id();
        assert_ne!(sender_id, self.contract_account_id, "treasury is burn-only");
        assert_ne!(
            sender_id, self.reward_escrow_account_id,
            "reward escrow cannot transfer directly"
        );
        self.token.ft_transfer(receiver_id, amount, memo);
    }

    #[payable]
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128> {
        let sender_id = env::predecessor_account_id();
        assert_ne!(sender_id, self.contract_account_id, "treasury is burn-only");
        assert_ne!(
            sender_id, self.reward_escrow_account_id,
            "reward escrow cannot transfer directly"
        );
        self.token.ft_transfer_call(receiver_id, amount, memo, msg)
    }

    fn ft_total_supply(&self) -> U128 {
        self.token.ft_total_supply()
    }

    fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        self.token.ft_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenResolver for Contract {
    #[private]
    fn ft_resolve_transfer(
        &mut self,
        sender_id: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> U128 {
        self.token
            .internal_ft_resolve_transfer(&sender_id, receiver_id, amount)
            .0
            .into()
    }
}

#[near]
impl StorageManagement for Contract {
    #[payable]
    fn storage_deposit(
        &mut self,
        account_id: Option<AccountId>,
        registration_only: Option<bool>,
    ) -> StorageBalance {
        self.token.storage_deposit(account_id, registration_only)
    }

    #[payable]
    fn storage_withdraw(&mut self, amount: Option<NearToken>) -> StorageBalance {
        self.token.storage_withdraw(amount)
    }

    #[payable]
    fn storage_unregister(&mut self, force: Option<bool>) -> bool {
        let account_id = env::predecessor_account_id();
        assert_ne!(account_id, self.contract_account_id, "treasury account is permanent");
        assert_ne!(
            account_id, self.reward_escrow_account_id,
            "reward escrow account is permanent"
        );
        assert!(
            self.account_progress
                .get(&account_id)
                .is_none_or(|progress| progress.resolved),
            "cannot unregister while a reward is unresolved"
        );

        self.account_progress.remove(&account_id);
        if let Some((closed_account, balance)) = self.token.internal_storage_unregister(force) {
            if balance > 0 {
                near_contract_standards::fungible_token::events::FtBurn {
                    owner_id: &closed_account,
                    amount: U128(balance),
                    memo: Some("storage unregister burn"),
                }
                .emit();
            }
            true
        } else {
            false
        }
    }

    fn storage_balance_bounds(&self) -> StorageBalanceBounds {
        self.token.storage_balance_bounds()
    }

    fn storage_balance_of(&self, account_id: AccountId) -> Option<StorageBalance> {
        self.token.storage_balance_of(account_id)
    }
}

#[near]
impl FungibleTokenMetadataProvider for Contract {
    fn ft_metadata(&self) -> FungibleTokenMetadata {
        FungibleTokenMetadata {
            spec: FT_METADATA_SPEC.to_string(),
            name: "Crying Croc".to_string(),
            symbol: "CROC".to_string(),
            icon: None,
            reference: None,
            reference_hash: None,
            decimals: TOKEN_DECIMALS,
        }
    }
}

#[cfg(test)]
impl Contract {
    fn balance_of(&self, account_id: AccountId) -> U128 {
        U128(self.token.accounts.get(&account_id).unwrap_or(0))
    }

    fn total_supply(&self) -> U128 {
        U128(self.token.total_supply)
    }

    fn streak(&self) -> U128 {
        self.current_streak()
    }

    fn reward_for_day(&self, day: u64) -> U128 {
        U128(
            self.day_settlements
                .get(&day)
                .map(|settlement| settlement.reward_per_checker)
                .unwrap_or(0),
        )
    }

    fn last_checkin_day(&self, account_id: AccountId) -> Option<u64> {
        self.account_progress
            .get(&account_id)
            .map(|progress| progress.last_checkin_day)
    }

    fn day_was_settled(&self, day: u64) -> bool {
        self.day_settlements.contains_key(&day)
    }

    fn last_settled_day(&self) -> u64 {
        self.next_day_to_settle.saturating_sub(1)
    }

    fn storage_unregister(&mut self, force: bool) -> bool {
        <Self as StorageManagement>::storage_unregister(self, Some(force))
    }
}

#[cfg(test)]
mod tests;
```

## src/tests.rs

```rust
use super::Contract;
use near_contract_standards::{
    fungible_token::core::FungibleTokenCore,
    storage_management::StorageManagement,
};
use near_sdk::{
    env,
    json_types::U128,
    test_utils::VMContextBuilder,
    testing_env,
    AccountId,
    NearToken,
};
use std::panic::{catch_unwind, AssertUnwindSafe};

const DAY_NS: u64 = 24 * 60 * 60 * 1_000_000_000;
const ONE_TOKEN: u128 = 1_000_000_000_000_000_000;

fn account(name: &str) -> AccountId {
    name.parse().expect("valid test account")
}

fn set_context(who: &AccountId, day: u64) {
    let mut context = VMContextBuilder::new();
    context
        .predecessor_account_id(who.clone())
        .current_account_id(account("croc.testnet"))
        .block_timestamp(day * DAY_NS);
    testing_env!(context.build());
}

fn set_transfer_context(who: &AccountId, day: u64) {
    let mut context = VMContextBuilder::new();
    context
        .predecessor_account_id(who.clone())
        .current_account_id(account("croc.testnet"))
        .block_timestamp(day * DAY_NS)
        .attached_deposit(NearToken::from_yoctonear(1));
    testing_env!(context.build());
}

fn new_contract(target: u32) -> Contract {
    Contract::new(DAY_NS, target)
}

fn register(contract: &mut Contract, who: &AccountId) {
    set_context(who, 0);
    let mut context = VMContextBuilder::new();
    context
        .predecessor_account_id(who.clone())
        .current_account_id(account("croc.testnet"))
        .attached_deposit(NearToken::from_near(1));
    testing_env!(context.build());
    contract.storage_deposit(Some(who.clone()), None);
}

fn check_in_as(contract: &mut Contract, who: &AccountId, day: u64) {
    set_context(who, day);
    contract.check_in();
}

fn settle_as(contract: &mut Contract, day: u64) {
    set_context(&account("settler.testnet"), day);
    contract.settle();
}

#[test]
#[should_panic(expected = "account has already checked in today")]
fn check_in_twice_in_one_day_is_rejected() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    check_in_as(&mut contract, &alice, 0);
}

#[test]
#[should_panic(expected = "account must register token storage before check-in")]
fn unregistered_account_cannot_check_in() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    check_in_as(&mut contract, &alice, 0);
}

#[test]
#[should_panic(expected = "there is no unresolved reward to claim")]
fn claim_twice_is_rejected() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);
    set_context(&alice, 1);
    contract.claim();
    set_context(&alice, 1);
    contract.claim();
}

#[test]
fn pending_reward_is_paid_before_a_new_check_in_is_recorded() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);
    let balance_before = contract.balance_of(alice.clone()).0;
    let reward = contract.reward_for_day(0).0;

    check_in_as(&mut contract, &alice, 1);

    assert_eq!(contract.balance_of(alice.clone()).0, balance_before + reward);
    assert_eq!(contract.last_checkin_day(alice).unwrap(), 1);
}

#[test]
fn settle_is_safe_to_call_twice() {
    let mut contract = new_contract(1);
    settle_as(&mut contract, 1);
    let pool_after_first = contract.emission_pool().0;
    let supply_after_first = contract.total_supply().0;
    settle_as(&mut contract, 1);
    assert_eq!(contract.emission_pool().0, pool_after_first);
    assert_eq!(contract.total_supply().0, supply_after_first);
}

#[test]
#[should_panic(expected = "settlement backlog must be cleared before check-in")]
fn check_in_is_blocked_until_a_three_day_backlog_is_cleared() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    check_in_as(&mut contract, &alice, 4);
}

#[test]
fn three_day_backlog_settles_in_day_order_and_then_allows_check_in() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 4);

    assert!(contract.day_was_settled(1));
    assert!(contract.day_was_settled(2));
    assert!(contract.day_was_settled(3));
    assert_eq!(contract.last_settled_day(), 3);

    check_in_as(&mut contract, &alice, 4);
    assert_eq!(contract.last_checkin_day(alice).unwrap(), 4);
}

#[test]
fn skipped_days_block_check_in_until_settle_is_called() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);

    set_context(&alice, 4);
    let rejected_before_settlement = catch_unwind(AssertUnwindSafe(|| contract.check_in()));
    assert!(rejected_before_settlement.is_err());

    settle_as(&mut contract, 4);
    check_in_as(&mut contract, &alice, 4);
    assert_eq!(contract.last_checkin_day(alice).unwrap(), 4);
}

#[test]
fn exact_rounding_leaves_checker_dust_unminted() {
    let mut contract = new_contract(11);
    let checkers: Vec<_> = (0..11)
        .map(|n| account(&format!("user{n}.testnet")))
        .collect();
    for who in &checkers {
        register(&mut contract, who);
        check_in_as(&mut contract, who, 0);
    }

    let pool_before = contract.emission_pool().0;
    settle_as(&mut contract, 1);

    let pot = pool_before / 200;
    let treasury_part = pot / 10;
    let checker_part = pot * 90 / 100;
    let per_checker = checker_part / 11;
    assert_eq!(contract.total_supply().0, 300_000_000 * ONE_TOKEN + per_checker * 11 + treasury_part);
    assert_eq!(contract.emission_pool().0, pool_before - pot);
    assert!(checker_part % 11 > 0);
}

#[test]
fn target_met_exactly_is_successful() {
    let target = 2;
    let mut success = new_contract(target);
    for name in ["alice.testnet", "bob.testnet"] {
        let who = account(name);
        register(&mut success, &who);
        check_in_as(&mut success, &who, 0);
    }
    settle_as(&mut success, 1);
    assert_eq!(success.streak().0, 1);
}

#[test]
fn target_missed_by_one_burns_exactly_five_percent() {
    let target = 2;
    let mut missed = new_contract(target);
    let alice = account("alice.testnet");
    register(&mut missed, &alice);
    check_in_as(&mut missed, &alice, 0);
    let treasury_before = missed.treasury().0;
    let supply_before = missed.total_supply().0;
    settle_as(&mut missed, 1);
    assert_eq!(missed.treasury().0, treasury_before - treasury_before * 5 / 100);
    assert_eq!(missed.total_supply().0, supply_before - treasury_before * 5 / 100);
    assert_eq!(missed.streak().0, 0);
}

#[test]
fn zero_check_in_backlog_day_burns_exactly_five_percent_of_treasury() {
    let mut contract = new_contract(1);
    let treasury_before = contract.treasury().0;
    let supply_before = contract.total_supply().0;

    settle_as(&mut contract, 1);

    let burn = treasury_before * 5 / 100;
    assert_eq!(contract.treasury().0, treasury_before - burn);
    assert_eq!(contract.total_supply().0, supply_before - burn);
}

#[test]
fn total_supply_never_exceeds_one_billion() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    for day in 0..1_000 {
        check_in_as(&mut contract, &alice, day);
        settle_as(&mut contract, day + 1);
        assert!(contract.total_supply().0 <= 1_000_000_000 * ONE_TOKEN);
    }
}

#[test]
#[should_panic(expected = "cannot unregister while a reward is unresolved")]
fn storage_unregister_with_force_is_refused_for_unresolved_reward() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);
    set_context(&alice, 1);
    contract.storage_unregister(true);
}

#[test]
#[should_panic(expected = "cannot unregister while a reward is unresolved")]
fn storage_unregister_without_force_is_refused_for_unresolved_reward() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);
    set_context(&alice, 1);
    contract.storage_unregister(false);
}

#[test]
#[should_panic(expected = "settlement backlog must be cleared before claim")]
fn claim_is_rejected_while_a_backlog_exists() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    set_context(&alice, 2);
    contract.claim();
}

#[test]
fn controllable_clock_uses_the_selected_day() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    settle_as(&mut contract, 2);
    check_in_as(&mut contract, &alice, 2);
    assert_eq!(env::block_timestamp() / DAY_NS, 2);
    assert_eq!(contract.today_checkins().0, 1);
}

#[test]
#[should_panic(expected = "reward escrow cannot transfer directly")]
fn reward_escrow_cannot_transfer_with_ft_transfer() {
    let mut contract = new_contract(1);
    let escrow = account("rewards.croc");
    set_context(&escrow, 0);
    contract.ft_transfer(account("alice.testnet"), U128(1), None);
}

#[test]
#[should_panic(expected = "reward escrow cannot transfer directly")]
fn reward_escrow_cannot_transfer_with_ft_transfer_call() {
    let mut contract = new_contract(1);
    let escrow = account("rewards.croc");
    set_context(&escrow, 0);
    let _ = contract.ft_transfer_call(
        account("alice.testnet"),
        U128(1),
        None,
        String::new(),
    );
}

#[test]
fn supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer() {
    let alice = account("alice.testnet");
    let bob = account("bob.testnet");
    let escrow = account("rewards.croc");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    register(&mut contract, &bob);

    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);
    set_context(&alice, 1);
    contract.claim();
    let treasury_after_good_day = contract.treasury().0;
    let supply_after_claim = contract.total_supply().0;
    assert_eq!(
        supply_after_claim,
        treasury_after_good_day
            + contract.balance_of(escrow.clone()).0
            + contract.balance_of(alice.clone()).0
            + contract.balance_of(bob.clone()).0
    );

    // Day 1 has no check-ins, so settling it burns exactly five percent.
    settle_as(&mut contract, 2);
    set_transfer_context(&alice, 2);
    contract.ft_transfer(bob.clone(), contract.balance_of(alice.clone()), None);
    assert_eq!(
        contract.total_supply().0,
        contract.treasury().0
            + contract.balance_of(escrow).0
            + contract.balance_of(alice).0
            + contract.balance_of(bob).0
    );
}

#[test]
fn sixty_day_replay_matches_independent_reference_and_simulation_csv() {
    const PARTICIPANTS: usize = 60;
    const TARGET: u32 = 40;

    let users: Vec<AccountId> = (0..PARTICIPANTS)
        .map(|index| account(&format!("user{index}.testnet")))
        .collect();
    set_context(&account("owner.testnet"), 0);
    let mut contract = new_contract(TARGET);
    for user in &users {
        register(&mut contract, user);
    }

    // The reference is calculated here from RULES.md's integer formulas;
    // the checked-in CSV is the simulation script's independently produced output.
    let schedule: Vec<(u64, u32)> = include_str!("../docs/simulation/replay_schedule.csv")
        .lines()
        .skip(1)
        .map(|line| {
            let mut fields = line.split(',');
            (fields.next().unwrap().parse().unwrap(), fields.next().unwrap().parse().unwrap())
        })
        .collect();
    let simulation: Vec<Vec<String>> = include_str!("../docs/simulation/results/replay_reference.csv")
        .lines()
        .skip(1)
        .map(|line| line.split(',').map(str::to_owned).collect())
        .collect();
    assert_eq!(schedule.len(), 60);
    assert_eq!(simulation.len(), 60);

    let mut pool = 700_000_000 * ONE_TOKEN;
    let mut treasury = 300_000_000 * ONE_TOKEN;
    let mut escrow = 0_u128;
    let mut holder_balances = vec![0_u128; PARTICIPANTS];
    let mut unresolved = vec![None::<u128>; PARTICIPANTS];
    let (mut streak, mut longest) = (0_u64, 0_u64);

    for (day_index, (day_number, count)) in schedule.iter().copied().enumerate() {
        assert_eq!(day_number, day_index as u64 + 1);
        assert!(count as usize <= PARTICIPANTS);

        for participant in 0..count as usize {
            if let Some(reward) = unresolved[participant].take() {
                escrow -= reward;
                holder_balances[participant] += reward;
            }
            check_in_as(&mut contract, &users[participant], day_index as u64);
            unresolved[participant] = Some(0);
        }

        let mut pot = 0_u128;
        let mut treasury_minted = 0_u128;
        let mut checker_minted = 0_u128;
        let mut burned = 0_u128;
        let successful = count >= TARGET;
        let reward_per_checker = if successful {
            pot = pool / 200;
            treasury_minted = pot / 10;
            let checker_part = pot * 90 / 100;
            let per_checker = checker_part / u128::from(count);
            checker_minted = per_checker * u128::from(count);
            pool -= pot;
            treasury += treasury_minted;
            escrow += checker_minted;
            streak += 1;
            longest = longest.max(streak);
            per_checker
        } else {
            burned = treasury * 5 / 100;
            treasury -= burned;
            streak = 0;
            0
        };
        for participant in 0..count as usize {
            unresolved[participant] = Some(reward_per_checker);
        }

        settle_as(&mut contract, day_index as u64 + 1);

        let reference_supply = treasury + escrow + holder_balances.iter().sum::<u128>();
        assert!(reference_supply <= 1_000_000_000 * ONE_TOKEN);
        assert_eq!(contract.emission_pool().0, pool, "pool after day {day_number}");
        assert_eq!(contract.treasury().0, treasury, "treasury after day {day_number}");
        assert_eq!(contract.total_supply().0, reference_supply, "supply after day {day_number}");
        assert_eq!(contract.streak().0, u128::from(streak), "streak after day {day_number}");
        assert_eq!(contract.longest_streak().0, u128::from(longest), "longest streak after day {day_number}");
        assert_eq!(
            contract.total_supply().0,
            contract.treasury().0
                + contract.balance_of(account("rewards.croc")).0
                + users.iter().map(|user| contract.balance_of(user.clone()).0).sum::<u128>(),
            "supply components after day {day_number}"
        );

        let csv = &simulation[day_index];
        assert_eq!(csv[0].parse::<u64>().unwrap(), day_number);
        assert_eq!(csv[1].parse::<u32>().unwrap(), count);
        assert_eq!(csv[2].parse::<u8>().unwrap(), u8::from(successful));
        assert_eq!(csv[3].parse::<u128>().unwrap(), pot);
        assert_eq!(csv[4].parse::<u128>().unwrap(), treasury_minted);
        assert_eq!(csv[5].parse::<u128>().unwrap(), checker_minted);
        assert_eq!(csv[6].parse::<u128>().unwrap(), burned);
        assert_eq!(csv[7].parse::<u128>().unwrap(), pool);
        assert_eq!(csv[8].parse::<u128>().unwrap(), treasury);
        assert_eq!(csv[9].parse::<u128>().unwrap(), reference_supply);
        assert_eq!(csv[10].parse::<u64>().unwrap(), streak);
        assert_eq!(csv[11].parse::<u64>().unwrap(), longest);
    }
}
```

## tests/settle_gas.rs

```rust
use near_workspaces::types::NearToken;
use serde_json::json;

const DAY_LENGTH_NS: u64 = 86_400_000_000_000;
const CHECKINS_PER_DAY: usize = 40;
const DAYS: usize = 7;
const MAX_SETTLE_GAS: u64 = 300_000_000_000_000;

#[tokio::test]
async fn settle_gas_for_seven_days_with_forty_checkins_per_day(
) -> Result<(), Box<dyn std::error::Error>> {
    let wasm_path = format!(
        "{}/target/wasm32-unknown-unknown/release/crying_croc.wasm",
        env!("CARGO_MANIFEST_DIR")
    );
    let wasm = std::fs::read(wasm_path)?;
    let worker = near_workspaces::sandbox().await?;
    let contract = worker.dev_deploy(&wasm).await?;

    contract
        .call("new")
        .args_json(json!({
            "day_length_ns": DAY_LENGTH_NS,
            "target": CHECKINS_PER_DAY,
        }))
        .max_gas()
        .transact()
        .await?
        .into_result()?;

    let mut participants = Vec::with_capacity(CHECKINS_PER_DAY);
    for _ in 0..CHECKINS_PER_DAY {
        let participant = worker.dev_create_account().await?;
        participant
            .call(contract.id(), "storage_deposit")
            .args_json(json!({
                "account_id": participant.id(),
                "registration_only": null,
            }))
            .deposit(NearToken::from_near(1))
            .max_gas()
            .transact()
            .await?
            .into_result()?;
        participants.push(participant);
    }

    for day in 0..DAYS {
        for participant in &participants {
            participant
                .call(contract.id(), "check_in")
                .max_gas()
                .transact()
                .await?
                .into_result()?;
        }

        // Use the documented 24-hour test day. Advance in six-hour chunks
        // until the view resets, keeping the 40 check-ins within one day.
        let mut next_day_started = false;
        for _ in 0..5 {
            let timestamp_before = worker.view_block().await?.timestamp();
            worker.fast_forward(21_600).await?;
            let timestamp_after = worker.view_block().await?.timestamp();
            let today_checkins: String = contract.view("today_checkins").await?.json()?;
            println!(
                "day {day}: sandbox timestamp {timestamp_before} -> {timestamp_after}; today_checkins={today_checkins}"
            );
            if today_checkins == "0" {
                next_day_started = true;
                break;
            }
        }
        assert!(next_day_started, "sandbox did not advance into the next CROC day");
        let result = contract
            .call("settle")
            .max_gas()
            .transact()
            .await?
            .into_result()?;
        let gas_burnt = result.total_gas_burnt.as_gas();
        println!("day {day}: settle() gas burnt = {gas_burnt}");
        assert!(
            gas_burnt < MAX_SETTLE_GAS,
            "settle() used {gas_burnt} gas, above the {MAX_SETTLE_GAS} gas ceiling"
        );
    }

    println!(
        "sandbox scenario: {DAYS} days, {CHECKINS_PER_DAY} check-ins per day, one measured settle() per day"
    );
    Ok(())
}
```
