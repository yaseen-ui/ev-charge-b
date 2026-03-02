const station = require('./Station');

class LoadBalancer {
  processQueue() {
    if (!station.isInitialized) return;

    while (station.activePlugs.length < station.plugCount && station.queue.length > 0) {
      const nextVehicle = station.queue[0];
      station.assignPlug(nextVehicle.vehicleId);
    }

    this.rebalancePower();
  }

  rebalancePower() {
    if (station.activePlugs.length === 0) return;

    const chargingVehicles = station.getChargingVehicles();
    if (chargingVehicles.length === 0) return;

    const priorityOrder = ['emergency', 'vip', 'normal'];
    const groups = {
      emergency: [],
      vip: [],
      normal: []
    };

    chargingVehicles.forEach(v => {
      groups[v.priority].push(v);
    });

    let remainingPower = station.totalPowerKw;
    const allocations = {};

    for (const priority of priorityOrder) {
      const vehicles = groups[priority];
      if (vehicles.length === 0) continue;

      const powerPerVehicle = Math.min(
        station.plugMaxPowerKw,
        remainingPower / vehicles.length
      );

      vehicles.forEach(v => {
        allocations[v.id] = Math.min(powerPerVehicle, station.plugMaxPowerKw);
        remainingPower -= allocations[v.id];
      });
    }

    station.activePlugs.forEach(plug => {
      plug.allocatedKw = allocations[plug.vehicleId] || 0;
      if (station.vehicles[plug.vehicleId]) {
        station.vehicles[plug.vehicleId].allocatedKw = plug.allocatedKw;
      }
    });
  }

  connectVehicle(vehicle) {
    station.addVehicle(vehicle);
    this.processQueue();
    return station.vehicles[vehicle.id];
  }

  handleVehicleComplete(vehicleId) {
    station.releasePlug(vehicleId);
    this.processQueue();
  }
}

const loadBalancer = globalThis.__loadBalancer || new LoadBalancer();
if (!globalThis.__loadBalancer) {
  globalThis.__loadBalancer = loadBalancer;
}

module.exports = loadBalancer;
