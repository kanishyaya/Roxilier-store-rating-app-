import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';

export default function ChangePassword() {
  const user  = JSON.parse(localStorage.getItem('user')) || {};
  const token = localStorage.getItem('token');

  const API_MAP = {
    ADMIN: `${API_BASE}/user/change-password`,
    USER:  `${API_BASE}/user/change-password`,
    OWNER: `${API_BASE}/owner/change-password`,
  };
  const endpoint = API_MAP[user.role] ?? API_MAP.USER;

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match.');
    }

    setLoading(true);
    try {
      const res  = await fetch(endpoint, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white shadow-sm px-8 flex items-center shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">Change Password</h1>
        </header>

        <main className="p-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md space-y-5">
            <p className="text-sm text-gray-500">
              Password must be 8–16 characters and include at least 1 uppercase letter and 1 special character.
            </p>

            {error   && <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}
            {success && <p className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={form.currentPassword}
                  onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={form.newPassword}
                  onChange={e => setForm({ ...form, newPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-300 hover:bg-blue-400 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition"
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
