import type { NextRequest } from 'next/server';
import station from '../../../../src/lib/Station';

/**
 * GET handler for retrieving station status
 * @returns JSON response with station status or error
 */
export async function GET(_request: NextRequest): Promise<Response> {
  if (!station.isInitialized) {
    return Response.json(
      { error: 'Station not initialized' },
      { status: 400 }
    );
  }
  return Response.json(station.getStatus());
}
