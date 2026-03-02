const station = require('../../../../src/lib/Station');
const loadBalancer = require('../../../../src/lib/LoadBalancer');

async function POST(request) {
  if (!station.isInitialized) {
    return Response.json({ error: 'Station not initialized' }, { status: 400 });
  }

  const body = await request.json();
  const { id, requestedKwh, priority } = body;

  if (!id || !requestedKwh || !priority) {
    return Response.json({ error: 'Missing vehicle parameters' }, { status: 400 });
  }

  const vehicle = loadBalancer.connectVehicle({ id, requestedKwh, priority });
  return Response.json({ message: 'Vehicle connected', vehicle });
}

module.exports = { POST };
