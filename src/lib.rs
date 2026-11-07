use near_sdk::near;

#[near(contract_state)]
#[derive(Default)]
pub struct Contract {}

#[cfg(test)]
mod tests {
    #[test]
    fn trivial_test_passes() {
        assert_eq!(2 + 2, 4);
    }
}
