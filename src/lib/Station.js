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
    const priorityMap = { emergency: 0, vip: 1, normal: 2 };
    this.queue.sort((a, b) => {
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[a.priority] - priorityMap[b.priority];
      }
      return a.timestamp - b.timestamp;
    });
  }

  assignPlug(vehicleId) {
    if (this.activePlugs.length < this.plugCount) {
      this.activePlugs.push({ vehicleId, allocatedKw: 0 });
      if (this.vehicles[vehicleId]) {
        this.vehicles[vehicleId].status = 'charging';
      }
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

  // Calculate time remaining for a charging vehicle (in seconds)
  getTimeRemaining(vehicle) {
    if (vehicle.status !== 'charging' || vehicle.allocatedKw <= 0) {
      return null;
    }
    const remainingKwh = vehicle.requestedKwh - vehicle.chargedKwh;
    if (remainingKwh <= 0) return 0;
    // Time = Energy / Power (in hours), convert to seconds
    return (remainingKwh / vehicle.allocatedKw) * 3600;
  }

  // Calculate estimated wait time for a queued vehicle (in seconds)
  getQueueWaitTime(vehicleId) {
    const queueIndex = this.queue.findIndex(q => q.vehicleId === vehicleId);
    if (queueIndex === -1) return null;

    // Count how many vehicles are ahead in queue
    const vehiclesAhead = queueIndex;
    
    // Calculate time until a plug becomes available
    // This is complex because we need to estimate when current charging vehicles will finish
    // and how that affects the queue
    
    // Get all charging vehicles with their remaining time
    const chargingVehicles = this.getChargingVehicles()
      .map(v => ({
        vehicleId: v.id,
        timeRemaining: this.getTimeRemaining(v)
      }))
      .filter(v => v.timeRemaining !== null)
      .sort((a, b) => a.timeRemaining - b.timeRemaining);

    // Available plugs now
    const availablePlugsNow = this.plugCount - this.activePlugs.length;
    
    // If there's an available plug, wait time is minimal
    if (availablePlugsNow > 0 && vehiclesAhead === 0) {
      return 0;
    }

    // Calculate how many need to finish before this vehicle gets a plug
    const plugsNeeded = vehiclesAhead + 1 - availablePlugsNow;
    
    if (plugsNeeded <= 0) {
      return 0;
    }

    // Sum up the time for the first 'plugsNeeded' vehicles to finish
    // This is an approximation - assumes vehicles finish one at a time
    let totalWaitTime = 0;
    let plugsFreed = 0;
    
    for (const cv of chargingVehicles) {
      if (plugsFreed >= plugsNeeded) break;
      totalWaitTime = cv.timeRemaining; // Time when this plug frees
      plugsFreed++;
    }

    // If we still need more plugs, add estimated time based on average charging
    if (plugsFreed < plugsNeeded && chargingVehicles.length > 0) {
      // Estimate based on average charging time of current vehicles
      const avgChargingTime = chargingVehicles.reduce((sum, v) => sum + v.timeRemaining, 0) / chargingVehicles.length;
      const remainingPlugsNeeded = plugsNeeded - plugsFreed;
      totalWaitTime += avgChargingTime * remainingPlugsNeeded;
    }

    return Math.max(0, Math.round(totalWaitTime));
  }

  // Get enhanced vehicle data with time estimates
  getVehiclesWithTimeEstimates() {
    return this.getAllVehicles().map(vehicle => {
      const enhanced = { ...vehicle };
      
      if (vehicle.status === 'charging') {
        enhanced.timeRemainingSeconds = this.getTimeRemaining(vehicle);
      } else if (vehicle.status === 'pending') {
        enhanced.waitTimeSeconds = this.getQueueWaitTime(vehicle.id);
      }
      
      return enhanced;
    });
  }
}

const station = globalThis.__station || new Station();
if (!globalThis.__station) {
  globalThis.__station = station;
}

module.exports = station;
