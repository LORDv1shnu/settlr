import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { Users, DollarSign, Receipt, Plus, Clock, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const {
    currentUser,
    groups,
    expenses,
    fetchUserGroups,
    fetchUserExpenses,
    getGroupBalances,
    loading
  } = useExpense();

  const [recentExpenses, setRecentExpenses] = useState([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!currentUser || (dashboardLoading && !forceRefresh)) return;

    console.log('🔄 Loading dashboard data for user:', currentUser.name);
    setDashboardLoading(true);
    try {
      // Load user's groups and expenses
      const [groupsResult, expensesResult] = await Promise.all([
        fetchUserGroups(currentUser.id),
        fetchUserExpenses(currentUser.id)
      ]);

      console.log('✅ Dashboard data loaded:', {
        groups: groupsResult?.length || 0,
        expenses: expensesResult?.length || 0
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  }, [currentUser, fetchUserGroups, fetchUserExpenses, dashboardLoading]);

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    loadDashboardData(true);
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  useEffect(() => {
    // Update recent expenses when expenses change
    console.log('📊 Updating recent expenses. Total expenses:', expenses.length);
    setRecentExpenses(expenses.slice(0, 5));
  }, [expenses]);

  const calculateTotals = useCallback(async () => {
    if (groups.length === 0 || !currentUser) return;

    console.log('🔄 Calculating totals for', groups.length, 'groups');
    let totalOwedAmount = 0;
    let totalToReceiveAmount = 0;

    for (const group of groups) {
      try {
        console.log('📊 Getting balances for group:', group.name, 'ID:', group.id);
        const balances = await getGroupBalances(group.id);
        console.log('📊 Received balances for group', group.id, ':', balances);

        if (balances && balances.userBalances) {
          // Get the current user's balance for this group
          const userBalance = balances.userBalances[currentUser.id];
          console.log('👤 User', currentUser.id, 'balance in group', group.name, ':', userBalance);

          if (userBalance !== undefined) {
            if (userBalance > 0) {
              // Positive balance means user owes money
              totalOwedAmount += userBalance;
              console.log('💸 User owes', userBalance, 'in group', group.name);
            } else if (userBalance < 0) {
              // Negative balance means user is owed money
              totalToReceiveAmount += Math.abs(userBalance);
              console.log('💰 User is owed', Math.abs(userBalance), 'in group', group.name);
            }
          }
        } else {
          console.warn('⚠️ No userBalances found for group', group.id);
        }
      } catch (error) {
        console.error('❌ Error calculating balances for group:', group.id, error);
      }
    }

    console.log('💵 Final totals - Owed:', totalOwedAmount, 'To Receive:', totalToReceiveAmount);
    setTotalOwed(totalOwedAmount);
    setTotalToReceive(totalToReceiveAmount);
  }, [groups, currentUser, getGroupBalances]);

  useEffect(() => {
    calculateTotals();
  }, [groups, calculateTotals]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header with Refresh Button */}
        <div className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {currentUser.name}!
              </h1>
              <p className="mt-2 text-gray-600">
                Here's your expense summary
              </p>
              <p className="text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={dashboardLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Debug Information (remove in production) */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">🐛 Debug Info:</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>• Groups loaded: {groups.length}</p>
            <p>• Expenses loaded: {expenses.length}</p>
            <p>• Recent expenses: {recentExpenses.length}</p>
            <p>• Loading state: {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Groups
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {groups.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Expenses
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {expenses.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      You Owe
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{totalOwed.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      You're Owed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{totalToReceive.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link
                  to="/groups"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Link>
                <Link
                  to="/add-expense"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentExpenses.length > 0 ? (
                  recentExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {expense.group?.name || 'Unknown Group'} • {expense.paidBy?.name || 'Unknown User'}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{expense.amount}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent expenses</p>
                    <Link
                      to="/add-expense"
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Add your first expense
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Groups Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Groups
            </h3>
            {groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map(group => (
                  <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900 mb-2">{group.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {group.members?.length || 0} members
                      </span>
                      <Link
                        to={`/groups?selected=${group.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You're not part of any groups yet</p>
                <Link
                  to="/groups"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
