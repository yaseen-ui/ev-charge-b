const station = require('../models/Station');

class LoadBalancer {
  processQueue() {
    if (!station.isInitialized) return;

    // Try to assign plugs to vehicles in the queue (already sorted by priority)
    while (station.activePlugs.length < station.plugCount && station.queue.length > 0) {
      const nextVehicle = station.queue[0];
      station.assignPlug(nextVehicle.vehicleId);
    }

    // Re-calculate power for all active plugs
    this.rebalancePower();
  }

  rebalancePower() {
    if (station.activePlugs.length === 0) return;

    const chargingVehicles = station.getChargingVehicles();
    if (chargingVehicles.length === 0) return;

    // Group by priority
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

    // Distribute power by priority
    for (const priority of priorityOrder) {
      const vehicles = groups[priority];
      if (vehicles.length === 0) continue;

      // Calculate power per vehicle for this priority group
      // Each vehicle gets min(plugMaxPowerKw, remainingPower / vehicles.length)
      const powerPerVehicle = Math.min(
        station.plugMaxPowerKw,
        remainingPower / vehicles.length
      );

      vehicles.forEach(v => {
        allocations[v.id] = Math.min(powerPerVehicle, station.plugMaxPowerKw);
        remainingPower -= allocations[v.id];
      });
    }

    // Apply allocations to plugs and vehicles
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

  // Called when a vehicle completes charging
  handleVehicleComplete(vehicleId) {
    station.releasePlug(vehicleId);
    this.processQueue();
  }
}

module.exports = new LoadBalancer();
