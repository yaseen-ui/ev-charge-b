const station = require('../../../src/lib/Station');

async function GET() {
  return Response.json(station.getVehiclesWithTimeEstimates());
}

module.exports = { GET };
