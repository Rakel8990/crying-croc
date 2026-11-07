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
    set_context(&alice, 2);
    contract.ft_transfer(bob.clone(), contract.balance_of(alice.clone()), None);
    assert_eq!(
        contract.total_supply().0,
        contract.treasury().0
            + contract.balance_of(escrow).0
            + contract.balance_of(alice).0
            + contract.balance_of(bob).0
    );
}
