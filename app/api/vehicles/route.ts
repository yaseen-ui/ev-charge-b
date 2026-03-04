import type { NextRequest } from 'next/server';
import station from '../../../src/lib/Station';

/**
 * GET handler for retrieving all vehicles with time estimates
 * @returns JSON response with vehicles and their time estimates
 */
export async function GET(_request: NextRequest): Promise<Response> {
  return Response.json(station.getVehiclesWithTimeEstimates());
}
