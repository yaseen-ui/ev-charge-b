/**
 * Server-side initialization for persistence in Next.js
 * This file runs on the server and sets up persistence listeners
 */

import { loadPersistedData, savePersistedData, attachPersistenceListeners } from './lib/persistence';

let initialized = false;

export async function initializePersistence() {
  if (initialized) return;
  initialized = true;

  try {
    console.log('[Persistence] Initializing persistence layer...');
    await loadPersistedData();
    attachPersistenceListeners();
    console.log('[Persistence] Persistence layer initialized and listening for updates');
  } catch (error) {
    console.error('[Persistence] Failed to initialize persistence:', error);
  }
}

// Handle graceful shutdown (for `next dev` and `next start`)
if (typeof window === 'undefined') {
  // Server-side only
  process.on('SIGINT', async () => {
    console.log('[Persistence] SIGINT received, saving data before exit...');
    await savePersistedData();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('[Persistence] SIGTERM received, saving data before exit...');
    await savePersistedData();
    process.exit(0);
  });
}
