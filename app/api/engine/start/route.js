const engine = require('../../../../src/lib/Engine');

async function POST() {
  const result = engine.start();
  return Response.json(result);
}

module.exports = { POST };
