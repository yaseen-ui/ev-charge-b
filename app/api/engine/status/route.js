const engine = require('../../../../src/lib/Engine');

async function GET() {
  return Response.json(engine.getStatus());
}

module.exports = { GET };
