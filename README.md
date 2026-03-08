# EV Charging Station Load Balancer (Next.js)

A full-stack Next.js application for simulating an EV charging station with limited power and plugs. The system manages vehicle connections, prioritizes charging based on vehicle priority, and simulates the charging process with a background scheduler.

## Features

- **Multi-Store Support**: Manage multiple charging station locations, each with independent state
- Station configuration with total power and plug limits
- Vehicle connection with priority-based queuing (emergency > vip > normal)
- Automatic plug assignment based on availability
- Background charging scheduler with real-time power distribution
- Power rebalancing when vehicles complete charging
- Tailwind-powered UI dashboard for live monitoring

## Data Persistence

All application data is stored in a single JSON file located at `data/station-data.json`. This file is automatically created when the application first runs and is updated whenever state changes occur.

### Persistence File Structure

```json
{
  "totalPowerKw": 50,
  "plugCount": 4,
  "plugMaxPowerKw": 22,
  "isInitialized": true,
  "activePlugs": [
    { "vehicleId": "V1", "allocatedKw": 15.5 }
  ],
  "queue": [
    { "vehicleId": "V3", "requestedKwh": 30, "priority": "normal", "timestamp": 1709123456789 }
  ],
  "vehicles": {
    "V1": {
      "id": "V1",
      "requestedKwh": 40,
      "priority": "vip",
      "status": "charging",
      "allocatedKw": 15.5,
      "chargedKwh": 12.3,
      "connectedAt": "2024-02-28T10:30:00.000Z"
    }
  },
  "stores": [
    {
      "id": "store_1709123456789_abc123",
      "name": "Downtown Charging Hub",
      "address": "123 Main St, City, State",
      "description": "Primary downtown location",
      "createdAt": "2024-02-28T10:00:00.000Z",
      "updatedAt": "2024-02-28T10:00:00.000Z"
    }
  ]
}
```

### Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalPowerKw` | number | Maximum power available for distribution (kW) |
| `plugCount` | number | Number of physical charging plugs |
| `plugMaxPowerKw` | number | Maximum power per plug (kW) |
| `isInitialized` | boolean | Whether station has been configured |
| `activePlugs` | array | Currently occupied plugs with allocated power |
| `queue` | array | Waiting vehicles sorted by priority |
| `vehicles` | object | All connected vehicles indexed by ID |
| `stores` | array | List of charging station locations |

### How Persistence Works

1. **On Server Start**: The `instrumentation.ts` hook loads persisted data from the JSON file into memory
2. **On State Change**: Any modification (vehicle connect, plug assignment, store creation, etc.) triggers an automatic save via the event emitter
3. **On Server Shutdown**: SIGINT/SIGTERM handlers ensure final state is saved before exit
4. **Data Directory**: The `data/` directory is automatically created if it doesn't exist

### Store Model

Each store represents a charging station location with:

- `id`: Unique identifier (format: `store_{timestamp}_{random}`)
- `name`: Display name
- `address`: Physical location
- `description`: Optional details
- `createdAt`/`updatedAt`: ISO timestamp strings

> **Note**: Currently, station runtime state (vehicles, queue, plugs) is shared globally. In a future update, each store will maintain its own independent station state.

## Project Structure

```
├── app/
│   ├── api/               # Next.js API routes
│   │   ├── stores/        # Store CRUD endpoints
│   │   ├── station/       # Station configuration
│   │   ├── vehicles/      # Vehicle management
│   │   ├── engine/        # Charging scheduler controls
│   │   └── updates/       # SSE for real-time updates
│   ├── stores/            # Store management UI
│   │   └── [id]/          # Individual store dashboard
│   ├── globals.css        # Tailwind base styles
│   ├── layout.js          # App layout
│   └── page.js            # Legacy dashboard UI
├── src/
│   ├── lib/               # Shared logic
│   │   ├── Station.ts     # Station state management
│   │   ├── Engine.ts      # Charging scheduler
│   │   ├── LoadBalancer.ts# Power distribution logic
│   │   ├── Events.ts      # Event emitter for updates
│   │   ├── storage.ts     # File I/O operations
│   │   └── persistence.ts # Load/save orchestration
│   └── models/
│       ├── Station.ts     # Station types and singleton
│       └── Store.ts       # Store model and manager
├── data/
│   └── station-data.json  # Persistent storage file
├── instrumentation.ts     # Server startup hook
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Installation

```bash
npm install
```

## Running the App

```bash
npm run dev
```

The app runs on port 3000.

## UI Pages

- `/` - Legacy dashboard (station config, engine controls, vehicle list)
- `/stores` - Store management page (list, create, delete stores)
- `/stores/[id]` - Individual store dashboard with full station controls

## API Endpoints

### Stores

#### GET /api/stores
Get all stores.

#### POST /api/stores
Create a new store.

**Request Body:**
```json
{
  "name": "Downtown Hub",
  "address": "123 Main St",
  "description": "Primary location"
}
```

#### GET /api/stores/[id]
Get a specific store.

#### PUT /api/stores/[id]
Update a store.

#### DELETE /api/stores/[id]
Delete a store.

### Station

#### POST /api/station/init
Initialize the charging station with configuration.

**Request Body:**
```json
{
  "totalPowerKw": 50,
  "plugCount": 2,
  "plugMaxPowerKw": 22
}
```

#### GET /api/station/status
Get current station status including active plugs and queue.

### Vehicles

#### POST /api/vehicles/connect
Connect a vehicle to the station.

**Request Body:**
```json
{
  "id": "V1",
  "requestedKwh": 40,
  "priority": "normal"
}
```

Priority options: `emergency`, `vip`, `normal`

#### GET /api/vehicles
Get all connected vehicles.

### Engine

#### POST /api/engine/start
Start the charging scheduler (runs every 1 second).

#### POST /api/engine/stop
Stop the charging scheduler.

#### GET /api/engine/status
Get engine status.

### Real-time Updates

#### GET /api/updates
Server-Sent Events endpoint for real-time state updates. Returns JSON messages with `station`, `vehicles`, and `engine` state.

## Manual Testing (curl)

```bash
# Create a store
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Store", "address": "456 Test Ave"}'

# List stores
curl http://localhost:3000/api/stores

# Initialize station
curl -X POST http://localhost:3000/api/station/init \
  -H "Content-Type: application/json" \
  -d '{"totalPowerKw": 50, "plugCount": 2, "plugMaxPowerKw": 22}'

# Start engine
curl -X POST http://localhost:3000/api/engine/start

# Connect vehicles
curl -X POST http://localhost:3000/api/vehicles/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "V1", "requestedKwh": 5, "priority": "normal"}'

curl -X POST http://localhost:3000/api/vehicles/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "V2", "requestedKwh": 10, "priority": "vip"}'

# Check station status
curl http://localhost:3000/api/station/status

# Stop engine
curl -X POST http://localhost:3000/api/engine/stop
```

## Charging Logic

1. **Priority Order**: emergency > vip > normal
2. **Power Distribution**: Total power distributed among active vehicles based on priority
3. **Per-Tick Charging**: `chargedKwh += allocatedKw / 3600` (every 1 second)
4. **Completion**: When `chargedKwh >= requestedKwh`, vehicle is marked complete and plug freed
5. **Rebalancing**: Power redistributed when vehicles start/complete charging