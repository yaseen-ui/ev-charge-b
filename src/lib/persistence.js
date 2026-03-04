const station = require('../models/Station');
const updateEmitter = require('./Events');
const { readData, writeData } = require('./storage');

let persistTimeout = null;
const PERSIST_DEBOUNCE_MS = 100;

/**
 * Loads persisted data into the Station singleton on server startup.
 * If no data file exists, initializes with empty/default data.
 */
async function loadPersistedData() {
  console.log('Loading persisted data...');
  
  const data = await readData();
  
  if (!data) {
    console.log('No persisted data found or error reading file. Starting with fresh state.');
    return;
  }
  
  if (!data.isInitialized) {
    console.log('Persisted data indicates station was not initialized. Starting fresh.');
    return;
  }
  
  // Restore station configuration
  station.totalPowerKw = data.totalPowerKw;
  station.plugCount = data.plugCount;
  station.plugMaxPowerKw = data.plugMaxPowerKw;
  station.isInitialized = data.isInitialized;
  
  // Restore active plugs
  station.activePlugs = data.activePlugs.map(plug => ({
    vehicleId: plug.vehicleId,
    allocatedKw: plug.allocatedKw
  }));
  
  // Restore queue
  station.queue = data.queue.map(item => ({
    vehicleId: item.vehicleId,
    requestedKwh: item.requestedKwh,
    priority: item.priority,
    timestamp: item.timestamp
  }));
  
  // Restore vehicles (convert date strings back to Date objects)
  station.vehicles = {};
  for (const [id, vehicle] of Object.entries(data.vehicles)) {
    station.vehicles[id] = {
      id: vehicle.id,
      requestedKwh: vehicle.requestedKwh,
      priority: vehicle.priority,
      status: vehicle.status,
      allocatedKw: vehicle.allocatedKw,
      chargedKwh: vehicle.chargedKwh,
      connectedAt: new Date(vehicle.connectedAt)
    };
  }
  
  console.log('Persisted data loaded successfully.');
}

/**
 * Saves current station state to persistent storage.
 */
async function savePersistedData() {
  const data = {
    totalPowerKw: station.totalPowerKw,
    plugCount: station.plugCount,
    plugMaxPowerKw: station.plugMaxPowerKw,
    activePlugs: station.activePlugs,
    queue: station.queue,
    vehicles: Object.fromEntries(
      Object.entries(station.vehicles).map(([id, vehicle]) => [
        id,
        {
          ...vehicle,
          connectedAt: vehicle.connectedAt.toISOString()
        }
      ]
    )),
    isInitialized: station.isInitialized
  };
  
  const success = await writeData(data);
  if (success) {
    console.log('Data persisted successfully.');
  } else {
    console.error('Failed to persist data.');
  }
  return success;
}

function schedulePersist() {
  if (persistTimeout) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(async () => {
    await savePersistedData();
    persistTimeout = null;
  }, PERSIST_DEBOUNCE_MS);
}

function attachPersistenceListeners() {
  updateEmitter.on('update', () => {
    schedulePersist();
  });
}

module.exports = {
  loadPersistedData,
  savePersistedData,
  attachPersistenceListeners
};