import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { validateSignupForm } from '../utils/validation';

export default function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation before hitting the API.
    const { isValid, errors: clientErrors } = validateSignupForm(formData);
    if (!isValid) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || { general: data.message || 'Signup failed.' });
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/stores');
    } catch (err) {
      setErrors({ general: 'Connection failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasErr) =>
    `mt-1 block w-full p-2 border rounded focus:outline-none focus:ring-2 ${
      hasErr ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-200'
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Normal User Signup</h2>
        {errors.general && <p className="text-red-500 text-sm mb-4 text-center">{errors.general}</p>}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name (20–60 characters)</label>
            <input
              type="text"
              value={formData.name}
              className={inputCls(!!errors.name)}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              className={inputCls(!!errors.email)}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address (max 400 chars)</label>
            <textarea
              rows="3"
              value={formData.address}
              className={inputCls(!!errors.address)}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password (8–16 chars, 1 uppercase, 1 special)</label>
            <input
              type="password"
              value={formData.password}
              className={inputCls(!!errors.password)}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-300 hover:bg-blue-400 disabled:opacity-50 text-white p-2 rounded transition"
          >
            {submitting ? 'Registering…' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already registered? <Link to="/login" className="text-blue-400 underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
