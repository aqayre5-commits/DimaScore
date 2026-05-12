import axios from 'axios';
import { createQuotaResponseInterceptor } from '@/lib/quota/middleware';
import { ApiFootballError } from '@/lib/data/errors';
import type { ApiResponse } from './types';

const BASE_URL = 'https://v3.football.api-sports.io';

function createClient() {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-apisports-key': process.env.API_FOOTBALL_KEY ?? '',
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

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<ApiResponse<T>> {
  const response = await getClient().get<ApiResponse<T>>(endpoint, { params });
  return response.data;
}

export { BASE_URL };
