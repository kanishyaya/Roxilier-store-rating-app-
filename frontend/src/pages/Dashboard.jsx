import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';

const API = `${API_BASE}/admin`;
const PAGE_SIZE = 20;

const ROLE_STYLES = {
  ADMIN: 'bg-purple-100 text-purple-800',
  OWNER: 'bg-amber-100 text-amber-800',
  USER:  'bg-blue-100 text-blue-800',
};

const SortTh = ({ label, sortKey, current, onToggle }) => (
  <th
    onClick={() => onToggle(sortKey)}
    className="p-3 cursor-pointer select-none hover:bg-gray-100"
  >
    {label}{' '}
    <span className="text-gray-400 text-xs">
      {current.key === sortKey ? (current.order === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  </th>
);

const StatCard = ({ label, value, color = 'text-gray-800' }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        onClick={() => onChange(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50 transition"
      >
        ← Prev
      </button>
      <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
      <button
        onClick={() => onChange(p => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 border border-gray-300 rounded text-xs disabled:opacity-40 hover:bg-gray-50 transition"
      >
        Next →
      </button>
    </div>
  );
};

export default function Dashboard() {
  const user    = JSON.parse(localStorage.getItem('user'))  || { name: 'User', role: 'USER' };
  const token   = localStorage.getItem('token');
  const isAdmin = user.role === 'ADMIN';

  // Data
  const [stats,      setStats]      = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [usersList,  setUsersList]  = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [userPagination,  setUserPagination]  = useState({ total: 0, totalPages: 1 });
  const [storePagination, setStorePagination] = useState({ total: 0, totalPages: 1 });

  // Filters
  const [userNameFilter,     setUserNameFilter]    = useState('');
  const [userEmailFilter,    setUserEmailFilter]   = useState('');
  const [userAddressFilter,  setUserAddressFilter] = useState('');
  const [storeNameFilter,    setStoreNameFilter]   = useState('');
  const [storeEmailFilter,   setStoreEmailFilter]  = useState('');
  const [storeAddressFilter, setStoreAddressFilter]= useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [userSort,     setUserSort]     = useState({ key: 'name', order: 'asc' });
  const [storeSort,    setStoreSort]    = useState({ key: 'name', order: 'asc' });
  const [userPage,     setUserPage]     = useState(1);
  const [storePage,    setStorePage]    = useState(1);

  // Modals
  const [showUserModal,  setShowUserModal]  = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [userDetail,     setUserDetail]     = useState(null);
  const [newUser,  setNewUser]  = useState({ name: '', email: '', address: '', password: '', role: 'USER' });
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', ownerId: '' });
  // Field-level errors for modals
  const [userFormErrors,  setUserFormErrors]  = useState({});
  const [storeFormErrors, setStoreFormErrors] = useState({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const userParams = new URLSearchParams({
        name: userNameFilter, email: userEmailFilter, address: userAddressFilter,
        role: roleFilter, sortBy: userSort.key, order: userSort.order,
        page: userPage, limit: PAGE_SIZE,
      });
      const storeParams = new URLSearchParams({
        name: storeNameFilter, email: storeEmailFilter, address: storeAddressFilter,
        sortBy: storeSort.key, order: storeSort.order,
        page: storePage, limit: PAGE_SIZE,
      });

      const [statsRes, usersRes, storesRes] = await Promise.all([
        fetch(`${API}/dashboard-stats`, { headers }),
        fetch(`${API}/users?${userParams}`,  { headers }),
        fetch(`${API}/stores?${storeParams}`, { headers }),
      ]);
      setStats(await statsRes.json());

      const usersJson  = await usersRes.json();
      const storesJson = await storesRes.json();

      setUsersList(usersJson.data ?? []);
      setStoresList(storesJson.data ?? []);
      setUserPagination(usersJson.pagination  ?? { total: 0, totalPages: 1 });
      setStorePagination(storesJson.pagination ?? { total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  }, [
    userNameFilter, userEmailFilter, userAddressFilter,
    storeNameFilter, storeEmailFilter, storeAddressFilter,
    roleFilter, userSort, storeSort, isAdmin, userPage, storePage,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Reset pages on filter/sort change
  useEffect(() => { setUserPage(1); },  [userNameFilter, userEmailFilter, userAddressFilter, roleFilter, userSort]);
  useEffect(() => { setStorePage(1); }, [storeNameFilter, storeEmailFilter, storeAddressFilter, storeSort]);

  useEffect(() => {
    if (!selectedUser) { setUserDetail(null); return; }
    (async () => {
      try {
        const res  = await fetch(`${API}/users/${selectedUser.id}`, { headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setUserDetail(data);
      } catch (err) {
        console.error('Failed to fetch user detail:', err);
        setUserDetail(null);
      }
    })();
  }, [selectedUser]);

  const closeUserDetail = () => { setSelectedUser(null); setUserDetail(null); };

  const toggleSort = (type, key) => {
    const setter  = type === 'user' ? setUserSort : setStoreSort;
    const current = type === 'user' ? userSort    : storeSort;
    setter({ key, order: current.key === key && current.order === 'asc' ? 'desc' : 'asc' });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormErrors({});
    try {
      const res  = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        // Field-level errors from validation, or a general message
        if (data.errors) {
          setUserFormErrors(data.errors);
        } else {
          setUserFormErrors({ _general: data.message || 'Failed to create user.' });
        }
        return;
      }
      setShowUserModal(false);
      setNewUser({ name: '', email: '', address: '', password: '', role: 'USER' });
      fetchData();
    } catch {
      setUserFormErrors({ _general: 'Connection error. Please try again.' });
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setStoreFormErrors({});
    const localErrors = {};
    if (!newStore.name)    localErrors.name    = 'Store name is required.';
    if (!newStore.email)   localErrors.email   = 'Store email is required.';
    if (!newStore.address) localErrors.address = 'Address is required.';
    if (!newStore.ownerId) localErrors.ownerId = 'Owner ID is required.';
    if (Object.keys(localErrors).length) { setStoreFormErrors(localErrors); return; }

    try {
      const res  = await fetch(`${API}/stores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(newStore),
      });
      const data = await res.json();
      if (!res.ok) {
        setStoreFormErrors({ _general: data.message || 'Failed to create store.' });
        return;
      }
      setShowStoreModal(false);
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      fetchData();
    } catch {
      setStoreFormErrors({ _general: 'Connection error. Please try again.' });
    }
  };

  const openUserModal  = () => { setUserFormErrors({});  setShowUserModal(true); };
  const openStoreModal = () => { setStoreFormErrors({}); setShowStoreModal(true); };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm px-8 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">Welcome, {user.name}</h1>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${ROLE_STYLES[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
            {user.role}
          </span>
        </header>

        <main className="p-8 space-y-8">
          {!isAdmin ? (
            <div className="p-8 bg-white rounded-xl shadow-sm text-center text-gray-400 font-medium">
              Your role dashboard is coming in a future phase.
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Users"   value={stats.totalUsers}   />
                <StatCard label="Total Stores"  value={stats.totalStores}  color="text-emerald-600" />
                <StatCard label="Total Ratings" value={stats.totalRatings} color="text-blue-300" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={openUserModal}  className="bg-blue-300 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                  ➕ Add User
                </button>
                <button onClick={openStoreModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                  ➕ Add Store
                </button>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-800">Users</h2>
                    <span className="text-xs text-gray-400">({userPagination.total} total)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" placeholder="Filter by name…"    value={userNameFilter}    onChange={e => setUserNameFilter(e.target.value)}    className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    <input type="text" placeholder="Filter by email…"   value={userEmailFilter}   onChange={e => setUserEmailFilter(e.target.value)}   className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    <input type="text" placeholder="Filter by address…" value={userAddressFilter} onChange={e => setUserAddressFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="">All Roles</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="USER">USER</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <SortTh label="Name"  sortKey="name"  current={userSort} onToggle={k => toggleSort('user', k)} />
                        <SortTh label="Email" sortKey="email" current={userSort} onToggle={k => toggleSort('user', k)} />
                        <th className="p-3">Address</th>
                        <SortTh label="Role"  sortKey="role"  current={userSort} onToggle={k => toggleSort('user', k)} />
                        <th className="p-3 text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {usersList.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-400">No users found.</td></tr>
                      ) : usersList.map(u => (
                        <tr key={u.id} onClick={() => setSelectedUser(u)} className="hover:bg-gray-50 cursor-pointer">
                          <td className="p-3 font-medium">{u.name}</td>
                          <td className="p-3">{u.email}</td>
                          <td className="p-3 max-w-xs truncate">{u.address}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                          </td>
                          <td className="p-3 text-center font-semibold">
                            {u.rating ? `${u.rating} / 5.0` : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={userPage} totalPages={userPagination.totalPages} onChange={setUserPage} />
              </div>

              {/* Stores Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-800">Stores</h2>
                    <span className="text-xs text-gray-400">({storePagination.total} total)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" placeholder="Filter by name…"    value={storeNameFilter}    onChange={e => setStoreNameFilter(e.target.value)}    className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    <input type="text" placeholder="Filter by email…"   value={storeEmailFilter}   onChange={e => setStoreEmailFilter(e.target.value)}   className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                    <input type="text" placeholder="Filter by address…" value={storeAddressFilter} onChange={e => setStoreAddressFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                        <SortTh label="Name"  sortKey="name"  current={storeSort} onToggle={k => toggleSort('store', k)} />
                        <SortTh label="Email" sortKey="email" current={storeSort} onToggle={k => toggleSort('store', k)} />
                        <th className="p-3">Address</th>
                        <th className="p-3 text-center">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {storesList.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">No stores found.</td></tr>
                      ) : storesList.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium">{s.name}</td>
                          <td className="p-3">{s.email}</td>
                          <td className="p-3 max-w-sm truncate">{s.address}</td>
                          <td className="p-3 text-center font-semibold text-emerald-600">
                            {parseFloat(s.rating) > 0 ? `⭐ ${s.rating}` : <span className="text-gray-400 font-normal">No reviews</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={storePage} totalPages={storePagination.totalPages} onChange={setStorePage} />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add User Modal */}
      {showUserModal && (
        <Modal title="Add New User" onClose={() => setShowUserModal(false)} onSubmit={handleCreateUser} submitLabel="Create User" submitClass="bg-blue-300 hover:bg-blue-400">
          {userFormErrors._general && <ErrorBanner>{userFormErrors._general}</ErrorBanner>}
          <Field label="Full Name (20–60 chars)" error={userFormErrors.name}>
            <input type="text" required className={inputCls(!!userFormErrors.name)} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          </Field>
          <Field label="Email" error={userFormErrors.email}>
            <input type="email" required className={inputCls(!!userFormErrors.email)} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          </Field>
          <Field label="Address" error={userFormErrors.address}>
            <input type="text" required className={inputCls(!!userFormErrors.address)} onChange={e => setNewUser({ ...newUser, address: e.target.value })} />
          </Field>
          <Field label="Password (8–16 chars, 1 uppercase, 1 special)" error={userFormErrors.password}>
            <input type="password" required className={inputCls(!!userFormErrors.password)} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          </Field>
          <Field label="Role">
            <select className={inputCls(false)} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="USER">USER</option>
              <option value="OWNER">OWNER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </Field>
        </Modal>
      )}

      {/* Add Store Modal */}
      {showStoreModal && (
        <Modal title="Add New Store" onClose={() => setShowStoreModal(false)} onSubmit={handleCreateStore} submitLabel="Create Store" submitClass="bg-emerald-600 hover:bg-emerald-700">
          {storeFormErrors._general && <ErrorBanner>{storeFormErrors._general}</ErrorBanner>}
          <Field label="Store Name" error={storeFormErrors.name}>
            <input type="text" required className={inputCls(!!storeFormErrors.name)} onChange={e => setNewStore({ ...newStore, name: e.target.value })} />
          </Field>
          <Field label="Store Email" error={storeFormErrors.email}>
            <input type="email" required className={inputCls(!!storeFormErrors.email)} onChange={e => setNewStore({ ...newStore, email: e.target.value })} />
          </Field>
          <Field label="Address" error={storeFormErrors.address}>
            <input type="text" required className={inputCls(!!storeFormErrors.address)} onChange={e => setNewStore({ ...newStore, address: e.target.value })} />
          </Field>
          <Field label="Owner ID" hint="Copy the ID of a user with the OWNER role from the table above." error={storeFormErrors.ownerId}>
            <input type="text" required placeholder="e.g. f47ac10b-58cc-…" className={inputCls(!!storeFormErrors.ownerId)} onChange={e => setNewStore({ ...newStore, ownerId: e.target.value })} />
          </Field>
        </Modal>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          title="User Details"
          onClose={closeUserDetail}
          onSubmit={e => { e.preventDefault(); closeUserDetail(); }}
          submitLabel="Close"
          submitClass="bg-gray-600 hover:bg-gray-700"
          hideCancel
        >
          {!userDetail ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-3">
              <Field label="Name"><p className="mt-1 text-sm text-gray-800">{userDetail.name}</p></Field>
              <Field label="Email"><p className="mt-1 text-sm text-gray-800">{userDetail.email}</p></Field>
              <Field label="Address"><p className="mt-1 text-sm text-gray-800">{userDetail.address}</p></Field>
              <Field label="Role">
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${ROLE_STYLES[userDetail.role] ?? 'bg-gray-100 text-gray-700'}`}>
                  {userDetail.role}
                </span>
              </Field>
              {userDetail.role === 'OWNER' && (
                <Field label="Store Rating">
                  <p className="mt-1 text-sm font-semibold text-emerald-600">
                    {userDetail.rating ? `⭐ ${userDetail.rating} / 5.0` : <span className="text-gray-400 font-normal">No reviews yet</span>}
                  </p>
                </Field>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  `w-full p-2 border rounded-lg mt-1 text-sm focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-400 bg-red-50'
      : 'border-gray-300 focus:ring-blue-100'
  }`;

function ErrorBanner({ children }) {
  return (
    <div className="text-red-600 text-xs bg-red-50 border border-red-200 p-2 rounded">
      {children}
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint  && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Modal({ title, onClose, onSubmit, submitLabel, submitClass, hideCancel, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        <form onSubmit={onSubmit} className="space-y-3">
          {children}
          <div className="flex justify-end gap-2 pt-2">
            {!hideCancel && (
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
            <button type="submit" className={`px-4 py-2 text-sm text-white rounded-lg font-medium transition ${submitClass}`}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
