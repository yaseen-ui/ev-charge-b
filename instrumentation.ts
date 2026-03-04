/**
 * Next.js instrumentation - runs once on server startup
 * This initializes persistence for the application
 */

import { initializePersistence } from './src/server-init';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await initializePersistence();
  }
}
