import type { NextRequest } from 'next/server';
import engine from '../../../../src/lib/Engine';

/**
 * POST handler for starting the engine
 * @returns JSON response with engine start result
 */
export async function POST(_request: NextRequest): Promise<Response> {
  const result = engine.start();
  return Response.json(result);
}
