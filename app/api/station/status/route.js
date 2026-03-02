const station = require('../../../../src/lib/Station');

async function GET() {
  if (!station.isInitialized) {
    return Response.json({ error: 'Station not initialized' }, { status: 400 });
  }
  return Response.json(station.getStatus());
}

module.exports = { GET };
