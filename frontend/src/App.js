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
  const { state, actions } = useExpense();
  const [showCreateUser, setShowCreateUser] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', email: '', phone: '' });

  React.useEffect(() => {
    actions.loadUsers();
  }, []);

  const handleUserSelect = (user) => {
    actions.setCurrentUser(user);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const user = await actions.createUser(formData);
      actions.setCurrentUser(user);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  if (state.currentUser) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-600">Welcome to Settlr</h1>

        {!showCreateUser ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select your account</h2>
            <div className="space-y-2 mb-4">
              {state.users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCreateUser(true)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create New Account
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Create Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

// Main app layout with navigation
const AppLayout = ({ children }) => {
  const { state } = useExpense();

  if (!state.currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <ExpenseProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          } />
          <Route path="/groups" element={
            <AppLayout>
              <Groups />
            </AppLayout>
          } />
          <Route path="/add-expense" element={
            <AppLayout>
              <AddExpense />
            </AppLayout>
          } />
          <Route path="/settle-up" element={
            <AppLayout>
              <SettleUp />
            </AppLayout>
          } />
        </Routes>
      </Router>
    </ExpenseProvider>
  );
}

export default App;
