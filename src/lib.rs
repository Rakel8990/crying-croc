use near_sdk::{json_types::U128, near, AccountId};

#[near(contract_state)]
#[derive(Default)]
pub struct Contract {}

#[near]
impl Contract {
    #[init]
    pub fn new(_day_length_ns: u64, _target: u32) -> Self {
        Self {}
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

    pub fn balance_of(&self, _account_id: AccountId) -> U128 {
        panic!("TODO stub: balance_of")
    }

    pub fn reward_for_day(&self, _day: u64) -> U128 {
        panic!("TODO stub: reward_for_day")
    }

    pub fn last_checkin_day(&self, _account_id: AccountId) -> Option<u64> {
        panic!("TODO stub: last_checkin_day")
    }

    pub fn emission_pool(&self) -> U128 {
        panic!("TODO stub: emission_pool")
    }

    pub fn total_supply(&self) -> U128 {
        panic!("TODO stub: total_supply")
    }

    pub fn day_was_settled(&self, _day: u64) -> bool {
        panic!("TODO stub: day_was_settled")
    }

    pub fn last_settled_day(&self) -> u64 {
        panic!("TODO stub: last_settled_day")
    }

    pub fn streak(&self) -> U128 {
        panic!("TODO stub: streak")
    }

    pub fn treasury(&self) -> U128 {
        panic!("TODO stub: treasury")
    }

    pub fn today_checkins(&self) -> U128 {
        panic!("TODO stub: today_checkins")
    }
}

#[cfg(test)]
mod tests;
