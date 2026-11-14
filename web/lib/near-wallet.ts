"use client"

import { CONTRACT_ID } from "./config"
import { callViewMethod } from "./contract"

export function getInjectedMeteor(): any {
  if (typeof window === "undefined") return null
  return (
    (window as any).meteor ||
    (window as any).meteorWallet ||
    (window as any).near ||
    null
  )
}

export async function waitForInjectedWallet(timeoutMs = 1500): Promise<any> {
  if (typeof window === "undefined") return null
  const existing = getInjectedMeteor()
  if (existing) return existing

  return new Promise((resolve) => {
    let waited = 0
    const interval = setInterval(() => {
      waited += 100
      const wallet = getInjectedMeteor()
      if (wallet || waited >= timeoutMs) {
        clearInterval(interval)
        resolve(wallet)
      }
    }, 100)
  })
}

export async function getConnectedAccountId(): Promise<string | null> {
  const meteor = await waitForInjectedWallet(600)
  if (!meteor) return null

  try {
    if (typeof meteor.getAccountId === "function") {
      const id = meteor.getAccountId()
      if (id) return id
    }
    if (typeof meteor.isSignedIn === "function" && meteor.isSignedIn()) {
      return meteor.getAccountId ? meteor.getAccountId() : null
    }
    if (meteor.accountId) return meteor.accountId
    if (typeof meteor.getAccounts === "function") {
      const accs = await meteor.getAccounts()
      if (accs && accs.length > 0) {
        return accs[0].accountId || accs[0]
      }
    }
  } catch (e) {
    console.error("Error reading account from Meteor Wallet:", e)
  }
  return null
}

export async function connectWallet(): Promise<{ success: boolean; message?: string }> {
  const meteor = await waitForInjectedWallet(1000)

  if (meteor) {
    try {
      if (typeof meteor.requestSignIn === "function") {
        await meteor.requestSignIn({
          contractId: CONTRACT_ID,
          title: "Crying Croc",
        })
        return { success: true }
      }
      if (typeof meteor.signIn === "function") {
        await meteor.signIn({
          contractId: CONTRACT_ID,
        })
        return { success: true }
      }
      if (typeof meteor.login === "function") {
        await meteor.login({
          contractId: CONTRACT_ID,
        })
        return { success: true }
      }
    } catch (e: any) {
      console.error("Meteor sign-in error:", e)
      return { success: false, message: e?.message || "Sign-in was cancelled or failed." }
    }
  }

  return {
    success: false,
    message: "Meteor Wallet extension not detected. Please make sure your Meteor Wallet extension is unlocked in your browser bar.",
  }
}

export async function disconnectWallet(): Promise<void> {
  const meteor = getInjectedMeteor()
  if (meteor && typeof meteor.signOut === "function") {
    try {
      meteor.signOut()
    } catch {}
  }
  window.location.reload()
}

export async function registerStorage(): Promise<void> {
  const meteor = getInjectedMeteor()
  if (!meteor) return

  // 0.00125 NEAR required for storage deposit
  const depositYocto = "1250000000000000000000"

  if (typeof meteor.signAndSendTransaction === "function") {
    await meteor.signAndSendTransaction({
      receiverId: CONTRACT_ID,
      actions: [
        {
          methodName: "storage_deposit",
          args: {},
          gas: "30000000000000",
          deposit: depositYocto,
        },
      ],
    })
  } else if (meteor.account && typeof meteor.account().functionCall === "function") {
    await meteor.account().functionCall({
      contractId: CONTRACT_ID,
      methodName: "storage_deposit",
      args: {},
      gas: "30000000000000",
      attachedDeposit: depositYocto,
    })
  }
}

export async function executeCheckIn(): Promise<{ success: boolean; message: string }> {
  const meteor = getInjectedMeteor()
  const accountId = await getConnectedAccountId()

  if (!meteor || !accountId) {
    return { success: false, message: "Please connect your Meteor Wallet extension first." }
  }

  // 1. Check if account registered storage
  const storage = await callViewMethod<{ total: string; available: string } | null>(
    "storage_balance_of",
    { account_id: accountId }
  )

  if (!storage) {
    try {
      await registerStorage()
      return { success: false, message: "Storage registered! Please click Check In again to complete check-in." }
    } catch (e: any) {
      return { success: false, message: "Storage deposit required (0.00125 NEAR): " + (e?.message || e) }
    }
  }

  // 2. Execute on-chain check_in()
  try {
    let result: any = null
    if (typeof meteor.signAndSendTransaction === "function") {
      result = await meteor.signAndSendTransaction({
        receiverId: CONTRACT_ID,
        actions: [
          {
            methodName: "check_in",
            args: {},
            gas: "100000000000000", // 100 TGas
            deposit: "0",
          },
        ],
      })
    } else if (meteor.account && typeof meteor.account().functionCall === "function") {
      result = await meteor.account().functionCall({
        contractId: CONTRACT_ID,
        methodName: "check_in",
        args: {},
        gas: "100000000000000",
      })
    }

    const txHash = result?.transaction?.hash || result?.transaction_outcome?.id || (typeof result === "string" ? result : null)
    return {
      success: true,
      message: txHash
        ? `Check-in confirmed on NEAR Testnet! Tx: ${txHash.slice(0, 10)}...`
        : "Check-in confirmed on NEAR Testnet!",
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes("already checked in today")) {
      return { success: false, message: "You have already checked in today!" }
    }
    return { success: false, message: "Check-in failed: " + msg }
  }
}
