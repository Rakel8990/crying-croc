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
        let reward_escrow_account_id: AccountId = format!("escrow.{contract_account_id}")
            .parse()
            .expect("derived reward escrow account is valid");
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

        let settlement = self.day_settlements.get(&day);
        assert!(settlement.is_some(), "reward day is not settled yet");
        let reward = settlement.unwrap().reward_per_checker;
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
