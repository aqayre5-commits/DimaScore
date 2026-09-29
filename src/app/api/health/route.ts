import { NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/data';

export async function GET() {
  try {
    const provider = getDataProvider();
    // Liveness only: confirm the upstream provider is reachable, but never serialize the
    // account payload (holder name/email, subscription, quota) to unauthenticated callers.
    await provider.getStatus();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
