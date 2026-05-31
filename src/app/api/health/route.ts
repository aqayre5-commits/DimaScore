import { NextResponse } from 'next/server';
import { getDataProvider } from '@/lib/data';

export async function GET() {
  try {
    const provider = getDataProvider();
    const status = await provider.getStatus();
    return NextResponse.json({ status: 'ok', account: status });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
