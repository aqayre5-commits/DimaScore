import { NextResponse } from 'next/server';
import {
  validateCredentials,
  createAdminSessionCookie,
  destroyAdminSessionCookie,
} from '@/lib/auth/admin';

export async function POST(request: Request) {
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
