import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import AddExpense from './components/AddExpense';
import SettleUp from './components/SettleUp';
import './index.css';

// Login component for user selection/creation
const Login = () => {
  const { currentUser, users, createUser, fetchUsers, setCurrentUser, loading } = useExpense();
  const [showCreateUser, setShowCreateUser] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', email: '' });
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserSelect = (user) => {
    setCurrentUser(user);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      return;
    }

    try {
      const user = await createUser(formData);
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to create user:', error);
      setError('Failed to create account. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-600">Welcome to Settlr</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!showCreateUser ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select your account</h2>
            <div className="space-y-2 mb-4">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreateUser(true)}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
            >
              Create New Account
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Create Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useExpense();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ExpenseProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Navigation />
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/groups" element={
              <ProtectedRoute>
                <Navigation />
                <Groups />
              </ProtectedRoute>
            } />
            <Route path="/add-expense" element={
              <ProtectedRoute>
                <Navigation />
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="/settle-up" element={
              <ProtectedRoute>
                <Navigation />
                <SettleUp />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </ExpenseProvider>
  );
}

export default App;
