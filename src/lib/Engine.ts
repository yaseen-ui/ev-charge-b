import station from './Station';
import loadBalancer from './LoadBalancer';
import updateEmitter from './Events';

export interface EngineStatus {
  running: boolean;
}

export interface EngineStartResult {
  message: string;
  running: boolean;
}

export interface EngineStopResult {
  message: string;
  running: boolean;
}

class Engine {
  private intervalId: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private locked: boolean = false;

  start(): EngineStartResult {
    if (this.running || this.locked) {
      return { message: 'Engine already running or starting', running: this.running };
    }

    this.locked = true;
    this.running = true;
    this.locked = false;

    this.intervalId = setInterval(() => this.tick(), 1000);
    updateEmitter.emitUpdate();
    return { message: 'Engine started', running: true };
  }

  stop(): EngineStopResult {
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

    updateEmitter.emitUpdate();
    return { message: 'Engine stopped', running: false };
  }

  tick(): void {
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
      updateEmitter.emitUpdate();
    } finally {
      this.locked = false;
    }
  }

  getStatus(): EngineStatus {
    return { running: this.running };
  }
}

// Use a global singleton to persist across hot reloads in Next.js dev mode
const globalEngine = globalThis as unknown as { __engineInstance: Engine };
if (!globalEngine.__engineInstance) {
  globalEngine.__engineInstance = new Engine();
}
const engineInstance = globalEngine.__engineInstance;

export default engineInstance;
