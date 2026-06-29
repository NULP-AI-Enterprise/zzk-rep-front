import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'https://zzk-registr.thesis-i.com';

export async function GET() {
  try {
    const start = Date.now();
    const res = await fetch(`${BACKEND}/health`, { cache: 'no-store' });
    const latency = Date.now() - start;
    if (res.ok) {
      return NextResponse.json({ status: 'ok', backend: 'up', latency_ms: latency });
    }
    return NextResponse.json(
      { status: 'degraded', backend: 'down', latency_ms: latency },
      { status: 503 },
    );
  } catch (err) {
    return NextResponse.json(
      { status: 'error', backend: 'unreachable', error: String(err) },
      { status: 503 },
    );
  }
}
