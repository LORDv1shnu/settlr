import React, { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else if (res.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Login failed - backend error');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Cannot connect to backend. Is it running on port 8080?');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <span className="text-lg text-gray-700">Loading users...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome to Settlr
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Split expenses with friends and family
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                <p className="text-red-800 text-sm sm:text-base">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition-all duration-200 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>

        {/* Demo Instructions */}
        <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
          <h3 className="text-sm sm:text-base font-medium text-blue-900 mb-2">Demo Users</h3>
          <div className="text-xs sm:text-sm text-blue-800 space-y-1">
            <p>• alice@example.com / password123</p>
            <p>• bob@example.com / password123</p>
            <p>• charlie@example.com / password123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
