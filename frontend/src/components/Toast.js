import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast = ({ toast, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };

  const Icon = icons[toast.type];

  return (
    <div className={`max-w-sm w-full ${colors[toast.type]} border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-start">
        <Icon className={`w-5 h-5 ${iconColors[toast.type]} mr-3 mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-sm font-medium mb-1">{toast.title}</p>
          )}
          <p className="text-sm">{toast.message}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = { id, ...toast };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 5000);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((message, title, duration) => {
    return addToast({ type: 'success', message, title, duration });
  }, [addToast]);

  const showError = useCallback((message, title, duration) => {
    return addToast({ type: 'error', message, title, duration });
  }, [addToast]);

  const showWarning = useCallback((message, title, duration) => {
    return addToast({ type: 'warning', message, title, duration });
  }, [addToast]);

  const showInfo = useCallback((message, title, duration) => {
    return addToast({ type: 'info', message, title, duration });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      addToast,
      removeToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
