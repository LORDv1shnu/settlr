import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Receipt, Plus, Clock, RefreshCw, TrendingUp, TrendingDown, Eye } from 'lucide-react';

const Dashboard = ({ currentUser, setCurrentView }) => {
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalOwed, setTotalOwed] = useState(0);
  const [totalToReceive, setTotalToReceive] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [settlements, setSettlements] = useState([]);

  const API_BASE = 'http://localhost:8080/api';

  const loadDashboardData = async (forceRefresh = false) => {
    if (!currentUser || (dashboardLoading && !forceRefresh)) return;

    console.log('🔄 Loading dashboard data for user:', currentUser.name);
    setDashboardLoading(true);
    try {
      // Load user's groups and expenses
      const [groupsRes, expensesRes] = await Promise.all([
        fetch(`${API_BASE}/groups/user/${currentUser.id}`),
        fetch(`${API_BASE}/expenses/user/${currentUser.id}`)
      ]);

      const groupsData = groupsRes.ok ? await groupsRes.json() : [];
      const expensesData = expensesRes.ok ? await expensesRes.json() : [];

      setGroups(groupsData);
      setExpenses(expensesData);

      // Fetch all settlements for user's groups
      const allSettlements = [];
      for (const group of groupsData) {
        try {
          const settlementsRes = await fetch(`${API_BASE}/settlements/group/${group.id}`);
          if (settlementsRes.ok) {
            const groupSettlements = await settlementsRes.json();
            allSettlements.push(...groupSettlements);
          }
        } catch (error) {
          console.error(`Error fetching settlements for group ${group.id}:`, error);
        }
      }
      setSettlements(allSettlements);

      console.log('✅ Dashboard data loaded:', {
        groups: groupsData.length,
        expenses: expensesData.length,
        settlements: allSettlements.length
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    loadDashboardData(true);
  };

  // Calculate balances and recent expenses
  useEffect(() => {
    if (!currentUser || !expenses || !groups) return;

    // Get recent expenses (last 5)
    const sorted = [...expenses]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    setRecentExpenses(sorted);

    // Calculate total owed and to receive across all groups
    // Now properly accounting for settlements from database
    let owed = 0;
    let toReceive = 0;

    groups.forEach(group => {
      const groupExpenses = expenses.filter(exp => exp.group?.id === group.id);
      const groupSettlements = settlements.filter(s => s.groupId === group.id);
      const balances = {};
      
      // Calculate gross balances from expenses
      groupExpenses.forEach(expense => {
        const totalAmount = expense.amount;
        const splitCount = expense.splitBetweenUsers?.length || 1;
        const amountPerPerson = totalAmount / splitCount;

        const paidByName = expense.paidBy?.name;
        if (paidByName) {
          if (!balances[paidByName]) balances[paidByName] = 0;
          balances[paidByName] += totalAmount - amountPerPerson;
        }

        if (expense.splitBetweenUsers) {
          expense.splitBetweenUsers.forEach(user => {
            if (!balances[user.name]) balances[user.name] = 0;
            if (user.name !== paidByName) {
              balances[user.name] -= amountPerPerson;
            }
          });
        }
      });

      // Apply settlements to reduce balances
      groupSettlements.forEach(settlement => {
        const fromUserName = settlement.fromUserName;
        const toUserName = settlement.toUserName;
        const amount = settlement.amount;

        // When fromUser pays toUser:
        // - fromUser's debt decreases (add to balance)
        // - toUser's credit decreases (subtract from balance)
        if (balances[fromUserName] !== undefined) {
          balances[fromUserName] += amount;
        }
        if (balances[toUserName] !== undefined) {
          balances[toUserName] -= amount;
        }
      });

      // Get user's balance in this group (now net of settlements)
      const userBalance = balances[currentUser.name] || 0;
      
      if (userBalance > 0.01) {
        // User is owed money
        // Calculate settlements with each debtor
        Object.entries(balances).forEach(([otherUser, otherBalance]) => {
          if (otherUser !== currentUser.name && otherBalance < -0.01) {
            const amount = Math.min(userBalance, Math.abs(otherBalance));
            if (amount > 0.01) {
              toReceive += amount;
            }
          }
        });
      } else if (userBalance < -0.01) {
        // User owes money
        // Calculate settlements with each creditor
        Object.entries(balances).forEach(([otherUser, otherBalance]) => {
          if (otherUser !== currentUser.name && otherBalance > 0.01) {
            const amount = Math.min(Math.abs(userBalance), otherBalance);
            if (amount > 0.01) {
              owed += amount;
            }
          }
        });
      }
    });

    setTotalOwed(owed);
    setTotalToReceive(toReceive);
  }, [currentUser, expenses, groups, settlements]);

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 border-l-4 ${color} transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1 mr-2">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-lg sm:text-3xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')} flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-8 sm:h-8 ${color.replace('border-l-', 'text-')}`} />
        </div>
      </div>
      {trend && (
        <div className="mt-2 sm:mt-4 flex items-center">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
          <span className="text-xs sm:text-sm text-green-600 truncate">{trend}</span>
        </div>
      )}
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-breathe rounded-full h-32 w-32 bg-blue-100 border-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 truncate">
                Welcome back, {currentUser.name}! 👋
              </h1>
              <p className="text-base sm:text-lg text-gray-600">
                Here's your expense overview for today
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-500">Last updated</p>
                <p className="text-xs sm:text-sm font-medium text-gray-700">
                  {formatDate(lastRefresh)}
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={dashboardLoading}
                className="bg-white p-2 sm:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-600 ${dashboardLoading ? 'animate-soft-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Groups"
            value={groups?.length || 0}
            icon={Users}
            color="border-l-blue-500"
            subtitle={`${groups?.length || 0} active groups`}
          />
          <StatCard
            title="Total Expenses"
            value={expenses?.length || 0}
            icon={Receipt}
            color="border-l-green-500"
            subtitle="This month"
          />
          <StatCard
            title="You Owe"
            value={formatCurrency(totalOwed)}
            icon={TrendingDown}
            color="border-l-red-500"
            subtitle="Total outstanding"
          />
          <StatCard
            title="You're Owed"
            value={formatCurrency(totalToReceive)}
            icon={TrendingUp}
            color="border-l-purple-500"
            subtitle="To be received"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div
              onClick={() => setCurrentView('add-expense')}
              className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center">
                <Plus className="w-6 h-6 sm:w-8 sm:h-8 mr-3 group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">Add Expense</h3>
                  <p className="text-blue-100 text-xs sm:text-sm truncate">Split a new expense</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setCurrentView('groups')}
              className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mr-3 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">Manage Groups</h3>
                  <p className="text-green-100 text-xs sm:text-sm truncate">Create or join groups</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setCurrentView('settle-up')}
              className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 mr-3 group-hover:bounce transition-transform duration-300 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold truncate">Settle Up</h3>
                  <p className="text-purple-100 text-xs sm:text-sm truncate">Pay or collect money</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Recent Expenses */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Expenses</h2>
              <span className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium flex items-center cursor-pointer">
                View all <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </span>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Receipt className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No expenses yet</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Add your first expense to get started</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{expense.description}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          Paid by {expense.paidBy?.name || 'Unknown'} • {formatDate(expense.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(expense.amount)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Your share: {formatCurrency(expense.amountPerPerson)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Groups */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Your Groups</h2>
              <span className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm font-medium flex items-center cursor-pointer">
                Manage <Users className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </span>
            </div>

            {groups?.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No groups yet</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Create or join a group to start splitting expenses</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {groups?.slice(0, 5).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center min-w-0 flex-1 mr-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{group.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
