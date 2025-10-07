import React, { useState } from 'react';
import { UserPlus, Loader2, ArrowLeft } from 'lucide-react';

const Signup = ({ onSignupSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      if (res.ok) {
        const user = await res.json();
        // Store user in localStorage and redirect to dashboard
        localStorage.setItem('currentUser', JSON.stringify(user));
        setSuccess(true);
        setTimeout(() => {
          window.location.reload(); // Reload to trigger dashboard view
        }, 1500);
      } else if (res.status === 400) {
        setError('User with this email already exists');
      } else {
        setError('Signup failed - backend error');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Cannot connect to backend. Is it running on port 8080?');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-600">Taking you to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Back Button */}
        <button
          onClick={onBackToLogin}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm sm:text-base">Back to Login</span>
        </button>

        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserPlus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Join Settlr and start splitting expenses
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Create a password (min 4 characters)"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition-all duration-200 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-sm sm:text-base text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onBackToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
