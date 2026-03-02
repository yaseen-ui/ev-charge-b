# EV Charging Station Load Balancer (Next.js)

A full-stack Next.js application for simulating an EV charging station with limited power and plugs. The system manages vehicle connections, prioritizes charging based on vehicle priority, and simulates the charging process with a background scheduler.

## Features

- Station configuration with total power and plug limits
- Vehicle connection with priority-based queuing (emergency > vip > normal)
- Automatic plug assignment based on availability
- Background charging scheduler with real-time power distribution
- Power rebalancing when vehicles complete charging
- Tailwind-powered UI dashboard for live monitoring

## Project Structure

```
├── app/
│   ├── api/               # Next.js API routes
│   ├── globals.css        # Tailwind base styles
│   ├── layout.js          # App layout
│   └── page.js            # Dashboard UI
├── src/
│   └── lib/               # Shared station logic (in-memory)
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

- `/` - Main dashboard (station config, engine controls, vehicle list)

## API Endpoints

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

## Manual Testing (curl)

```bash
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