import { timingSafeEqual } from 'crypto';

export function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !process.env.CRON_SECRET) return false;

  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
  const actual = Buffer.from(authHeader);
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual);
}
