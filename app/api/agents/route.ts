import { NextResponse } from 'next/server';
import { getAgentFleet } from '@/lib/agents-data';

export async function GET() {
  try {
    const fleet = await getAgentFleet();
    return NextResponse.json({ fleet });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
