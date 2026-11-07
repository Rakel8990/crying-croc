use near_sdk::near;

#[near(contract_state)]
#[derive(Default)]
pub struct Contract {}

#[cfg(test)]
mod tests;
