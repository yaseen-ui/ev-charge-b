const station = require('../models/Station');
const loadBalancer = require('./LoadBalancer');

class Engine {
  constructor() {
    this.intervalId = null;
    this.running = false;
    this.locked = false; // Simple lock for race condition prevention
  }

  start() {
    if (this.running || this.locked) {
      return { message: 'Engine already running or starting', running: this.running };
    }

    this.locked = true;
    this.running = true;
    this.locked = false;

    this.intervalId = setInterval(() => this.tick(), 1000);
    return { message: 'Engine started', running: true };
  }

  stop() {
    if (this.locked) {
      return { message: 'Engine is locked', running: this.running };
    }

    this.locked = true;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    this.locked = false;

    return { message: 'Engine stopped', running: false };
  }

  tick() {
    if (!station.isInitialized || this.locked) return;

    this.locked = true;

    try {
      const chargingVehicles = station.getChargingVehicles();

      // Charge each vehicle
      for (const vehicle of chargingVehicles) {
        // chargedKwh += allocatedKw / 3600 (since tick is every 1 second)
        const chargeAmount = vehicle.allocatedKw / 3600;
        vehicle.chargedKwh += chargeAmount;

        // Update in station
        if (station.vehicles[vehicle.id]) {
          station.vehicles[vehicle.id].chargedKwh = vehicle.chargedKwh;
        }

        // Check if complete
        if (vehicle.chargedKwh >= vehicle.requestedKwh) {
          loadBalancer.handleVehicleComplete(vehicle.id);
        }
      }

      // Rebalance power after potential completions
      loadBalancer.rebalancePower();

    } finally {
      this.locked = false;
    }
  }

  getStatus() {
    return { running: this.running };
  }
}

module.exports = new Engine();