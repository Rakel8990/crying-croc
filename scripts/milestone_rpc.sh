#!/usr/bin/env bash

fail_step() {
  local step_name="$1" exit_code="$2"
  printf '%s failed (exit code %s).\n' "$step_name" "$exit_code" >&2
  exit "$exit_code"
}

rpc_post_to_file() {
  local step_name="$1" request_body="$2" response_file="$3"
  local attempt endpoint http_status curl_status retryable success=0 failure_code=1
  for attempt in {1..6}; do
    if (( attempt % 2 == 1 )); then endpoint="$NEAR_RPC"; else endpoint="$NEAR_RPC_FALLBACK"; fi
    http_status="000"
    if http_status="$(curl --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 30 --silent --show-error --output "$response_file" --write-out '%{http_code}' -H 'Content-Type: application/json' --data "$request_body" "$endpoint" 2>/dev/null)"; then
      curl_status=0
    else
      curl_status=$?
    fi
    [[ "$http_status" =~ ^[0-9]{3}$ ]] || http_status="000"
    printf 'RPC attempt=%d status=%s\n' "$attempt" "$http_status" >&2
    if (( curl_status == 0 )) && [[ "$http_status" == 2[0-9][0-9] ]]; then
      success=1
      break
    fi
    retryable=0
    case "$http_status" in
      408|429|5[0-9][0-9]) retryable=1; failure_code=$((10#$http_status));;
    esac
    case "$curl_status" in
      6|7|18|28|35|52|55|56) retryable=1; failure_code="$curl_status";;
    esac
    if (( retryable == 0 )); then
      failure_code="$curl_status"
      (( curl_status == 0 )) && failure_code=$((10#$http_status))
      fail_step "$step_name RPC request" "$failure_code"
    fi
    if (( attempt < 6 )); then sleep "$((1 << (attempt - 1)))"; fi
  done
  (( success == 1 )) || fail_step "$step_name RPC request" "$failure_code"
  [[ -s "$response_file" ]] || fail_step "$step_name RPC response" 5
  jq -e . "$response_file" >/dev/null 2>&1 || fail_step "$step_name RPC JSON validation" 5
  cat "$response_file"
}
