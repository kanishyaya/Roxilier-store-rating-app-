import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StarRating from '../components/StarRating';
import { API_BASE } from '../config';

const API = `${API_BASE}/owner`;

export default function OwnerDashboard() {
  const token = localStorage.getItem('token');
  const [store,   setStore]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API}/store`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStore(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white shadow-sm px-8 flex items-center shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">My Store Dashboard</h1>
        </header>

        <main className="p-8 space-y-6">
          {loading && <p className="text-gray-400 text-sm">Loading…</p>}
          {error   && <p className="text-red-500 text-sm">{error}</p>}

          {store && (
            <>
              {/* Store summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Store Name</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{store.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{store.address}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Average Rating</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={Math.round(parseFloat(store.avgRating))} readonly size="lg" />
                    <span className="text-2xl font-bold text-amber-500">
                      {parseFloat(store.avgRating) > 0 ? store.avgRating : '—'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Reviews</p>
                  <p className="text-3xl font-bold text-blue-300 mt-2">{store.totalRatings}</p>
                </div>
              </div>

              {/* Ratings table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-800 mb-4">Customer Reviews</h2>
                {store.ratings.length === 0 ? (
                  <p className="text-gray-400 text-sm">No reviews yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-xs font-semibold uppercase">
                          <th className="p-3">Customer</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Rating</th>
                          <th className="p-3">Last Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {store.ratings.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="p-3 font-medium">{r.user.name}</td>
                            <td className="p-3 text-gray-500">{r.user.email}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <StarRating value={r.score} readonly size="sm" />
                                <span className="font-semibold text-gray-700">{r.score}</span>
                              </div>
                            </td>
                            <td className="p-3 text-gray-400 text-xs">
                              {new Date(r.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
