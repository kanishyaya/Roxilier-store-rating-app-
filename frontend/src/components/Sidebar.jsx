import { NavLink, useNavigate } from 'react-router-dom';

const NAV = {
  ADMIN: [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/change-password', label: '🔑 Change Password' },
  ],
  USER: [
    { to: '/stores', label: '🏪 Browse Stores' },
    { to: '/change-password', label: '🔑 Change Password' },
  ],
  OWNER: [
    { to: '/owner', label: '🏬 My Store' },
    { to: '/change-password', label: '🔑 Change Password' },
  ],
};

export default function Sidebar() {
  const navigate  = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const links = NAV[user.role] ?? [];

  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between p-4 shrink-0">
      <div>
        <h2 className="text-xl font-bold tracking-wide mb-8 text-blue-100">Store Platform</h2>
        <nav className="space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded text-sm font-medium transition ${
                  isActive ? 'bg-blue-400 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-slate-400 px-1 truncate">{user.name}</p>
        <button
          onClick={logout}
          className="w-full bg-rose-600 hover:bg-rose-700 p-2 rounded text-white text-sm font-medium transition"
        >
          🚪 Log Out
        </button>
      </div>
    </aside>
  );
}
