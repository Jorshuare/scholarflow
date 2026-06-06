import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/auth.service';

export default function RegisterForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await authService.register(email, password);
      login(token, user);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F8]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E4E7EF] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#002868] to-[#C8A951]" />

          <div className="px-8 py-8">
            <div className="mb-7">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#002868] to-[#C8A951] bg-clip-text text-transparent">
                ScholarFlow
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#E4E7EF] rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#002868] hover:bg-[#001f52] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors mt-2"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-xs text-gray-500 mt-6 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-[#002868] hover:text-[#001f52] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
