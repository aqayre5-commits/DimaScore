import { NextResponse } from 'next/server';
import {
  validateCredentials,
  createAdminSessionCookie,
  destroyAdminSessionCookie,
} from '@/lib/auth/admin';

const LOGIN_WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 },
    );
  }
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (!validateCredentials(email, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const cookie = createAdminSessionCookie(email.trim().toLowerCase());
  const res = NextResponse.json({ ok: true, email: cookie.name });
  res.cookies.set(cookie);

  return res;
}

export async function DELETE() {
  const cookie = destroyAdminSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie);

  return res;
}
