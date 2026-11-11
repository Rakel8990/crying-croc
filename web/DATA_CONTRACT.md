# CROC contract data interface

This document describes the deployed contract's public **view** methods for the page builder. Method names and argument names below match `src/lib.rs` and the NEP-141/NEP-145 traits implemented there. Amounts returned as `U128` are JSON decimal strings in yoctoCROC.

## Public views

| Method | Arguments (JSON object) | JSON result |
|---|---|---|
| `day_length_ns` | `{}` | JSON integer (`u64`), nanoseconds per day |
| `target` | `{}` | JSON integer (`u32`), required daily check-in count |
| `current_streak` | `{}` | JSON decimal string (`U128`) |
| `longest_streak` | `{}` | JSON decimal string (`U128`) |
| `today_checkins` | `{}` | JSON decimal string (`U128`) |
| `get_day` | `{"day":0}` | `null` if unsettled; otherwise `{"day":0,"checker_count":5,"success":true,"reward_per_checker":"<yoctoCROC>","bonus_per_checker":"<yoctoCROC>"}` |
| `get_checkins` | `{"day":0}` | JSON integer (`u32`) |
| `next_day_to_settle` | `{}` | JSON integer (`u64`) |
| `account_progress` | `{"account_id":"alice.testnet"}` | `null` if unknown; otherwise `{"last_checkin_day":0,"resolved":false}` |
| `milestones_paid` | `{}` | JSON boolean array `[paid_streak_7,paid_streak_15,paid_streak_25,paid_streak_100]` |
| `emission_pool` | `{}` | JSON decimal string (`U128`), yoctoCROC |
| `treasury` | `{}` | JSON decimal string (`U128`), yoctoCROC |
| `ft_total_supply` | `{}` | JSON decimal string (`U128`), yoctoCROC |
| `ft_balance_of` | `{"account_id":"alice.testnet"}` | JSON decimal string (`U128`), yoctoCROC |
| `storage_balance_bounds` | `{}` | object `{"min":"<yoctoNEAR>","max":null}`; `max` is optional and may be a decimal string |
| `storage_balance_of` | `{"account_id":"alice.testnet"}` | `null` if unregistered; otherwise object `{"total":"<yoctoNEAR>","available":"<yoctoNEAR>"}` |
| `ft_metadata` | `{}` | object `{"spec":"ft-1.0.0","name":"Crycodile","symbol":"CROC","icon":null,"reference":null,"reference_hash":null,"decimals":18}` |

The `account_id` values must be valid NEAR account IDs. For `storage_balance_of`, registered accounts receive the NEP-145 balance object. `storage_balance_bounds` and `storage_balance_of` are provided by the `StorageManagement` implementation; `ft_metadata`, `ft_total_supply`, and `ft_balance_of` are provided by the corresponding standard traits.

These are views; mutation methods such as `check_in`, `settle`, `claim`, `storage_deposit`, and `ft_transfer` are not view calls.

## JSON-RPC view call

The workflows use the NEAR testnet RPC endpoint `https://rpc.testnet.near.org`.

Call a contract view using `query` with `request_type: "call_function"`. `args_base64` is the base64 encoding of the UTF-8 JSON argument object (for example, `{}` encodes as `e30=`):

```json
{
  "jsonrpc": "2.0",
  "id": "croc-view",
  "method": "query",
  "params": {
    "request_type": "call_function",
    "finality": "final",
    "account_id": "CONTRACT.testnet",
    "method_name": "ft_balance_of",
    "args_base64": "eyJhY2NvdW50X2lkIjoiYWxpY2UudGVzdG5ldCJ9"
  }
}
```

The returned `result.result` is a byte array containing the UTF-8 JSON result. Decode those bytes as UTF-8 and parse the JSON value. For example, a `U128` result is encoded as a JSON string, such as `"1230000000000000000000000"`.

## Account access keys

Use `query` with `request_type: "view_access_key_list"` to read an account's public access keys:

```json
{
  "jsonrpc": "2.0",
  "id": "croc-keys",
  "method": "query",
  "params": {
    "request_type": "view_access_key_list",
    "finality": "final",
    "account_id": "CONTRACT.testnet"
  }
}
```

The result contains `keys`, an array of public key and access-key records. This query does not reveal private keys.

## On-chain Wasm code hash

Use `query` with `request_type: "view_code"` to read the deployed code and its hash:

```json
{
  "jsonrpc": "2.0",
  "id": "croc-code",
  "method": "query",
  "params": {
    "request_type": "view_code",
    "finality": "final",
    "account_id": "CONTRACT.testnet"
  }
}
```

The `view_code` result includes `code_base64` and `hash`; `hash` is the on-chain code hash in NEAR's base58 representation. The `view_account` query also returns `code_hash` alongside account balance and storage information:

```json
{
  "jsonrpc": "2.0",
  "id": "croc-account",
  "method": "query",
  "params": {
    "request_type": "view_account",
    "finality": "final",
    "account_id": "CONTRACT.testnet"
  }
}
```

Compare hashes using the exact representation produced by the hash routine being used. The workflow should record both the local Wasm SHA-256 and the on-chain NEAR code hash; these are different hash formats and are not directly equal.

## Per-day settlement data

The contract does **not** expose a public view for per-day settlement records. In particular, there is no view returning a day's check-in count, success/miss result, minted amount, or burned amount. Settlement events are logged when `settle()` runs, but the `DaySettlement` records are private contract state and cannot be read through a public view. This document does not propose changing the contract.
