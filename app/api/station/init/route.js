const station = require('../../../../src/lib/Station');

async function POST(request) {
  const body = await request.json();
  const { totalPowerKw, plugCount, plugMaxPowerKw } = body;

  if (!totalPowerKw || !plugCount || !plugMaxPowerKw) {
    return Response.json({ error: 'Missing configuration parameters' }, { status: 400 });
  }

  station.init({ totalPowerKw, plugCount, plugMaxPowerKw });
  return Response.json({ message: 'Station initialized', status: station.getStatus() });
}

module.exports = { POST };
