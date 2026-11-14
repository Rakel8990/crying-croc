"use client"

import { Buffer } from "buffer"
import { CONTRACT_ID } from "./config"
import { callViewMethod, formatYoctoCroc } from "./contract"

// Ensure Buffer is globally available for web3 packages
if (typeof window !== "undefined" && !(window as any).Buffer) {
  ;(window as any).Buffer = Buffer
}

let selectorPromise: Promise<any> | null = null

export async function getWalletSelector(): Promise<any> {
  if (typeof window === "undefined") return null
  if (!selectorPromise) {
    selectorPromise = (async () => {
      const { setupWalletSelector } = await import("@near-wallet-selector/core")
      const { setupMeteorWallet } = await import("@near-wallet-selector/meteor-wallet")

      return await setupWalletSelector({
        network: "testnet",
        modules: [setupMeteorWallet()],
      })
    })()
  }
  return selectorPromise
}

export async function getConnectedAccountId(): Promise<string | null> {
  try {
    const selector = await getWalletSelector()
    if (!selector) return null
    const state = selector.store.getState()
    if (state.accounts && state.accounts.length > 0) {
      return state.accounts[0].accountId
    }
  } catch (err) {
    console.error("Error reading connected account:", err)
  }
  return null
}

export async function connectMeteor(): Promise<{ success: boolean; accountId?: string; message?: string }> {
  try {
    const selector = await getWalletSelector()
    if (!selector) {
      return { success: false, message: "Could not initialize NEAR wallet selector." }
    }
    const wallet = await selector.wallet("meteor-wallet")
    const accounts = await wallet.signIn({
      contractId: CONTRACT_ID,
    })
    const accountId = accounts && accounts.length > 0 ? accounts[0].accountId : null
    if (accountId) {
      return { success: true, accountId }
    }
    return { success: false, message: "Sign-in was not completed." }
  } catch (err: any) {
    console.error("Meteor connect error:", err)
    return { success: false, message: err?.message || String(err) }
  }
}

export async function disconnectMeteor(): Promise<void> {
  try {
    const selector = await getWalletSelector()
    if (!selector) return
    const wallet = await selector.wallet()
    await wallet.signOut()
  } catch (err) {
    console.error("Meteor disconnect error:", err)
  }
}

export async function checkUserCheckinStatus(accountId: string): Promise<{ checkedInToday: boolean; lastDay: number; resolved: boolean }> {
  try {
    const [progress, dayLengthNs] = await Promise.all([
      callViewMethod<{ last_checkin_day: number; resolved: boolean } | null>("account_progress", { account_id: accountId }),
      callViewMethod<number | string>("day_length_ns"),
    ])

    if (!progress) {
      return { checkedInToday: false, lastDay: 0, resolved: true }
    }

    const dayNs = Number(dayLengthNs) || 86400000000000
    const currentDay = Math.floor((Date.now() * 1_000_000) / dayNs)

    const checkedInToday = progress.last_checkin_day === currentDay
    return {
      checkedInToday,
      lastDay: progress.last_checkin_day,
      resolved: progress.resolved,
    }
  } catch (err) {
    console.error("Error checking user status:", err)
    return { checkedInToday: false, lastDay: 0, resolved: true }
  }
}

export async function fetchUserBalance(accountId: string): Promise<string> {
  try {
    const bal = await callViewMethod<string>("ft_balance_of", { account_id: accountId })
    return formatYoctoCroc(bal)
  } catch {
    return "0"
  }
}

function createFunctionCallAction(
  methodName: string,
  args: Record<string, any> = {},
  gas: string = "100000000000000",
  deposit: string = "0"
) {
  const jsonStr = JSON.stringify(args)
  const bytes =
    typeof window !== "undefined" && (window as any).Buffer
      ? (window as any).Buffer.from(jsonStr)
      : new TextEncoder().encode(jsonStr)

  return {
    functionCall: {
      methodName,
      args: bytes,
      gas: BigInt(gas),
      deposit: BigInt(deposit),
    },
    type: "FunctionCall",
    params: {
      methodName,
      args,
      gas,
      deposit,
    },
  } as any
}

export async function executeCheckIn(): Promise<{ success: boolean; txHash?: string; message: string }> {
  try {
    const selector = await getWalletSelector()
    if (!selector) return { success: false, message: "Wallet selector not ready." }

    const state = selector.store.getState()
    const accountId = state.accounts?.[0]?.accountId
    if (!accountId) {
      return { success: false, message: "Please connect your Meteor Wallet first." }
    }

    const wallet = await selector.wallet()

    // 1. Check storage registration
    const storage = await callViewMethod<{ total: string; available: string } | null>("storage_balance_of", {
      account_id: accountId,
    })

    const actions: any[] = []

    if (!storage) {
      // NEP-141 storage deposit: 0.00125 NEAR
      actions.push(
        createFunctionCallAction(
          "storage_deposit",
          { registration_only: true },
          "30000000000000",
          "1250000000000000000000"
        )
      )
    }

    actions.push(
      createFunctionCallAction("check_in", {}, "100000000000000", "0")
    )

    const result = await wallet.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions,
    })

    const txHash =
      result?.transaction?.hash ||
      result?.transaction_outcome?.id ||
      (typeof result === "string" ? result : null)

    return {
      success: true,
      txHash: txHash || undefined,
      message: txHash
        ? `Check-in confirmed on-chain! Tx: ${txHash.slice(0, 10)}...`
        : "Check-in confirmed on NEAR Testnet!",
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes("already checked in today")) {
      return { success: false, message: "You have already checked in today!" }
    }
    if (msg.includes("User cancelled") || msg.includes("rejected")) {
      return { success: false, message: "Transaction cancelled by user." }
    }
    return { success: false, message: "Check-in failed: " + msg }
  }
}

export async function executeClaim(): Promise<{ success: boolean; txHash?: string; message: string }> {
  try {
    const selector = await getWalletSelector()
    if (!selector) return { success: false, message: "Wallet selector not ready." }

    const state = selector.store.getState()
    const accountId = state.accounts?.[0]?.accountId
    if (!accountId) {
      return { success: false, message: "Please connect your Meteor Wallet first." }
    }

    const wallet = await selector.wallet()

    const result = await wallet.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions: [
        createFunctionCallAction("claim", {}, "100000000000000", "0"),
      ],
    })

    const txHash =
      result?.transaction?.hash ||
      result?.transaction_outcome?.id ||
      (typeof result === "string" ? result : null)

    return {
      success: true,
      txHash: txHash || undefined,
      message: txHash
        ? `Rewards claimed on-chain! Tx: ${txHash.slice(0, 10)}...`
        : "Rewards claimed on NEAR Testnet!",
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes("there is no unresolved reward to claim")) {
      return { success: false, message: "No unresolved reward available to claim yet." }
    }
    return { success: false, message: "Claim failed: " + msg }
  }
}
