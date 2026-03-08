'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const PRIORITY_OPTIONS = [
  { value: 'emergency', label: 'Emergency' },
  { value: 'vip', label: 'VIP' },
  { value: 'normal', label: 'Normal' }
];

const initialConfig = {
  totalPowerKw: 30,
  plugCount: 2,
  plugMaxPowerKw: 22
};

// Format seconds to human readable time
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--';
  if (seconds <= 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default function StorePage() {
  const params = useParams();
  const storeId = params.id;
  
  const [store, setStore] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError, setStoreError] = useState('');

  // Station state
  const [stationConfig, setStationConfig] = useState(initialConfig);
  const [stationStatus, setStationStatus] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [engineStatus, setEngineStatus] = useState({ running: false });
  const [vehicleForm, setVehicleForm] = useState({
    id: '',
    requestedKwh: 0.1,
    priority: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const statusColor = useMemo(() => {
    if (!engineStatus?.running) return 'bg-slate-700 text-slate-200';
    return 'bg-emerald-500/20 text-emerald-200';
  }, [engineStatus]);

  // Fetch store details
  useEffect(() => {
    if (storeId) {
      fetchStore();
    }
  }, [storeId]);

  // Set up SSE for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/updates');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStationStatus(data.station);
        setVehicles(data.vehicles);
        setEngineStatus(data.engine);
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, []);

  const fetchStore = async () => {
    setStoreLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch store');
      }
      
      setStore(data.store);
    } catch (err) {
      setStoreError(err.message);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleInitStation = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/station/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize station');
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineAction = async (action) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/engine/${action}`, { method: 'POST' });
      const data = await res.json();
      setMessage(data.message || 'Engine updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectVehicle = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/vehicles/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vehicleForm.id,
          requestedKwh: Number(vehicleForm.requestedKwh),
          priority: vehicleForm.priority
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect vehicle');
      setMessage(data.message);
      setVehicleForm({ id: '', requestedKwh: 0.1, priority: 'normal' });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get queue vehicles for the sidebar
  const queueVehicles = vehicles.filter(v => v.status === 'pending');

  if (storeLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading store...</div>
          </div>
        </div>
      </main>
    );
  }

  if (storeError || !store) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-rose-800 bg-rose-900/20 p-8 text-center">
            <h2 className="text-xl font-semibold text-rose-200">Error</h2>
            <p className="mt-2 text-rose-300">{storeError || 'Store not found'}</p>
            <Link 
              href="/stores" 
              className="mt-4 inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              ← Back to Stores
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/stores" 
            className="text-sm text-slate-400 hover:text-emerald-400 transition"
          >
            ← Back to Stores
          </Link>
        </div>

        {/* Store Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{store.name}</p>
            <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {isConnected ? 'Live Updates Active' : 'Disconnected'}
            </div>
          </div>
          <h1 className="text-4xl font-semibold">Load Balancer Control Center</h1>
          <p className="max-w-2xl text-slate-300">
            {store.address}{store.description && ` • ${store.description}`}
          </p>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Station Configuration</h2>
            <p className="text-sm text-slate-400">Set total power and plug limits.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm">
                <span>Total Power (kW)</span>
                <input
                  type="number"
                  min="1"
                  value={stationConfig.totalPowerKw}
                  onChange={(event) =>
                    setStationConfig({
                      ...stationConfig,
                      totalPowerKw: Number(event.target.value)
                    })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Plug Count</span>
                <input
                  type="number"
                  min="1"
                  value={stationConfig.plugCount}
                  onChange={(event) =>
                    setStationConfig({
                      ...stationConfig,
                      plugCount: Number(event.target.value)
                    })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Max Power per Plug (kW)</span>
                <input
                  type="number"
                  min="1"
                  value={stationConfig.plugMaxPowerKw}
                  onChange={(event) =>
                    setStationConfig({
                      ...stationConfig,
                      plugMaxPowerKw: Number(event.target.value)
                    })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleInitStation}
                disabled={loading}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
              >
                Initialize Station
              </button>
              {stationStatus && (
                <span className="text-xs text-slate-400">
                  Available plugs: {stationStatus.availablePlugs}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Engine Controls</h2>
            <p className="text-sm text-slate-400">Start or stop the charging scheduler.</p>

            <div className="mt-5 flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                {engineStatus?.running ? 'Running' : 'Stopped'}
              </span>
              <button
                onClick={() => handleEngineAction('start')}
                disabled={loading}
                className="rounded-lg border border-emerald-400/60 px-4 py-2 text-sm text-emerald-200 transition hover:bg-emerald-500/10 disabled:opacity-60"
              >
                Start
              </button>
              <button
                onClick={() => handleEngineAction('stop')}
                disabled={loading}
                className="rounded-lg border border-rose-400/60 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
              >
                Stop
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Real-time Updates</p>
              <p className="mt-2 text-sm text-slate-300">
                Connected via Server-Sent Events. Updates are pushed instantly when the engine ticks or state changes.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Connect a Vehicle</h2>
            <p className="text-sm text-slate-400">Assign an ID, requested energy, and priority.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm">
                <span>Vehicle ID</span>
                <input
                  type="text"
                  value={vehicleForm.id}
                  onChange={(event) => setVehicleForm({ ...vehicleForm, id: event.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Requested kWh</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={vehicleForm.requestedKwh}
                  onChange={(event) =>
                    setVehicleForm({
                      ...vehicleForm,
                      requestedKwh: event.target.value
                    })
                  }
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>Priority</span>
                <select
                  value={vehicleForm.priority}
                  onChange={(event) => setVehicleForm({ ...vehicleForm, priority: event.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                >
                  {PRIORITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6">
              <button
                onClick={handleConnectVehicle}
                disabled={loading || !vehicleForm.id}
                className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
              >
                Connect Vehicle
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Live Station Status</h2>
            <p className="text-sm text-slate-400">Queue, plugs, and power distribution snapshot.</p>

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>Total Power</span>
                <span>{stationStatus?.totalPowerKw ?? '--'} kW</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Plug Count</span>
                <span>{stationStatus?.plugCount ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Available Plugs</span>
                <span>{stationStatus?.availablePlugs ?? '--'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Queue Length</span>
                <span>{stationStatus?.queueLength ?? '--'}</span>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Queue with Wait Times</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {queueVehicles.length ? (
                  queueVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vehicle.id}</span>
                        <span className="text-xs uppercase text-slate-500">({vehicle.priority})</span>
                      </div>
                      <span className="text-amber-400 text-xs">
                        ~{formatTime(vehicle.waitTimeSeconds)} wait
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">No vehicles waiting.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Vehicles</h2>
              <p className="text-sm text-slate-400">Charging progress, time remaining, and queue wait times.</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Allocated kW</th>
                  <th className="px-4 py-3">Charged kWh</th>
                  <th className="px-4 py-3">Requested kWh</th>
                  <th className="px-4 py-3">Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length ? (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-t border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-200">{vehicle.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize
                          ${vehicle.priority === 'emergency' ? 'bg-red-500/20 text-red-300' : ''}
                          ${vehicle.priority === 'vip' ? 'bg-amber-500/20 text-amber-300' : ''}
                          ${vehicle.priority === 'normal' ? 'bg-slate-600/50 text-slate-300' : ''}
                        `}>
                          {vehicle.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize
                          ${vehicle.status === 'charging' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                          ${vehicle.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : ''}
                          ${vehicle.status === 'completed' ? 'bg-slate-600/50 text-slate-400' : ''}
                        `}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{vehicle.allocatedKw?.toFixed(2) ?? '0.00'}</td>
                      <td className="px-4 py-3 text-slate-300">{vehicle.chargedKwh?.toFixed(4) ?? '0.0000'}</td>
                      <td className="px-4 py-3 text-slate-300">{vehicle.requestedKwh}</td>
                      <td className="px-4 py-3">
                        {vehicle.status === 'charging' && (
                          <span className="text-emerald-400">
                            {formatTime(vehicle.timeRemainingSeconds)}
                          </span>
                        )}
                        {vehicle.status === 'pending' && (
                          <span className="text-amber-400">
                            ~{formatTime(vehicle.waitTimeSeconds)} until plug
                          </span>
                        )}
                        {vehicle.status === 'completed' && (
                          <span className="text-slate-500">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-slate-800">
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                      No vehicles connected yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {message && (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}