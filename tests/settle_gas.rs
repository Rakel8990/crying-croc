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
