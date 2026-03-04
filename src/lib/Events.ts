import { EventEmitter } from 'events';

class UpdateEmitter extends EventEmitter {
  emitUpdate() {
    this.emit('update');
  }
}

// Use a global singleton to persist across hot reloads in Next.js dev mode
const globalEmitter = globalThis as unknown as { __updateEmitterInstance: UpdateEmitter };
if (!globalEmitter.__updateEmitterInstance) {
  globalEmitter.__updateEmitterInstance = new UpdateEmitter();
}
const updateEmitter = globalEmitter.__updateEmitterInstance;

export default updateEmitter;
