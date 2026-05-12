import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RateLimitExceededError } from '@/lib/data/errors';
import { setQuota } from './tracker';

export interface QuotaHeaders {
  dailyLimit: number;
  dailyRemaining: number;
  minuteLimit: number;
  minuteRemaining: number;
}

export function extractQuotaHeaders(
  headers: Record<string, string | undefined>,
): QuotaHeaders | null {
  const dailyLimit = parseInt(headers['x-ratelimit-requests-limit'] ?? '', 10);
  const dailyRemaining = parseInt(headers['x-ratelimit-requests-remaining'] ?? '', 10);
  const minuteLimit = parseInt(headers['x-ratelimit-limit'] ?? '', 10);
  const minuteRemaining = parseInt(headers['x-ratelimit-remaining'] ?? '', 10);

  if ([dailyLimit, dailyRemaining, minuteLimit, minuteRemaining].some(isNaN)) {
    return null;
  }

  return { dailyLimit, dailyRemaining, minuteLimit, minuteRemaining };
}

export function createQuotaResponseInterceptor() {
  return async (response: AxiosResponse): Promise<AxiosResponse> => {
    const headers: Record<string, string | undefined> = {};
    for (const key of [
      'x-ratelimit-requests-limit',
      'x-ratelimit-requests-remaining',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
    ]) {
      headers[key] = response.headers[key] as string | undefined;
    }

    const quota = extractQuotaHeaders(headers);
    if (quota) {
      try {
        await setQuota({
          daily: { limit: quota.dailyLimit, remaining: quota.dailyRemaining },
          minute: { limit: quota.minuteLimit, remaining: quota.minuteRemaining },
        });
      } catch {
        // Redis unconfigured or unreachable — skip quota tracking
      }

      if (quota.minuteRemaining <= 0) {
        throw new RateLimitExceededError('minute', quota.minuteRemaining);
      }
    }

    return response;
  };
}

export function createQuotaRequestInterceptor() {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    return config;
  };
}
