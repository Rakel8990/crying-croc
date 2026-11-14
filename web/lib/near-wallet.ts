"use client"

import { CONTRACT_ID } from "./config"
import { callViewMethod } from "./contract"

export interface NearWalletState {
  accountId: string | null
  isConnected: boolean
  isRegistered: boolean
  hasCheckedInToday: boolean
  loading: boolean
}

let nearInstance: any = null
let walletInstance: any = null

export async function loadNearApi(): Promise<any> {
  if (typeof window === "undefined") return null
  if ((window as any).nearApi) return (window as any).nearApi

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src*="near-api-js"]')
    if (existing) {
      if ((window as any).nearApi) {
        resolve((window as any).nearApi)
        return
      }
      existing.addEventListener("load", () => resolve((window as any).nearApi))
      existing.addEventListener("error", () => resolve(null))
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/near-api-js@2.1.4/dist/near-api-js.min.js"
    script.async = true
    script.onload = () => resolve((window as any).nearApi)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

export async function getNearWallet(): Promise<any> {
  if (typeof window === "undefined") return null
  if (walletInstance) return walletInstance

  const nearApi = await loadNearApi()
  if (!nearApi) return null

  try {
    const connectionConfig = {
      networkId: "testnet",
      keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://testnet.mynearwallet.com",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://testnet.nearblocks.io",
    }

    nearInstance = await nearApi.connect(connectionConfig)
    walletInstance = new nearApi.WalletConnection(nearInstance, "crying-croc")
    return walletInstance
  } catch (e) {
    console.error("Failed to initialize NEAR wallet:", e)
    return null
  }
}

export async function connectWallet(): Promise<void> {
  const wallet = await getNearWallet()
  if (!wallet) return
  wallet.requestSignIn({
    contractId: CONTRACT_ID,
    title: "Crying Croc",
  })
}

export async function disconnectWallet(): Promise<void> {
  const wallet = await getNearWallet()
  if (!wallet) return
  wallet.signOut()
  window.location.reload()
}

export async function registerStorage(): Promise<void> {
  const wallet = await getNearWallet()
  if (!wallet || !wallet.isSignedIn()) return
  const account = wallet.account()
  // 0.00125 NEAR required for storage deposit
  await account.functionCall({
    contractId: CONTRACT_ID,
    methodName: "storage_deposit",
    args: {},
    gas: "30000000000000",
    attachedDeposit: "1250000000000000000000",
  })
}

export async function executeCheckIn(): Promise<{ success: boolean; message: string }> {
  const wallet = await getNearWallet()
  if (!wallet || !wallet.isSignedIn()) {
    return { success: false, message: "Please connect your NEAR testnet wallet first." }
  }

  const accountId = wallet.getAccountId()
  const account = wallet.account()

  // Verify storage registration
  const storage = await callViewMethod<{ total: string; available: string } | null>(
    "storage_balance_of",
    { account_id: accountId }
  )

  if (!storage) {
    await registerStorage()
    return { success: false, message: "Redirecting to MyNearWallet for one-time storage registration (0.00125 NEAR)..." }
  }

  try {
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: "check_in",
      args: {},
      gas: "100000000000000", // 100 Tgas
    })

    const txHash = result?.transaction?.hash || result?.transaction_outcome?.id
    return {
      success: true,
      message: txHash
        ? `Check-in confirmed on NEAR Testnet! Tx: ${txHash.slice(0, 8)}...`
        : "Check-in confirmed on NEAR Testnet!",
    }
  } catch (err: any) {
    const msg = err?.message || String(err)
    if (msg.includes("already checked in today")) {
      return { success: false, message: "You have already checked in today!" }
    }
    return { success: false, message: "Transaction failed: " + msg }
  }
}
