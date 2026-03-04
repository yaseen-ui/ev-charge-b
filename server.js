const app = require('./src/app');
const { loadPersistedData, savePersistedData, attachPersistenceListeners } = require('./src/lib/persistence');
const PORT = 3000;

// Load persisted data on server startup
loadPersistedData().then(() => {
  // Start persistence listener for state changes
  attachPersistenceListeners();
}).catch(err => {
  console.error('Failed to load persisted data:', err);
  attachPersistenceListeners();
});

const server = app.listen(PORT, () => {
  console.log(`EV Charging Station Load Balancer running on port ${PORT}`);
});

async function handleShutdown(signal) {
  console.log(`Received ${signal}. Persisting data before shutdown...`);
  await savePersistedData();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('exit', () => {
  console.log('Process exiting. Persisting data...');
  savePersistedData();
});
