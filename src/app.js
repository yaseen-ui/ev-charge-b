const express = require('express');
const station = require('./models/Station');
const loadBalancer = require('./services/LoadBalancer');
const engine = require('./services/Engine');

const app = express();
app.use(express.json());

// POST /station/init
app.post('/station/init', (req, res) => {
  const { totalPowerKw, plugCount, plugMaxPowerKw } = req.body;
  if (!totalPowerKw || !plugCount || !plugMaxPowerKw) {
    return res.status(400).json({ error: 'Missing configuration parameters' });
  }
  station.init({ totalPowerKw, plugCount, plugMaxPowerKw });
  res.json({ message: 'Station initialized', status: station.getStatus() });
});

// GET /station/status
app.get('/station/status', (req, res) => {
  if (!station.isInitialized) {
    return res.status(400).json({ error: 'Station not initialized' });
  }
  res.json(station.getStatus());
});

// POST /vehicles/connect
app.post('/vehicles/connect', (req, res) => {
  if (!station.isInitialized) {
    return res.status(400).json({ error: 'Station not initialized' });
  }
  const { id, requestedKwh, priority } = req.body;
  if (!id || !requestedKwh || !priority) {
    return res.status(400).json({ error: 'Missing vehicle parameters' });
  }
  const vehicle = loadBalancer.connectVehicle({ id, requestedKwh, priority });
  res.json({ message: 'Vehicle connected', vehicle });
});

// GET /vehicles
app.get('/vehicles', (req, res) => {
  res.json(station.getAllVehicles());
});

// POST /engine/start
app.post('/engine/start', (req, res) => {
  const result = engine.start();
  res.json(result);
});

// POST /engine/stop
app.post('/engine/stop', (req, res) => {
  const result = engine.stop();
  res.json(result);
});

// GET /engine/status
app.get('/engine/status', (req, res) => {
  res.json(engine.getStatus());
});

module.exports = app;
