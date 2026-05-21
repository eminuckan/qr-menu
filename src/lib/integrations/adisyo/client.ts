import "server-only"

import type { AdisyoProductsResponse } from "./types"

const DEFAULT_PRODUCTS_RATE_LIMIT_SECONDS = 180

export type AdisyoCredentials = {
  apiKey: string
  apiSecret: string
  apiConsumer: string
}

export class AdisyoRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds = DEFAULT_PRODUCTS_RATE_LIMIT_SECONDS) {
    super(`Adisyo /Products rate limit. Retry after ${retryAfterSeconds} seconds.`)
    this.name = "AdisyoRateLimitError"
  }
}

function getRequiredEnv(name: string, legacyName?: string) {
  const value = process.env[name] ?? (legacyName ? process.env[legacyName] : undefined)

  if (!value) {
    throw new Error(`${name} is required for Adisyo sync.`)
  }

  return value
}

export function getEnvAdisyoCredentials(): AdisyoCredentials {
  return {
    apiKey: getRequiredEnv("ADISYO_API_KEY", "NEXT_PUBLIC_ADISYO_API_KEY"),
    apiSecret: getRequiredEnv("ADISYO_API_SECRET", "NEXT_PUBLIC_ADISYO_API_SECRET"),
    apiConsumer: getRequiredEnv("ADISYO_API_CONSUMER", "NEXT_PUBLIC_ADISYO_API_CONSUMER"),
  }
}

export function hasEnvAdisyoCredentials() {
  return Boolean(
    (process.env.ADISYO_API_KEY ?? process.env.NEXT_PUBLIC_ADISYO_API_KEY)
    && (process.env.ADISYO_API_SECRET ?? process.env.NEXT_PUBLIC_ADISYO_API_SECRET)
    && (process.env.ADISYO_API_CONSUMER ?? process.env.NEXT_PUBLIC_ADISYO_API_CONSUMER),
  )
}

export class AdisyoClient {
  private readonly baseUrl = process.env.ADISYO_API_BASE_URL ?? "https://ext.adisyo.com/api/External/v2"

  async getProducts(credentials = getEnvAdisyoCredentials()) {
    const response = await fetch(`${this.baseUrl}/Products`, {
      method: "GET",
      headers: {
        "x-api-key": credentials.apiKey,
        "x-api-secret": credentials.apiSecret,
        "x-api-consumer": credentials.apiConsumer,
      },
      cache: "no-store",
    })

    let payload: AdisyoProductsResponse | null = null

    try {
      payload = await response.json() as AdisyoProductsResponse
    } catch {
      payload = null
    }

    if (response.status === 601 || payload?.status === 601) {
      throw new AdisyoRateLimitError()
    }

    if (!response.ok) {
      throw new Error(`Adisyo API error: ${response.status} ${response.statusText}`)
    }

    if (!payload) {
      throw new Error("Adisyo API returned an empty or invalid JSON response.")
    }

    if (payload.status !== 100) {
      throw new Error(payload.message || `Adisyo API status ${payload.status}`)
    }

    return payload.data
  }
}
