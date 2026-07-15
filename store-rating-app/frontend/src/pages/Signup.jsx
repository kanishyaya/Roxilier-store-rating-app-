import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const API = import.meta.env.VITE_API_URL || 'http://localhost:6001';
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || { general: data.message });
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setErrors({ general: 'Connection failed' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Normal User Signup</h2>
        {errors.general && <p className="text-red-500 text-sm mb-4 text-center">{errors.general}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name (20-60 characters)</label>
            <input type="text" required className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={formData.name}
              onChange={e => { setFormData({...formData, name: e.target.value}); setErrors(prev => ({...prev, name: undefined})); }} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={formData.email}
              onChange={e => { setFormData({...formData, email: e.target.value}); setErrors(prev => ({...prev, email: undefined})); }} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address (Max 400 chars)</label>
            <textarea required className="mt-1 block w-full p-2 border border-gray-300 rounded" rows="3"
              value={formData.address}
              onChange={e => { setFormData({...formData, address: e.target.value}); setErrors(prev => ({...prev, address: undefined})); }}></textarea>
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password (8-16 chars, 1 Upper, 1 Special)</label>
            <input type="password" required className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={formData.password}
              onChange={e => { setFormData({...formData, password: e.target.value}); setErrors(prev => ({...prev, password: undefined})); }} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition">Register</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">Already registered? <Link to="/login" className="text-blue-600 underline">Log in</Link></p>
      </div>
    </div>
  );
}
