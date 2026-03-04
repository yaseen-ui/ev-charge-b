
import type { NextRequest } from 'next/server';
import engine from '../../../../src/lib/Engine';

/**
 * GET handler for retrieving engine status
 * @returns JSON response with current engine status
 */
export async function GET(_request: NextRequest): Promise<Response> {
  return Response.json(engine.getStatus());
}
