import station from './Station';
import updateEmitter from './Events';
import type { VehicleInput, Vehicle } from '../models/Station';

class LoadBalancer {
  processQueue(): void {
    if (!station.isInitialized) return;

    while (station.activePlugs.length < station.plugCount && station.queue.length > 0) {
      const nextVehicle = station.queue[0];
      station.assignPlug(nextVehicle.vehicleId);
    }

    this.rebalancePower();
    updateEmitter.emitUpdate();
  }

  rebalancePower(): void {
    if (station.activePlugs.length === 0) return;

    const chargingVehicles = station.getChargingVehicles();
    if (chargingVehicles.length === 0) return;

    const priorityOrder = ['emergency', 'vip', 'normal'] as const;
    const groups: Record<typeof priorityOrder[number], Vehicle[]> = {
      emergency: [],
      vip: [],
      normal: []
    };

    chargingVehicles.forEach(v => {
      groups[v.priority].push(v);
    });

    let remainingPower = station.totalPowerKw;
    const allocations: Record<string, number> = {};

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
    updateEmitter.emitUpdate();
  }

  connectVehicle(vehicle: VehicleInput): Vehicle {
    station.addVehicle(vehicle);
    this.processQueue();
    return station.vehicles[vehicle.id];
  }

  handleVehicleComplete(vehicleId: string): void {
    station.releasePlug(vehicleId);
    this.processQueue();
  }
}

// Use a global singleton to persist across hot reloads in Next.js dev mode
const globalLB = globalThis as unknown as { __loadBalancerInstance: LoadBalancer };
if (!globalLB.__loadBalancerInstance) {
  globalLB.__loadBalancerInstance = new LoadBalancer();
}
const loadBalancerInstance = globalLB.__loadBalancerInstance;

export default loadBalancerInstance;
