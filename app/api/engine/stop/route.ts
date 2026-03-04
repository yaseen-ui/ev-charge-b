import type { NextRequest } from 'next/server';
import engine from '../../../../src/lib/Engine';

/**
 * POST handler for stopping the engine
 * @returns JSON response with engine stop result
 */
export async function POST(_request: NextRequest): Promise<Response> {
  const result = engine.stop();
  return Response.json(result);
}
