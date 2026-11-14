"use client"

import { useEffect, useState, useCallback } from "react"
import { CONTRACT_ID, RPC_URLS } from "./config"

const DECIMALS_18 = BigInt("1000000000000000000")

export interface DaySettlementRecord {
  day: number
  checkerCount: number
  success: boolean
  rewardPerChecker: string
  bonusPerChecker: string
}

export interface CrocProtocolData {
  currentStreak: string
  longestStreak: string
  todayCheckins: string
  target: string
  dayLengthNs: string
  treasury: string
  emissionPool: string
  ftTotalSupply: string
  nextDayToSettle: number | null
  milestonesPaid: [boolean, boolean, boolean, boolean] | null
  recentDays: DaySettlementRecord[]
  mascotState: "neutral" | "happy" | "crying"
  loading: boolean
}

export function formatYoctoCroc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unavailable"
  }
  try {
    const raw = typeof value === "number" ? value.toString() : value.trim()
    const bn = BigInt(raw)
    const whole = bn / DECIMALS_18
    return whole.toLocaleString("en-US")
  } catch {
    return "Unavailable"
  }
}

export function formatInteger(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Unavailable"
  }
  try {
    const raw = typeof value === "number" ? value.toString() : value.trim()
    const bn = BigInt(raw)
    return bn.toLocaleString("en-US")
  } catch {
    return "Unavailable"
  }
}

export async function callViewMethod<T = any>(
  methodName: string,
  args: Record<string, any> = {}
): Promise<T | null> {
  const jsonArgs = JSON.stringify(args)
  const argsBase64 =
    typeof window !== "undefined"
      ? window.btoa(jsonArgs)
      : Buffer.from(jsonArgs).toString("base64")

  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: "croc-web-view",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: CONTRACT_ID,
      method_name: methodName,
      args_base64: argsBase64,
    },
  })

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const url of RPC_URLS) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          continue
        }

        const data = await response.json()
        if (data.error || !data.result || !Array.isArray(data.result.result)) {
          continue
        }

        const bytes = new Uint8Array(data.result.result)
        const text = new TextDecoder().decode(bytes)
        return JSON.parse(text) as T
      } catch {
        // Attempt next URL / retry
      }
    }
  }

  return null
}

export function useCrocData(): CrocProtocolData {
  const [data, setData] = useState<CrocProtocolData>({
    currentStreak: "Unavailable",
    longestStreak: "Unavailable",
    todayCheckins: "Unavailable",
    target: "Unavailable",
    dayLengthNs: "Unavailable",
    treasury: "Unavailable",
    emissionPool: "Unavailable",
    ftTotalSupply: "Unavailable",
    nextDayToSettle: null,
    milestonesPaid: null,
    recentDays: [],
    mascotState: "neutral",
    loading: true,
  })

  const refresh = useCallback(async () => {
    try {
      const [
        streakRes,
        longestRes,
        todayRes,
        targetRes,
        dayLengthRes,
        treasuryRes,
        poolRes,
        supplyRes,
        nextDayRes,
        milestonesRes,
      ] = await Promise.all([
        callViewMethod<string>("current_streak"),
        callViewMethod<string>("longest_streak"),
        callViewMethod<string>("today_checkins"),
        callViewMethod<number>("target"),
        callViewMethod<number | string>("day_length_ns"),
        callViewMethod<string>("treasury"),
        callViewMethod<string>("emission_pool"),
        callViewMethod<string>("ft_total_supply"),
        callViewMethod<number | string>("next_day_to_settle"),
        callViewMethod<[boolean, boolean, boolean, boolean]>("milestones_paid"),
      ])

      const nextDayNum = nextDayRes !== null ? Number(nextDayRes) : null

      // Mascot rule: d = next_day_to_settle - 1.
      // If get_day(d) is null, neutral croc; success true, happy croc; success false, crying croc.
      // NEVER use today's partial check-in count.
      let mascot: "neutral" | "happy" | "crying" = "neutral"
      let recentSettledDays: DaySettlementRecord[] = []

      if (nextDayNum !== null && nextDayNum > 0) {
        const lastSettledDayIndex = nextDayNum - 1
        const lastDayData = await callViewMethod<{
          day: number
          checker_count: number
          success: boolean
          reward_per_checker: string
          bonus_per_checker: string
        }>("get_day", { day: lastSettledDayIndex })

        if (lastDayData === null) {
          mascot = "neutral"
        } else if (lastDayData.success) {
          mascot = "happy"
        } else {
          mascot = "crying"
        }

        // Fetch up to 10 last settled days for log
        const startDay = Math.max(0, nextDayNum - 10)
        const dayPromises = []
        for (let day = nextDayNum - 1; day >= startDay; day--) {
          dayPromises.push(
            callViewMethod<{
              day: number
              checker_count: number
              success: boolean
              reward_per_checker: string
              bonus_per_checker: string
            }>("get_day", { day })
          )
        }
        const settledList = await Promise.all(dayPromises)
        for (const item of settledList) {
          if (item !== null) {
            recentSettledDays.push({
              day: item.day,
              checkerCount: item.checker_count,
              success: item.success,
              rewardPerChecker: item.reward_per_checker,
              bonusPerChecker: item.bonus_per_checker,
            })
          }
        }
      }

      setData({
        currentStreak: formatInteger(streakRes),
        longestStreak: formatInteger(longestRes),
        todayCheckins: formatInteger(todayRes),
        target: formatInteger(targetRes),
        dayLengthNs: dayLengthRes !== null ? dayLengthRes.toString() : "Unavailable",
        treasury: formatYoctoCroc(treasuryRes),
        emissionPool: formatYoctoCroc(poolRes),
        ftTotalSupply: formatYoctoCroc(supplyRes),
        nextDayToSettle: nextDayNum,
        milestonesPaid: milestonesRes,
        recentDays: recentSettledDays,
        mascotState: mascot,
        loading: false,
      })
    } catch {
      setData((prev) => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 30000)
    return () => clearInterval(timer)
  }, [refresh])

  return data
}
