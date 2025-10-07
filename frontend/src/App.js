import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import BottomNavigation from './components/BottomNavigation';
import Groups from './components/Groups';
import AddExpense from './components/AddExpense';
import SettleUp from './components/SettleUp';
import Notifications from './components/Notifications';
import Login from './components/Login';
import Signup from './components/Signup';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // Fetch notification count when user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchNotificationCount = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`http://localhost:8080/api/invitations/user/${currentUser.id}/pending`);
      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('login');
    setNotificationCount(0);
  };

  const handleSignupSuccess = (user) => {
    // After successful signup, redirect to login
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <Login onLogin={handleLogin} onSwitchToSignup={() => setCurrentView('signup')} />
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  if (currentView === 'signup') {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <Signup onSignupSuccess={handleSignupSuccess} onBackToLogin={() => setCurrentView('login')} />
        </ToastProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation
            currentView={currentView}
            setCurrentView={setCurrentView}
            currentUser={currentUser}
            onLogout={handleLogout}
            notificationCount={notificationCount}
          />

          <main className="container mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 pb-20 md:pb-8">
            {currentView === 'dashboard' && <Dashboard currentUser={currentUser} setCurrentView={setCurrentView} />}
            {currentView === 'groups' && <Groups currentUser={currentUser} />}
            {currentView === 'add-expense' && <AddExpense currentUser={currentUser} />}
            {currentView === 'settle-up' && <SettleUp currentUser={currentUser} />}
            {currentView === 'notifications' && <Notifications currentUser={currentUser} />}
          </main>

          <BottomNavigation
            currentView={currentView}
            setCurrentView={setCurrentView}
            notificationCount={notificationCount}
          />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
