const engine = require('../../../../src/lib/Engine');

async function POST() {
  const result = engine.stop();
  return Response.json(result);
}

module.exports = { POST };
