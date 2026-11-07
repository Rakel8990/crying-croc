use near_contract_standards::fungible_token::{
    core_impl::{Balance, FungibleToken},
    events::FtMint,
    metadata::{FungibleTokenMetadata, FungibleTokenMetadataProvider, FT_METADATA_SPEC},
};
use near_sdk::{
    borsh::BorshSerialize,
    env,
    json_types::U128,
    near,
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

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    token: FungibleToken,
    contract_account_id: AccountId,
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
        let mut token = FungibleToken::new(StorageKey::Token);
        token.internal_register_account(&contract_account_id);
        token.internal_deposit(&contract_account_id, INITIAL_TREASURY);
        FtMint {
            owner_id: &contract_account_id,
            amount: U128(INITIAL_TREASURY),
            memo: Some("initial burn-only treasury"),
        }
        .emit();

        Self {
            token,
            contract_account_id,
            day_length_ns,
            target,
            emission_pool: INITIAL_POOL,
            current_streak: 0,
            longest_streak: 0,
            next_day_to_settle: env::block_timestamp() / day_length_ns,
            checkin_counts: LookupMap::new(StorageKey::CheckinCounts),
            account_progress: LookupMap::new(StorageKey::AccountProgress),
            day_settlements: LookupMap::new(StorageKey::DaySettlements),
        }
    }

    pub fn check_in(&mut self) {
        panic!("TODO stub: check_in")
    }

    pub fn settle(&mut self) {
        panic!("TODO stub: settle")
    }

    pub fn claim(&mut self) {
        panic!("TODO stub: claim")
    }

    pub fn storage_deposit(
        &mut self,
        _account_id: Option<AccountId>,
        _registration_only: Option<bool>,
    ) {
        panic!("TODO stub: storage_deposit")
    }

    pub fn storage_unregister(&mut self, _force: bool) -> bool {
        panic!("TODO stub: storage_unregister")
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
}

#[cfg(test)]
mod tests;
