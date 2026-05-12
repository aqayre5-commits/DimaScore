export class ApiFootballError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
  ) {
    super(message);
    this.name = 'ApiFootballError';
  }
}

export class RateLimitExceededError extends ApiFootballError {
  constructor(
    public readonly limitType: 'daily' | 'minute',
    public readonly remaining: number,
  ) {
    super(`Rate limit exceeded (${limitType}): ${remaining} remaining`, 429);
    this.name = 'RateLimitExceededError';
  }
}
