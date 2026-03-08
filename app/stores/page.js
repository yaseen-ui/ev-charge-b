'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: ''
  });

  // Fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      if (res.ok) {
        setStores(data.stores || []);
      } else {
        setMessage(data.error || 'Failed to fetch stores');
      }
    } catch (error) {
      setMessage('Error fetching stores: ' + error.message);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create store');
      }

      setMessage('Store created successfully!');
      setFormData({ name: '', address: '', description: '' });
      setShowForm(false);
      fetchStores();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (id) => {
    if (!confirm('Are you sure you want to delete this store?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete store');
      }

      setMessage('Store deleted successfully!');
      fetchStores();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">EV Charging Network</p>
          <h1 className="text-4xl font-semibold">Stores</h1>
          <p className="max-w-2xl text-slate-300">
            Manage your charging station locations. Click on a store to view and manage its charging stations.
          </p>
        </header>

        {/* Create Store Button */}
        <div className="mt-8">
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {showForm ? 'Cancel' : 'Create New Store'}
          </button>
        </div>

        {/* Create Store Form */}
        {showForm && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Create New Store</h2>
            <p className="text-sm text-slate-400">Enter the store details below.</p>

            <form onSubmit={handleCreateStore} className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span>Store Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Downtown Charging Hub"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Address *</span>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., 123 Main St, City, State"
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm">
                <span>Description</span>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the store..."
                  rows={3}
                  className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2"
                />
              </label>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-60"
                >
                  {loading ? 'Creating...' : 'Create Store'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-6 rounded-xl border p-4 text-sm ${
            message.includes('successfully') 
              ? 'border-emerald-800 bg-emerald-900/20 text-emerald-200' 
              : 'border-rose-800 bg-rose-900/20 text-rose-200'
          }`}>
            {message}
          </div>
        )}

        {/* Stores Grid */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Available Stores</h2>
          
          {stores.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
              <p className="text-slate-400">No stores yet. Create your first store to get started.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition hover:border-slate-600 hover:bg-slate-800/60"
                >
                  <Link href={`/stores/${store.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-emerald-400 transition">
                          {store.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">{store.address}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
                        Store
                      </span>
                    </div>
                    
                    {store.description && (
                      <p className="mt-3 text-sm text-slate-300 line-clamp-2">
                        {store.description}
                      </p>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Created: {new Date(store.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-emerald-400 group-hover:underline">
                        Enter Store →
                      </span>
                    </div>
                  </Link>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteStore(store.id);
                    }}
                    disabled={loading}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition rounded-lg border border-rose-400/60 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}