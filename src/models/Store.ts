import updateEmitter from '../lib/Events';

/**
 * Store model representing a charging station location
 */

export interface Store {
  id: string;
  name: string;
  address: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreInput {
  name: string;
  address: string;
  description: string;
}

class StoreManager {
  private stores: Map<string, Store> = new Map();

  /**
   * Generate a unique ID for a store
   */
  private generateId(): string {
    return `store_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Create a new store
   */
  create(input: StoreInput): Store {
    const now = new Date().toISOString();
    const store: Store = {
      id: this.generateId(),
      name: input.name,
      address: input.address,
      description: input.description,
      createdAt: now,
      updatedAt: now
    };
    this.stores.set(store.id, store);
    updateEmitter.emitUpdate();
    return store;
  }

  /**
   * Get all stores
   */
  getAll(): Store[] {
    return Array.from(this.stores.values());
  }

  /**
   * Get a store by ID
   */
  getById(id: string): Store | undefined {
    return this.stores.get(id);
  }

  /**
   * Update a store
   */
  update(id: string, input: Partial<StoreInput>): Store | null {
    const store = this.stores.get(id);
    if (!store) {
      return null;
    }

    const updatedStore: Store = {
      ...store,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.description !== undefined && { description: input.description }),
      updatedAt: new Date().toISOString()
    };

    this.stores.set(id, updatedStore);
    updateEmitter.emitUpdate();
    return updatedStore;
  }

  /**
   * Delete a store
   */
  delete(id: string): boolean {
    const deleted = this.stores.delete(id);
    if (deleted) {
      updateEmitter.emitUpdate();
    }
    return deleted;
  }

  /**
   * Get store count
   */
  getCount(): number {
    return this.stores.size;
  }

  /**
   * Clear all stores
   */
  clear(): void {
    this.stores.clear();
  }

  /**
   * Restore stores from persisted data
   */
  restore(stores: Store[]): void {
    this.stores.clear();
    for (const store of stores) {
      this.stores.set(store.id, store);
    }
  }

  /**
   * Get all stores as array for persistence
   */
  toArray(): Store[] {
    return this.getAll();
  }
}

// Use a global singleton to persist across hot reloads in Next.js dev mode
const globalStore = globalThis as unknown as { __storeManagerInstance: StoreManager };
if (!globalStore.__storeManagerInstance) {
  globalStore.__storeManagerInstance = new StoreManager();
}
const storeManagerInstance = globalStore.__storeManagerInstance;

export default storeManagerInstance;
