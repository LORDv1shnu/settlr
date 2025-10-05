import React, { useState, useEffect } from 'react';
import {
  Users,
  Database,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';

const Admin = ({ currentUser }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGroups: 0,
    totalExpenses: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirmations, setConfirmations] = useState({});

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, groupsRes, expensesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/expense-groups'),
        fetch('/api/expenses')
      ]);

      const users = usersRes.ok ? await usersRes.json() : [];
      const groups = groupsRes.ok ? await groupsRes.json() : [];
      const expenses = expensesRes.ok ? await expensesRes.json() : [];

      const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      setStats({
        totalUsers: users.length,
        totalGroups: groups.length,
        totalExpenses: expenses.length,
        totalAmount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClearAllData = async () => {
    if (!confirmations.clearAll) {
      setConfirmations({ ...confirmations, clearAll: true });
      return;
    }

    setLoading(true);
    try {
      // Clear expenses first (due to foreign key constraints)
      await fetch('/api/expenses/clear-all', { method: 'DELETE' });

      // Clear groups
      await fetch('/api/expense-groups/clear-all', { method: 'DELETE' });

      // Clear users (except current user)
      const response = await fetch(`/api/users/clear-all-except/${currentUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showMessage('All data cleared successfully!', 'success');
        fetchStats();
      } else {
        showMessage('Failed to clear some data', 'error');
      }
    } catch (error) {
      showMessage('Error clearing data: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setConfirmations({ ...confirmations, clearAll: false });
    }
  };

  const handleClearExpenses = async () => {
    if (!confirmations.clearExpenses) {
      setConfirmations({ ...confirmations, clearExpenses: true });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/expenses/clear-all', { method: 'DELETE' });
      if (response.ok) {
        showMessage('All expenses cleared successfully!', 'success');
        fetchStats();
      } else {
        showMessage('Failed to clear expenses', 'error');
      }
    } catch (error) {
      showMessage('Error clearing expenses: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setConfirmations({ ...confirmations, clearExpenses: false });
    }
  };

  const handleClearGroups = async () => {
    if (!confirmations.clearGroups) {
      setConfirmations({ ...confirmations, clearGroups: true });
      return;
    }

    setLoading(true);
    try {
      // Clear expenses in groups first
      await fetch('/api/expenses/clear-all', { method: 'DELETE' });

      // Then clear groups
      const response = await fetch('/api/expense-groups/clear-all', { method: 'DELETE' });
      if (response.ok) {
        showMessage('All groups and related expenses cleared successfully!', 'success');
        fetchStats();
      } else {
        showMessage('Failed to clear groups', 'error');
      }
    } catch (error) {
      showMessage('Error clearing groups: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setConfirmations({ ...confirmations, clearGroups: false });
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/export-data');
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlr-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('Data exported successfully!', 'success');
      } else {
        showMessage('Failed to export data', 'error');
      }
    } catch (error) {
      showMessage('Error exporting data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelConfirmation = (action) => {
    setConfirmations({ ...confirmations, [action]: false });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage your Settlr application</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center animate-slideIn ${
              message.type === 'success'
                ? 'bg-green-100 border border-green-200 text-green-800'
                : 'bg-red-100 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-3" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-3" />
              )}
              {message.text}
            </div>
          )}

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Groups</p>
                  <p className="text-3xl font-bold">{stats.totalGroups}</p>
                </div>
                <Database className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold">{stats.totalExpenses}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <Settings className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Export Data */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Download className="w-6 h-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-blue-900">Export Data</h3>
                </div>
                <p className="text-blue-700 mb-4 text-sm">
                  Download a complete backup of all your data as a JSON file
                </p>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </div>
                  ) : (
                    'Export Data'
                  )}
                </button>
              </div>

              {/* Refresh Stats */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <RefreshCw className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-green-900">Refresh Statistics</h3>
                </div>
                <p className="text-green-700 mb-4 text-sm">
                  Update the dashboard with the latest data from the database
                </p>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors disabled:opacity-50"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Clear Expenses */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Trash2 className="w-6 h-6 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-semibold text-yellow-900">Clear Expenses</h3>
                </div>
                <p className="text-yellow-700 mb-4 text-sm">
                  Remove all expenses while keeping users and groups intact
                </p>
                {confirmations.clearExpenses ? (
                  <div className="space-y-2">
                    <p className="text-yellow-800 font-medium text-sm">Are you sure?</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearExpenses}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Clearing...' : 'Yes, Clear'}
                      </button>
                      <button
                        onClick={() => cancelConfirmation('clearExpenses')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleClearExpenses}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors"
                  >
                    Clear All Expenses
                  </button>
                )}
              </div>

              {/* Clear Groups */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Database className="w-6 h-6 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-orange-900">Clear Groups</h3>
                </div>
                <p className="text-orange-700 mb-4 text-sm">
                  Remove all groups and their expenses (keeps users)
                </p>
                {confirmations.clearGroups ? (
                  <div className="space-y-2">
                    <p className="text-orange-800 font-medium text-sm">Are you sure?</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearGroups}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {loading ? 'Clearing...' : 'Yes, Clear'}
                      </button>
                      <button
                        onClick={() => cancelConfirmation('clearGroups')}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleClearGroups}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg w-full transition-colors"
                  >
                    Clear All Groups
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-semibold text-red-900">Danger Zone</h2>
            </div>
            <div className="bg-white border border-red-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Clear All Data</h3>
              <p className="text-red-600 mb-4 text-sm">
                This will permanently delete ALL users (except you), groups, and expenses. This action cannot be undone!
              </p>
              {confirmations.clearAll ? (
                <div className="space-y-3">
                  <p className="text-red-800 font-medium">⚠️ Are you absolutely sure?</p>
                  <p className="text-red-700 text-sm">This will delete everything except your account!</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleClearAllData}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Clearing All...' : 'YES, DELETE EVERYTHING'}
                    </button>
                    <button
                      onClick={() => cancelConfirmation('clearAll')}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClearAllData}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Clear All Data
                </button>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Current User:</strong> {currentUser?.name}</p>
                <p><strong>Email:</strong> {currentUser?.email}</p>
              </div>
              <div>
                <p><strong>Admin Panel Version:</strong> 1.0.0</p>
                <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
