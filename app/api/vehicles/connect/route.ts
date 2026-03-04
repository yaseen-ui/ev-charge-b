import type { NextRequest } from 'next/server';
import station from '../../../../src/lib/Station';
import loadBalancer from '../../../../src/lib/LoadBalancer';
import type { VehiclePriority, Vehicle } from '../../../../src/models/Station';

/**
 * Request body for connecting a vehicle
 */
interface ConnectVehicleRequestBody {
  id: string;
  requestedKwh: number;
  priority: VehiclePriority;
}

/**
 * POST handler for connecting a vehicle to the station
 * @param request - The incoming request with vehicle details
 * @returns JSON response with connection result
 */
export async function POST(request: NextRequest): Promise<Response> {
  if (!station.isInitialized) {
    return Response.json(
      { error: 'Station not initialized' },
      { status: 400 }
    );
  }

  const body: ConnectVehicleRequestBody = await request.json();
  const { id, requestedKwh, priority } = body;

  if (!id || !requestedKwh || !priority) {
    return Response.json(
      { error: 'Missing vehicle parameters' },
      { status: 400 }
    );
  }

  const vehicle: Vehicle = loadBalancer.connectVehicle({ id, requestedKwh, priority });
  return Response.json({ message: 'Vehicle connected', vehicle });
}
