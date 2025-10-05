import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Groups from './components/Groups';
import AddExpense from './components/AddExpense';
import SettleUp from './components/SettleUp';
import Admin from './components/Admin';
import Login from './components/Login';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('dashboard');
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} setCurrentView={setCurrentView} />}
        {currentView === 'groups' && <Groups currentUser={currentUser} />}
        {currentView === 'add-expense' && <AddExpense currentUser={currentUser} />}
        {currentView === 'settle-up' && <SettleUp currentUser={currentUser} />}
        {currentView === 'admin' && <Admin currentUser={currentUser} />}
      </main>
    </div>
  );
}

export default App;
