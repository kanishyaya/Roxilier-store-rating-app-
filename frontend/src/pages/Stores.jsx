import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import StarRating from '../components/StarRating';
import { API_BASE } from '../config';

const API = `${API_BASE}/user`;
const PAGE_SIZE = 12;

const SortBtn = ({ label, sortKey, current, onToggle }) => (
  <button
    type="button"
    onClick={() => onToggle(sortKey)}
    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-100 select-none focus:outline-none focus:ring-2 focus:ring-blue-100"
  >
    {label}{' '}
    <span className="text-gray-400 text-xs">
      {current.key === sortKey ? (current.order === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  </button>
);

export default function Stores() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const [stores,  setStores]  = useState([]);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState({ key: 'name', order: 'asc' });
  const [page,    setPage]    = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [fetchError, setFetchError] = useState('');

  // storeId -> { score, submitting, error, mode }
  const [ratingState, setRatingState] = useState({});

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res  = await fetch(
        `${API}/stores?search=${encodeURIComponent(search)}&sortBy=${sort.key}&order=${sort.order}&page=${page}&limit=${PAGE_SIZE}`,
        { headers }
      );
      if (!res.ok) throw new Error('Failed to load stores.');
      const json = await res.json();
      const data = json.data ?? [];
      setStores(data);
      setPagination(json.pagination ?? { total: data.length, totalPages: 1 });
      // Pre-fill any existing ratings the user has already submitted
      const initial = {};
      data.forEach(s => {
        if (s.userRating) {
          initial[s.id] = { score: s.userRating, submitting: false, error: '', mode: 'update' };
        } else {
          initial[s.id] = { score: 0, submitting: false, error: '', mode: 'submit' };
        }
      });
      setRatingState(initial);
    } catch (err) {
      setFetchError(err.message || 'Could not load stores. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, sort, page]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  // Reset to page 1 when search/sort changes
  useEffect(() => { setPage(1); }, [search, sort]);

  const toggleSort = (key) => {
    setSort(prev => ({ key, order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc' }));
  };

  const setScore = (storeId, score) => {
    setRatingState(prev => ({ ...prev, [storeId]: { ...prev[storeId], score, error: '' } }));
  };

  const submitRating = async (storeId) => {
    const { score, mode } = ratingState[storeId] ?? {};
    if (!score) {
      return setRatingState(prev => ({ ...prev, [storeId]: { ...prev[storeId], error: 'Please select a star rating before submitting.' } }));
    }

    setRatingState(prev => ({ ...prev, [storeId]: { ...prev[storeId], submitting: true, error: '' } }));

    try {
      const url    = mode === 'update' ? `${API}/ratings/${storeId}` : `${API}/ratings`;
      const method = mode === 'update' ? 'PUT' : 'POST';
      const body   = mode === 'update' ? { score } : { storeId, score };

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Rating could not be saved.');

      // Refresh store list so avg updates
      await fetchStores();
    } catch (err) {
      setRatingState(prev => ({
        ...prev,
        [storeId]: { ...prev[storeId], submitting: false, error: err.message || 'Something went wrong. Please try again.' },
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white shadow-sm px-8 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">Browse Stores</h1>
          {pagination.total > 0 && (
            <span className="text-xs text-gray-400">{pagination.total} store{pagination.total !== 1 ? 's' : ''}</span>
          )}
        </header>

        <main className="p-8 space-y-6">
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by name or address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Sort by</span>
              <SortBtn label="Name"    sortKey="name"        current={sort} onToggle={toggleSort} />
              <SortBtn label="Rating"  sortKey="avgRating"    current={sort} onToggle={toggleSort} />
              <SortBtn label="Reviews" sortKey="totalRatings" current={sort} onToggle={toggleSort} />
            </div>
          </div>

          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-4">{fetchError}</div>
          )}

          {loading ? (
            <p className="text-gray-400 text-sm">Loading stores…</p>
          ) : stores.length === 0 ? (
            <p className="text-gray-400 text-sm">No stores found.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stores.map(store => {
                  const rs = ratingState[store.id] ?? { score: 0, submitting: false, error: '', mode: 'submit' };
                  return (
                    <div key={store.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                      {/* Store info */}
                      <div>
                        <h2 className="font-bold text-gray-800 text-base">{store.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{store.address}</p>
                        <p className="text-xs text-gray-400">{store.email}</p>
                      </div>

                      {/* Average rating */}
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(parseFloat(store.avgRating))} readonly size="sm" />
                        <span className="text-sm font-semibold text-gray-700">{parseFloat(store.avgRating) > 0 ? store.avgRating : '—'}</span>
                        <span className="text-xs text-gray-400">({store.totalRatings} {store.totalRatings === 1 ? 'review' : 'reviews'})</span>
                      </div>

                      {/* User rating */}
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          {rs.mode === 'update' ? 'Update your rating:' : 'Rate this store:'}
                        </p>
                        <StarRating value={rs.score} onChange={score => setScore(store.id, score)} size="md" />
                        {rs.error && (
                          <p className="text-red-500 text-xs bg-red-50 border border-red-200 px-2 py-1 rounded">{rs.error}</p>
                        )}
                        <button
                          onClick={() => submitRating(store.id)}
                          disabled={rs.submitting}
                          className="mt-1 px-4 py-1.5 bg-blue-300 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition"
                        >
                          {rs.submitting ? 'Saving…' : rs.mode === 'update' ? 'Update Rating' : 'Submit Rating'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-gray-500">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
