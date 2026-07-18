import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import Dashboard      from './pages/Dashboard';
import Stores         from './pages/Stores';
import OwnerDashboard from './pages/OwnerDashboard';
import ChangePassword from './pages/ChangePassword';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Normal user */}
        <Route path="/stores" element={
          <ProtectedRoute allowedRoles={['USER']}>
            <Stores />
          </ProtectedRoute>
        } />

        {/* Store owner */}
        <Route path="/owner" element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />

        {/* Shared — any authenticated role */}
        <Route path="/change-password" element={
          <ProtectedRoute allowedRoles={['USER', 'OWNER', 'ADMIN']}>
            <ChangePassword />
          </ProtectedRoute>
        } />

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </Router>
  );
}

function RoleRedirect() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN')  return <Navigate to="/dashboard" replace />;
  if (user.role === 'OWNER')  return <Navigate to="/owner"     replace />;
  return <Navigate to="/stores" replace />;
}
