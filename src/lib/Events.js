const { EventEmitter } = require('events');

class UpdateEmitter extends EventEmitter {
  emitUpdate() {
    this.emit('update');
  }
}

// Use a global singleton to persist across hot reloads
const globalEmitter = globalThis;
if (!globalEmitter.__updateEmitterInstance) {
  globalEmitter.__updateEmitterInstance = new UpdateEmitter();
}
const updateEmitter = globalEmitter.__updateEmitterInstance;

module.exports = updateEmitter;