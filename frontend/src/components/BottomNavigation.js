import React from 'react';
import { Home, Users, Plus, DollarSign, Bell } from 'lucide-react';

const BottomNavigation = ({ currentView, setCurrentView, notificationCount }) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'text-blue-600' },
    { id: 'groups', label: 'Groups', icon: Users, color: 'text-green-600' },
    { id: 'add-expense', label: 'Add', icon: Plus, color: 'text-purple-600' },
    { id: 'settle-up', label: 'Settle', icon: DollarSign, color: 'text-orange-600' },
    { id: 'notifications', label: 'Alerts', icon: Bell, color: 'text-pink-600' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const showBadge = item.id === 'notifications' && notificationCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`flex flex-col items-center py-2 px-1 relative transition-colors duration-200 ${
                isActive ? item.color : 'text-gray-400'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-medium truncate">{item.label}</span>
              {showBadge && (
                <span className="absolute -top-1 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
