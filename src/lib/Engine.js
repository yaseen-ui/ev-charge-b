const station = require('./Station');
const loadBalancer = require('./LoadBalancer');

class Engine {
  constructor() {
    this.intervalId = null;
    this.running = false;
    this.locked = false;
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

      for (const vehicle of chargingVehicles) {
        const chargeAmount = vehicle.allocatedKw / 3600;
        vehicle.chargedKwh += chargeAmount;

        if (station.vehicles[vehicle.id]) {
          station.vehicles[vehicle.id].chargedKwh = vehicle.chargedKwh;
        }

        if (vehicle.chargedKwh >= vehicle.requestedKwh) {
          loadBalancer.handleVehicleComplete(vehicle.id);
        }
      }

      loadBalancer.rebalancePower();

    } finally {
      this.locked = false;
    }
  }

  getStatus() {
    return { running: this.running };
  }
}

const engine = globalThis.__engine || new Engine();
if (!globalThis.__engine) {
  globalThis.__engine = engine;
}

module.exports = engine;
