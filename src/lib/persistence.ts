import station from './Station';
import storeManager from '../models/Store';
import { readData, writeData, PersistedData } from './storage';
import updateEmitter from './Events';

/**
 * Loads persisted data into the Station singleton on server startup.
 * If no data file exists, initializes with empty/default data.
 */
export function loadPersistedData(): void {
  console.log('Loading persisted data...');

  const data = readData();

  if (!data) {
    console.log('No persisted data found. Starting with fresh state.');
    return;
  }

  // Restore stores if present
  if (data.stores && Array.isArray(data.stores)) {
    storeManager.restore(data.stores);
    console.log(`Restored ${data.stores.length} stores.`);
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
    priority: item.priority as 'emergency' | 'vip' | 'normal',
    timestamp: item.timestamp
  }));

  // Restore vehicles (convert date strings back to Date objects)
  station.vehicles = {};
  for (const [id, vehicle] of Object.entries(data.vehicles)) {
    station.vehicles[id] = {
      id: vehicle.id,
      requestedKwh: vehicle.requestedKwh,
      priority: vehicle.priority as 'emergency' | 'vip' | 'normal',
      status: vehicle.status as 'pending' | 'charging' | 'completed',
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
export function savePersistedData(): boolean {
  const data: PersistedData = {
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
    isInitialized: station.isInitialized,
    stores: storeManager.toArray()
  };

  const success = writeData(data);
  if (success) {
    console.log('Data persisted successfully.');
  } else {
    console.error('Failed to persist data.');
  }
  return success;
}

/**
 * Attaches listeners to automatically save data on updates
 */
export function attachPersistenceListeners(): void {
  updateEmitter.on('update', () => {
    // Auto-save on every update
    savePersistedData();
  });
  console.log('Persistence listeners attached.');
}

export default {
  loadPersistedData,
  savePersistedData,
  attachPersistenceListeners
};