import { NextResponse } from 'next/server';
import { getAgent, getAgentCalibration, getAgentDecisions } from '@/lib/agents-data';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const agent = await getAgent(params.id);
    if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const [calibration, decisions] = await Promise.all([
      getAgentCalibration(params.id),
      getAgentDecisions(params.id, 100),
    ]);

    return NextResponse.json({ agent, calibration, decisions });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
