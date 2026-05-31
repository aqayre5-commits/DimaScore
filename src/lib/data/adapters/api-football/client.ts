import axios from 'axios';
import { createQuotaResponseInterceptor } from '@/lib/quota/middleware';
import { ApiFootballError } from '@/lib/data/errors';
import type { ApiResponse } from './types';

const BASE_URL = 'https://v3.football.api-sports.io';

function createClient() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY environment variable is required');
  }

  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-apisports-key': apiKey,
    },
    timeout: 15_000,
  });

  instance.interceptors.response.use(createQuotaResponseInterceptor(), (error) => {
    if (axios.isAxiosError(error)) {
      throw new ApiFootballError(
        error.message,
        error.response?.status,
        error.config?.url ?? undefined,
      );
    }
    throw error;
  });

  return instance;
}

let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

const RETRY_DELAYS = [1000, 2000, 4000];

function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status && status >= 500) return true;
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
  return false;
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<ApiResponse<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const response = await getClient().get<ApiResponse<T>>(endpoint, { params });
      return response.data;
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_DELAYS.length && isRetryable(error)) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export { BASE_URL };
