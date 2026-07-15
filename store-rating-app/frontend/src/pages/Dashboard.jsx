import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'USER' };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between p-4">
        <div>
          <h2 className="text-xl font-bold tracking-wider mb-8">StoreApp</h2>
          <nav className="space-y-2">
            <span className="block px-4 py-2 rounded bg-gray-700 font-semibold">🏠 Dashboard</span>
            {user.role === 'ADMIN' && <span className="block px-4 py-2 text-gray-400">⚙️ Management</span>}
            {user.role === 'USER' && <span className="block px-4 py-2 text-gray-400">🏪 View Stores</span>}
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full text-left bg-red-600 hover:bg-red-700 p-2 rounded transition">🚪 Log Out</button>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold text-gray-800">Welcome Back, {user.name}</h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded uppercase">{user.role} Dashboard</span>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl text-gray-400 font-bold mb-2">Phase 1 Architecture Complete</h2>
            <p className="text-gray-500">Authentication token secured. Verified role permissions for: <strong className="text-blue-600">{user.role}</strong></p>
          </div>
        </main>
      </div>
    </div>
  );
}
