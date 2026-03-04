import type { NextRequest } from 'next/server';
import station from '../../../../src/lib/Station';

/**
 * Request body for initializing the station
 */
interface InitRequestBody {
  totalPowerKw: number;
  plugCount: number;
  plugMaxPowerKw: number;
}

/**
 * POST handler for initializing the station
 * @param request - The incoming request with station configuration
 * @returns JSON response with initialization result
 */
export async function POST(request: NextRequest): Promise<Response> {
  const body: InitRequestBody = await request.json();
  const { totalPowerKw, plugCount, plugMaxPowerKw } = body;

  if (!totalPowerKw || !plugCount || !plugMaxPowerKw) {
    return Response.json(
      { error: 'Missing configuration parameters' },
      { status: 400 }
    );
  }

  station.init({ totalPowerKw, plugCount, plugMaxPowerKw });
  return Response.json({
    message: 'Station initialized',
    status: station.getStatus()
  });
}
