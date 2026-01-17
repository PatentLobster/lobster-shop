import axios from 'axios';
import type { BuyRequest, BuyResponse, GetBuysResponse, FrontendConfig } from '@lobster-shop/shared';

// Runtime config loaded from /api/config endpoint
let runtimeConfig: FrontendConfig | null = null;

/**
 * Load runtime configuration from backend
 * This is called once on app initialization
 */
export async function loadRuntimeConfig(): Promise<FrontendConfig> {
  try {
    // In development, use localhost. In production, this would be relative to same origin
    const configUrl = import.meta.env.DEV
      ? 'http://localhost:3000/api/config'
      : '/api/config';

    const response = await axios.get<FrontendConfig>(configUrl);
    runtimeConfig = response.data;

    console.log('Runtime config loaded for:', runtimeConfig.environment);

    return runtimeConfig;
  } catch (error) {
    console.error('Failed to load runtime config:', error);
    // Fallback to default config for development
    runtimeConfig = {
      apiUrl: 'http://localhost:3000',
      environment: 'development' as any,
      appName: 'Lobster Shop',
      features: {
        analyticsEnabled: false,
        debugMode: true,
      },
    };
    return runtimeConfig;
  }
}

/**
 * Get the API base URL from runtime config
 */
function getApiUrl(): string {
  if (!runtimeConfig) {
    throw new Error('Runtime config not loaded. Call loadRuntimeConfig() first.');
  }
  return runtimeConfig.apiUrl;
}

/**
 * Create a purchase (buy)
 */
export async function createPurchase(request: BuyRequest): Promise<BuyResponse> {
  const response = await axios.post<BuyResponse>(`${getApiUrl()}/api/purchase/buy`, request);
  return response.data;
}

/**
 * Get all purchases for a user
 * Calls public-api which proxies to private-api
 */
export async function getUserPurchases(userId: string): Promise<GetBuysResponse> {
  const response = await axios.get<GetBuysResponse>(`${getApiUrl()}/api/purchase/list`, {
    params: { userId },
  });
  return response.data;
}

/**
 * Get runtime config (already loaded)
 */
export function getRuntimeConfig(): FrontendConfig | null {
  return runtimeConfig;
}