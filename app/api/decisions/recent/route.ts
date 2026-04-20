import { NextResponse } from 'next/server';
import { getRecentPrismDecisions } from '@/lib/bridge-data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') ?? '30', 10));
  try {
    const decisions = await getRecentPrismDecisions(limit);
    return NextResponse.json({ decisions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
