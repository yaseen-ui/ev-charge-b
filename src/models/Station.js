class Station {
  constructor() {
    this.totalPowerKw = 0;
    this.plugCount = 0;
    this.plugMaxPowerKw = 0;
    this.activePlugs = []; // { vehicleId, allocatedKw }
    this.queue = []; // { vehicleId, requestedKwh, priority, timestamp }
    this.vehicles = {}; // { id: { id, requestedKwh, priority, status, allocatedKw, chargedKwh, connectedAt } }
    this.isInitialized = false;
  }

  init(config) {
    this.totalPowerKw = config.totalPowerKw;
    this.plugCount = config.plugCount;
    this.plugMaxPowerKw = config.plugMaxPowerKw;
    this.activePlugs = [];
    this.queue = [];
    this.vehicles = {};
    this.isInitialized = true;
  }

  getStatus() {
    return {
      totalPowerKw: this.totalPowerKw,
      plugCount: this.plugCount,
      plugMaxPowerKw: this.plugMaxPowerKw,
      availablePlugs: this.plugCount - this.activePlugs.length,
      activePlugs: this.activePlugs,
      queueLength: this.queue.length,
      queue: this.queue
    };
  }

  addVehicle(vehicle) {
    this.vehicles[vehicle.id] = {
      id: vehicle.id,
      requestedKwh: vehicle.requestedKwh,
      priority: vehicle.priority,
      status: 'pending',
      allocatedKw: 0,
      chargedKwh: 0,
      connectedAt: new Date()
    };
    this.queue.push({
      vehicleId: vehicle.id,
      requestedKwh: vehicle.requestedKwh,
      priority: vehicle.priority,
      timestamp: Date.now()
    });
    this.sortQueue();
  }

  sortQueue() {
    const priorityMap = { 'emergency': 0, 'vip': 1, 'normal': 2 };
    this.queue.sort((a, b) => {
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[a.priority] - priorityMap[b.priority];
      }
      return a.timestamp - b.timestamp;
    });
  }

  assignPlug(vehicleId) {
    if (this.activePlugs.length < this.plugCount) {
      const vehicle = this.vehicles[vehicleId];
      this.activePlugs.push({ vehicleId, allocatedKw: 0 });
      this.vehicles[vehicleId].status = 'charging';
      // Remove from queue
      this.queue = this.queue.filter(q => q.vehicleId !== vehicleId);
      return true;
    }
    return false;
  }

  releasePlug(vehicleId) {
    this.activePlugs = this.activePlugs.filter(p => p.vehicleId !== vehicleId);
    if (this.vehicles[vehicleId]) {
      this.vehicles[vehicleId].status = 'completed';
      this.vehicles[vehicleId].allocatedKw = 0;
    }
  }

  getChargingVehicles() {
    return Object.values(this.vehicles).filter(v => v.status === 'charging');
  }

  getAllVehicles() {
    return Object.values(this.vehicles);
  }
}

module.exports = new Station();
