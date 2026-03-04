import updateEmitter from '../lib/Events';

// Type definitions for the Station model

export type VehiclePriority = 'emergency' | 'vip' | 'normal';

export type VehicleStatus = 'pending' | 'charging' | 'completed';

export interface StationConfig {
  totalPowerKw: number;
  plugCount: number;
  plugMaxPowerKw: number;
}

export interface Vehicle {
  id: string;
  requestedKwh: number;
  priority: VehiclePriority;
  status: VehicleStatus;
  allocatedKw: number;
  chargedKwh: number;
  connectedAt: Date;
}

export interface ActivePlug {
  vehicleId: string;
  allocatedKw: number;
}

export interface QueueItem {
  vehicleId: string;
  requestedKwh: number;
  priority: VehiclePriority;
  timestamp: number;
}

export interface StationStatus {
  totalPowerKw: number;
  plugCount: number;
  plugMaxPowerKw: number;
  availablePlugs: number;
  activePlugs: ActivePlug[];
  queueLength: number;
  queue: QueueItem[];
}

export interface VehicleInput {
  id: string;
  requestedKwh: number;
  priority: VehiclePriority;
}

class Station {
  public totalPowerKw: number = 0;
  public plugCount: number = 0;
  public plugMaxPowerKw: number = 0;
  public activePlugs: ActivePlug[] = [];
  public queue: QueueItem[] = [];
  public vehicles: Record<string, Vehicle> = {};
  public isInitialized: boolean = false;

  init(config: StationConfig): void {
    this.totalPowerKw = config.totalPowerKw;
    this.plugCount = config.plugCount;
    this.plugMaxPowerKw = config.plugMaxPowerKw;
    this.activePlugs = [];
    this.queue = [];
    this.vehicles = {};
    this.isInitialized = true;
    updateEmitter.emitUpdate();
  }

  getStatus(): StationStatus {
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

  addVehicle(vehicle: VehicleInput): void {
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
    updateEmitter.emitUpdate();
  }

  private sortQueue(): void {
    const priorityMap: Record<VehiclePriority, number> = {
      emergency: 0,
      vip: 1,
      normal: 2
    };
    this.queue.sort((a, b) => {
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
        return priorityMap[a.priority] - priorityMap[b.priority];
      }
      return a.timestamp - b.timestamp;
    });
  }

  assignPlug(vehicleId: string): boolean {
    if (this.activePlugs.length < this.plugCount) {
      this.activePlugs.push({ vehicleId, allocatedKw: 0 });
      if (this.vehicles[vehicleId]) {
        this.vehicles[vehicleId].status = 'charging';
      }
      // Remove from queue
      this.queue = this.queue.filter(q => q.vehicleId !== vehicleId);
      updateEmitter.emitUpdate();
      return true;
    }
    return false;
  }

  releasePlug(vehicleId: string): void {
    this.activePlugs = this.activePlugs.filter(p => p.vehicleId !== vehicleId);
    if (this.vehicles[vehicleId]) {
      this.vehicles[vehicleId].status = 'completed';
      this.vehicles[vehicleId].allocatedKw = 0;
    }
    updateEmitter.emitUpdate();
  }

  getChargingVehicles(): Vehicle[] {
    return Object.values(this.vehicles).filter(v => v.status === 'charging');
  }

  getAllVehicles(): Vehicle[] {
    return Object.values(this.vehicles);
  }

  // Calculate time remaining for a charging vehicle (in seconds)
  getTimeRemaining(vehicle: Vehicle): number | null {
    if (vehicle.status !== 'charging' || vehicle.allocatedKw <= 0) {
      return null;
    }
    const remainingKwh = vehicle.requestedKwh - vehicle.chargedKwh;
    if (remainingKwh <= 0) return 0;
    // Time = Energy / Power (in hours), convert to seconds
    return (remainingKwh / vehicle.allocatedKw) * 3600;
  }

  // Calculate estimated wait time for a queued vehicle (in seconds)
  getQueueWaitTime(vehicleId: string): number | null {
    const queueIndex = this.queue.findIndex(q => q.vehicleId === vehicleId);
    if (queueIndex === -1) return null;

    // Count how many vehicles are ahead in queue
    const vehiclesAhead = queueIndex;
    
    // Get all charging vehicles with their remaining time
    const chargingVehicles = this.getChargingVehicles()
      .map(v => ({
        vehicleId: v.id,
        timeRemaining: this.getTimeRemaining(v)
      }))
      .filter((v): v is { vehicleId: string; timeRemaining: number } => v.timeRemaining !== null)
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
    let totalWaitTime = 0;
    let plugsFreed = 0;
    
    for (const cv of chargingVehicles) {
      if (plugsFreed >= plugsNeeded) break;
      totalWaitTime = cv.timeRemaining; 
      plugsFreed++;
    }

    // If we still need more plugs, add estimated time based on average charging
    if (plugsFreed < plugsNeeded && chargingVehicles.length > 0) {
      const avgChargingTime = chargingVehicles.reduce((sum, v) => sum + v.timeRemaining, 0) / chargingVehicles.length;
      const remainingPlugsNeeded = plugsNeeded - plugsFreed;
      totalWaitTime += avgChargingTime * remainingPlugsNeeded;
    }

    return Math.max(0, Math.round(totalWaitTime));
  }

  // Get enhanced vehicle data with time estimates
  getVehiclesWithTimeEstimates() {
    return this.getAllVehicles().map(vehicle => {
      const enhanced: Vehicle & { timeRemainingSeconds?: number | null; waitTimeSeconds?: number | null } = { ...vehicle };
      
      if (vehicle.status === 'charging') {
        enhanced.timeRemainingSeconds = this.getTimeRemaining(vehicle);
      } else if (vehicle.status === 'pending') {
        enhanced.waitTimeSeconds = this.getQueueWaitTime(vehicle.id);
      }
      
      return enhanced;
    });
  }
}

// Use a global singleton to persist across hot reloads in Next.js dev mode
const globalStation = globalThis as unknown as { __stationInstance: Station };
if (!globalStation.__stationInstance) {
  globalStation.__stationInstance = new Station();
}
const stationInstance = globalStation.__stationInstance;

export default stationInstance;
