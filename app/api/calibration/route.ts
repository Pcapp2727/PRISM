import { NextResponse } from 'next/server';
import { getReliabilityDiagram } from '@/lib/agents-data';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const result = await getReliabilityDiagram({
      agentId: url.searchParams.get('agent') ?? undefined,
      domain:  url.searchParams.get('domain') ?? undefined,
      lookbackDays: url.searchParams.get('days')
        ? parseInt(url.searchParams.get('days')!, 10)
        : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
