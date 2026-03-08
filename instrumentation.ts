/**
 * Next.js instrumentation - runs once on server startup
 * This initializes persistence for the application
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializePersistence } = await import('./src/server-init');
    await initializePersistence();
  }
}
