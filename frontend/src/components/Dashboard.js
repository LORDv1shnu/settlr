import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { Users, DollarSign, Receipt, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { state, actions } = useExpense();
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!state.currentUser || loading) return;

    setLoading(true);
    try {
      // Load user's groups only if not already loaded
      if (state.groups.length === 0) {
        await actions.loadGroups(state.currentUser.id);
      }

      // Load recent expenses
      const expenses = await fetch(`http://localhost:8080/api/expenses/user/${state.currentUser.id}`);
      if (expenses.ok) {
        const expenseData = await expenses.json();
        setRecentExpenses(expenseData.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [state.currentUser?.id, state.groups.length, actions, loading]);

  const calculateTotals = useCallback(async () => {
    if (state.groups.length === 0 || !state.currentUser) return;

    let totalOwedAmount = 0;
    let totalToReceiveAmount = 0;

    for (const group of state.groups) {
      try {
        const balances = await actions.getGroupBalances(group.id);
        const userBalance = balances.userBalances?.[state.currentUser.name] || 0;
        if (userBalance > 0) {
          totalOwedAmount += userBalance;
        } else if (userBalance < 0) {
          totalToReceiveAmount += Math.abs(userBalance);
        }
      } catch (error) {
        console.error('Error loading balances for group:', group.id);
      }
    }

    setTotalOwed(totalOwedAmount);
    setTotalToReceive(totalToReceiveAmount);
  }, [state.groups, state.currentUser?.name, actions]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (state.groups.length > 0) {
      calculateTotals();
    }
  }, [calculateTotals]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {state.currentUser?.name}!
        </h1>
        <p className="text-gray-600">
          Here's your expense overview and recent activity.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Groups</p>
              <p className="text-2xl font-bold text-gray-900">{state.groups.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">You Owe</p>
              <p className="text-2xl font-bold text-red-600">₹{totalOwed.toFixed(2)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">You're Owed</p>
              <p className="text-2xl font-bold text-green-600">₹{totalToReceive.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity and Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <Link
              to="/add-expense"
              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
            >
              <Plus size={16} />
              <span>Add</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Receipt size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.group?.name} • {expense.paidBy?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{expense.amount?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-gray-500">
                      {expense.createdAt ? format(new Date(expense.createdAt), 'MMM dd') : 'Recent'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Receipt size={48} className="mx-auto mb-2 opacity-50" />
              <p>No recent expenses</p>
              <Link
                to="/add-expense"
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Add your first expense
              </Link>
            </div>
          )}
        </div>

        {/* Your Groups */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Groups</h2>
            <Link
              to="/groups"
              className="text-green-600 hover:text-green-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>

          {state.groups.length > 0 ? (
            <div className="space-y-3">
              {state.groups.slice(0, 4).map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Users size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{group.name}</p>
                      <p className="text-sm text-gray-500">
                        {group.members?.length || 0} members • ₹{group.totalExpenses?.toFixed(2) || '0.00'} total
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <Clock size={16} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-2 opacity-50" />
              <p>No groups yet</p>
              <Link
                to="/groups"
                className="text-green-600 hover:text-green-700 text-sm"
              >
                Create your first group
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/add-expense"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Plus className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Add Expense</span>
          </Link>

          <Link
            to="/groups"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Users className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Manage Groups</span>
          </Link>

          <Link
            to="/settle-up"
            className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <DollarSign className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Settle Up</span>
          </Link>

          <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
            <Receipt className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">Export Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
