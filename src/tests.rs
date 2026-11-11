use super::Contract;
use near_contract_standards::{
    fungible_token::core::FungibleTokenCore,
    fungible_token::metadata::FungibleTokenMetadataProvider,
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

fn escrow_account() -> AccountId {
    account("escrow.croc.testnet")
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
    set_context(&account("initializer.testnet"), 0);
    Contract::new(DAY_NS, target)
}

#[test]
fn ft_metadata_matches_project_token_metadata() {
    let contract = new_contract(5);
    let metadata = contract.ft_metadata();

    assert_eq!(metadata.spec, "ft-1.0.0");
    assert_eq!(metadata.name, "Crycodile");
    assert_eq!(metadata.symbol, "CROC");
    assert_eq!(metadata.decimals, 18);
    assert_eq!(metadata.icon, None);
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
#[should_panic(expected = "reward day is not settled yet")]
fn claim_on_the_same_day_as_check_in_is_rejected_until_settlement() {
    let alice = account("alice.testnet");
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    set_context(&alice, 0);
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
fn ten_day_backlog_settles_seven_days_then_the_remaining_three() {
    let mut contract = new_contract(1);

    settle_as(&mut contract, 10);
    assert_eq!(contract.last_settled_day(), 6, "first settle call must settle days 0 through 6");
    for day in 0..7 {
        assert!(contract.day_was_settled(day), "day {day} must be settled by the first call");
    }
    for day in 7..10 {
        assert!(!contract.day_was_settled(day), "day {day} must remain for the second call");
    }

    settle_as(&mut contract, 10);
    assert_eq!(contract.last_settled_day(), 9, "second settle call must finish through day 9");
    for day in 0..10 {
        assert!(contract.day_was_settled(day), "day {day} must be settled after both calls");
    }
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
    let escrow = escrow_account();
    set_context(&escrow, 0);
    contract.ft_transfer(account("alice.testnet"), U128(1), None);
}

#[test]
#[should_panic(expected = "reward escrow cannot transfer directly")]
fn reward_escrow_cannot_transfer_with_ft_transfer_call() {
    let mut contract = new_contract(1);
    let escrow = escrow_account();
    set_context(&escrow, 0);
    let _ = contract.ft_transfer_call(
        account("alice.testnet"),
        U128(1),
        None,
        String::new(),
    );
}

#[test]
#[should_panic(expected = "treasury is burn-only")]
fn treasury_cannot_transfer_with_ft_transfer() {
    let mut contract = new_contract(1);
    let treasury = account("croc.testnet");
    set_context(&treasury, 0);
    contract.ft_transfer(account("alice.testnet"), U128(1), None);
}

#[test]
#[should_panic(expected = "treasury is burn-only")]
fn treasury_cannot_transfer_with_ft_transfer_call() {
    let mut contract = new_contract(1);
    let treasury = account("croc.testnet");
    set_context(&treasury, 0);
    let _ = contract.ft_transfer_call(
        account("alice.testnet"),
        U128(1),
        None,
        String::new(),
    );
}

#[test]
fn claim_moves_exactly_the_recorded_reward_from_escrow_to_claimer() {
    let alice = account("alice.testnet");
    let escrow = escrow_account();
    let mut contract = new_contract(1);
    register(&mut contract, &alice);
    check_in_as(&mut contract, &alice, 0);
    settle_as(&mut contract, 1);

    let reward = contract.reward_for_day(0).0;
    let claimer_before = contract.balance_of(alice.clone()).0;
    let escrow_before = contract.balance_of(escrow.clone()).0;
    set_context(&alice, 1);
    let claimed = contract.claim().0;

    assert_eq!(claimed, reward, "claim result must equal the settled per-checker reward");
    assert_eq!(
        contract.balance_of(alice).0 - claimer_before,
        reward,
        "claimer balance must increase by exactly the recorded reward"
    );
    assert_eq!(
        escrow_before - contract.balance_of(escrow).0,
        reward,
        "escrow balance must decrease by exactly the recorded reward"
    );
}

#[test]
fn supply_matches_treasury_escrow_and_holders_after_day_claim_and_transfer() {
    let alice = account("alice.testnet");
    let bob = account("bob.testnet");
    let escrow = escrow_account();
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
                + contract.balance_of(escrow_account()).0
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
