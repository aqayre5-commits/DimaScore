import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
// ── Types ──

export interface AdminSession {
  email: string;
}

/** Duck type for both RequestCookies (middleware) and ReadonlyRequestCookies (server components). */
interface CookieStore {
  get(name: string): { value: string } | undefined;
}

export interface ResponseCookie {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  path: string;
  maxAge: number;
}

// ── Constants ──

const COOKIE_NAME = 'ak_admin_session';
const SESSION_MAX_AGE = 86400; // 24 hours

// ── Env helpers ──

function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET env var is not set');
  return secret;
}

function getAllowedEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// ── HMAC signing ──

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = sign(payload, secret);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, 'utf-8'), Buffer.from(signature, 'utf-8'));
}

// ── Token encode / decode ──

function encodeToken(email: string): string {
  const secret = getSecret();
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  const sig = sign(payload, secret);
  return `${payload}.${sig}`;
}

function decodeToken(token: string): AdminSession | null {
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const secret = getSecret();

  if (!verifySignature(payload, sig, secret)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      email: string;
      exp: number;
    };

    // Check expiry
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    // Check email is still in allowlist
    const allowed = getAllowedEmails();
    if (!allowed.includes(data.email.toLowerCase())) return null;

    return { email: data.email };
  } catch {
    return null;
  }
}

// ── Public API ──

/**
 * Validate admin credentials (email in allowlist + correct password).
 * Returns true if valid, false otherwise.
 */
export function validateCredentials(email: string, password: string): boolean {
  const allowed = getAllowedEmails();
  const secret = getSecret();
  return allowed.includes(email.trim().toLowerCase()) && password === secret;
}

/**
 * For API route handlers. Reads cookie from request, verifies session.
 * Returns the session or a 401 Response.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminSession | Response> {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  const session = decodeToken(cookie.value);
  if (!session) {
    return Response.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  return session;
}

/**
 * For server components and middleware. Returns session or null.
 */
export function getAdminSession(cookieStore: CookieStore): AdminSession | null {
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return decodeToken(cookie.value);
}

/**
 * Build a signed session cookie for the given admin email.
 */
export function createAdminSessionCookie(email: string): ResponseCookie {
  return {
    name: COOKIE_NAME,
    value: encodeToken(email),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Build a cookie that expires the session.
 */
export function destroyAdminSessionCookie(): ResponseCookie {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  };
}
