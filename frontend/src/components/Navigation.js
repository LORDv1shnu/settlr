import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Plus,
  DollarSign,
  Mail,
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';

const Navigation = ({ currentView, setCurrentView, currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (currentUser) {
      fetchNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchNotificationCount = async () => {
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'groups', label: 'Groups', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'add-expense', label: 'Add Expense', icon: Plus, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'settle-up', label: 'Settle Up', icon: DollarSign, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'notifications', label: 'Notifications', icon: Mail, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (itemId) => {
    setCurrentView(itemId);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settlr
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const showBadge = item.id === 'notifications' && notificationCount > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 relative ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-sm`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* User Menu and Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200">
                <Bell className="w-5 h-5" />
              </button>

              {/* User Profile - Desktop */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 group"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 group-hover:animate-pulse" />
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-screen opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
            {/* User Info - Mobile */}
            <div className="flex items-center px-3 py-3 bg-gray-50 rounded-lg mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
            </div>

            {/* Navigation Items - Mobile */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const showBadge = item.id === 'notifications' && notificationCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? `${item.bgColor} ${item.color} shadow-sm`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'animate-pulse' : ''}`} />
                  {item.label}
                  {showBadge && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Logout - Mobile */}
            <button
              onClick={() => {
                onLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
