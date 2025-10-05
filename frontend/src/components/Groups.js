import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Settings, DollarSign, Calendar, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const Groups = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupBalances, setGroupBalances] = useState({});
  const [groupExpenses, setGroupExpenses] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: []
  });

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (groups.length > 0) {
      loadGroupBalancesAndExpenses();
    }
  }, [groups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/user/${currentUser.id}`);
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const loadGroupBalancesAndExpenses = async () => {
    if (loadingBalances) return;

    setLoadingBalances(true);
    const balances = {};
    const expenses = {};

    for (const group of groups) {
      try {
        // Fetch group balances
        const balanceResponse = await fetch(`${API_BASE}/expenses/group/${group.id}/balances`);
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          balances[group.id] = balanceData;
        }

        // Fetch group expenses
        const expenseResponse = await fetch(`${API_BASE}/expenses/group/${group.id}`);
        if (expenseResponse.ok) {
          const expenseData = await expenseResponse.json();
          expenses[group.id] = expenseData;
        }
      } catch (error) {
        console.error('Error loading data for group:', group.id, error);
      }
    }

    setGroupBalances(balances);
    setGroupExpenses(expenses);
    setLoadingBalances(false);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Add current user to memberIds if not already included
      const memberIds = [...formData.memberIds];
      if (!memberIds.includes(currentUser.id)) {
        memberIds.push(currentUser.id);
      }

      const groupData = {
        name: formData.name,
        description: formData.description,
        memberIds: memberIds
      };

      const response = await fetch(`${API_BASE}/groups?createdByUserId=${currentUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [...prev, newGroup]);
        setFormData({ name: '', description: '', memberIds: [] });
        setShowCreateGroup(false);
        console.log('Group created successfully:', newGroup);
      } else {
        const errorText = await response.text();
        console.error('Failed to create group:', errorText);
        alert('Failed to create group. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }));
  };

  const handleAddMember = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/groups/${selectedGroup.id}/members/${userId}`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh groups to show updated membership
        await fetchGroups();
        setShowAddMember(false);
        console.log('Member added successfully');
      } else {
        console.error('Failed to add member');
        alert('Failed to add member. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  const getAvailableUsers = () => {
    if (!selectedGroup) return [];
    const memberIds = selectedGroup.members?.map(m => m.id) || [];
    return users.filter(user => !memberIds.includes(user.id));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const getUserBalance = (groupId, userId) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return 0;
    return balance.userBalances[userId] || 0;
  };

  const getGroupTotalExpenses = (groupId) => {
    const balance = groupBalances[groupId];
    return balance?.totalExpenses || 0;
  };

  const getGroupExpenseCount = (groupId) => {
    const expenses = groupExpenses[groupId];
    return expenses?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
            <p className="text-gray-600 mt-2">Manage your expense groups and track balances</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        )}

        {/* Groups Grid */}
        {!loading && groups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groups.map((group) => {
              const userBalance = getUserBalance(group.id, currentUser.id);
              const totalExpenses = getGroupTotalExpenses(group.id);
              const expenseCount = getGroupExpenseCount(group.id);
              const isSettled = Math.abs(userBalance) < 0.01;

              return (
                <div key={group.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="p-6">
                    {/* Group Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {group.members?.length || 0} members
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {group.createdAt ? formatDate(group.createdAt) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowAddMember(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Group Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{expenseCount}</div>
                        <div className="text-xs text-blue-600">Expenses</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalExpenses)}</div>
                        <div className="text-xs text-green-600">Total Spent</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className={`text-2xl font-bold ${isSettled ? 'text-green-600' : userBalance > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {isSettled ? 'Settled' : formatCurrency(Math.abs(userBalance))}
                        </div>
                        <div className={`text-xs ${isSettled ? 'text-green-600' : userBalance > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {isSettled ? 'All Good' : userBalance > 0 ? 'You Owe' : 'You\'re Owed'}
                        </div>
                      </div>
                    </div>

                    {/* Your Balance Status */}
                    <div className={`p-4 rounded-lg mb-4 ${
                      isSettled ? 'bg-green-50 border border-green-200' :
                      userBalance > 0 ? 'bg-red-50 border border-red-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isSettled ? (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                          ) : userBalance > 0 ? (
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className={`font-medium ${
                              isSettled ? 'text-green-800' :
                              userBalance > 0 ? 'text-red-800' :
                              'text-blue-800'
                            }`}>
                              {isSettled ? 'All settled up!' :
                               userBalance > 0 ? `You owe ${formatCurrency(userBalance)}` :
                               `You're owed ${formatCurrency(Math.abs(userBalance))}`}
                            </p>
                            <p className="text-xs text-gray-600">Your balance in this group</p>
                          </div>
                        </div>
                        {!isSettled && (
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Member Balances Summary */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Member Balances
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {group.members?.map(member => {
                          const memberBalance = getUserBalance(group.id, member.id);
                          const memberIsSettled = Math.abs(memberBalance) < 0.01;

                          return (
                            <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                              </div>
                              <span className={`text-sm font-medium ${
                                memberIsSettled ? 'text-green-600' :
                                memberBalance > 0 ? 'text-red-600' :
                                'text-blue-600'
                              }`}>
                                {memberIsSettled ? 'Settled' :
                                 memberBalance > 0 ? `Owes ${formatCurrency(memberBalance)}` :
                                 `Owed ${formatCurrency(Math.abs(memberBalance))}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Expenses Preview */}
                    {groupExpenses[group.id] && groupExpenses[group.id].length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Recent Expenses
                        </h4>
                        <div className="space-y-2">
                          {groupExpenses[group.id].slice(0, 3).map(expense => (
                            <div key={expense.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                                <p className="text-xs text-gray-500">
                                  Paid by {expense.paidBy?.name} • {formatDate(expense.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                                <p className="text-xs text-gray-500">
                                  Your share: {formatCurrency(expense.amountPerPerson)}
                                </p>
                              </div>
                            </div>
                          ))}
                          {groupExpenses[group.id].length > 3 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              +{groupExpenses[group.id].length - 3} more expenses
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">Create your first group to start splitting expenses with friends</p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Your First Group
            </button>
          </div>
        )}

        {/* Loading Balances Indicator */}
        {loadingBalances && !loading && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-sm">Loading balances...</span>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Group</h2>

                <form onSubmit={handleCreateGroup} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Roommates, Vacation Trip"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What's this group for?"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Members (optional)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {users.filter(user => user.id !== currentUser.id).map(user => (
                        <label key={user.id} className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.memberIds.includes(user.id)}
                            onChange={() => handleMemberToggle(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      You'll be automatically added as a member. Selected: {formData.memberIds.length} member(s)
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 font-medium transition-all duration-200"
                    >
                      {loading ? 'Creating...' : 'Create Group'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateGroup(false);
                        setFormData({ name: '', description: '', memberIds: [] });
                      }}
                      disabled={loading}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Member to {selectedGroup.name}</h2>

              <div className="max-h-60 overflow-y-auto mb-4">
                {getAvailableUsers().length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    All users are already members of this group.
                  </p>
                ) : (
                  getAvailableUsers().map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:from-green-600 hover:to-green-700"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
