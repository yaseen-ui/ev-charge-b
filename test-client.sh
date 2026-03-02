#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"

echo "=========================================="
echo "EV Charging Station Load Balancer Test"
echo "=========================================="
echo ""

echo "1. Initializing Station (Total: 30kW, Plugs: 2, Max: 22kW each)"
echo "   This will show priority-based power distribution"
curl -s -X POST $BASE_URL/station/init \
  -H "Content-Type: application/json" \
  -d '{"totalPowerKw": 30, "plugCount": 2, "plugMaxPowerKw": 22}'
echo -e "\n"

echo "2. Starting Engine"
curl -s -X POST $BASE_URL/engine/start
echo -e "\n"

echo "3. Connecting Vehicle 1 (Normal, 0.1kWh - small for quick test)"
curl -s -X POST $BASE_URL/vehicles/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "V1", "requestedKwh": 0.1, "priority": "normal"}'
echo -e "\n"

echo "4. Connecting Vehicle 2 (VIP, 0.2kWh) - should get MORE power"
curl -s -X POST $BASE_URL/vehicles/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "V2", "requestedKwh": 0.2, "priority": "vip"}'
echo -e "\n"

echo "5. Connecting Vehicle 3 (Emergency, 0.05kWh) - should go to queue"
curl -s -X POST $BASE_URL/vehicles/connect \
  -H "Content-Type: application/json" \
  -d '{"id": "V3", "requestedKwh": 0.05, "priority": "emergency"}'
echo -e "\n"

echo "6. Initial Station Status"
echo "   V2 (VIP) should get 22kW, V1 (Normal) should get 8kW (remaining)"
curl -s $BASE_URL/station/status
echo -e "\n"

echo "7. Watching charging progress (10 seconds)..."
echo "   VIP will complete first due to higher power allocation"
for i in {1..10}; do
  echo "--- Tick $i ---"
  curl -s $BASE_URL/vehicles
  echo ""
  sleep 1
done
echo ""

echo "8. Final Station Status (V3 should now be charging after V1/V2 complete)"
curl -s $BASE_URL/station/status
echo -e "\n"

echo "9. All Vehicles (check completion status)"
curl -s $BASE_URL/vehicles
echo -e "\n"

echo "10. Stopping Engine"
curl -s -X POST $BASE_URL/engine/stop
echo -e "\n"

echo "Test complete!"
