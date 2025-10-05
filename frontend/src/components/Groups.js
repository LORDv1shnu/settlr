import React, { useState, useEffect, useCallback } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Users, Plus, UserPlus, Settings, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const Groups = () => {
  const { state, actions } = useExpense();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupBalances, setGroupBalances] = useState({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (state.currentUser && state.groups.length === 0) {
      actions.loadGroups(state.currentUser.id);
    }
    if (state.users.length === 0) {
      actions.loadUsers();
    }
  }, [state.currentUser, state.groups.length, state.users.length, actions]);

  // Load balances for all groups (debounced)
  const loadBalances = useCallback(async () => {
    if (state.groups.length === 0 || loadingBalances) return;

    setLoadingBalances(true);
    const balances = {};

    for (const group of state.groups) {
      try {
        const groupBalance = await actions.getGroupBalances(group.id);
        balances[group.id] = groupBalance;
      } catch (error) {
        console.error('Error loading balance for group:', group.id);
      }
    }

    setGroupBalances(balances);
    setLoadingBalances(false);
  }, [state.groups, actions, loadingBalances]);

  useEffect(() => {
    if (state.groups.length > 0 && Object.keys(groupBalances).length === 0) {
      loadBalances();
    }
  }, [state.groups.length, groupBalances, loadBalances]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const newGroup = await actions.createGroup(formData, state.currentUser.id);
      setFormData({ name: '', description: '' });
      setShowCreateGroup(false);
      // Refresh groups to get the updated list
      actions.loadGroups(state.currentUser.id);
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/groups/${selectedGroup.id}/members/${userId}`, {
        method: 'POST'
      });
      if (response.ok) {
        // Refresh groups and balances
        await actions.loadGroups(state.currentUser.id);
        setShowAddMember(false);
        // Clear and reload balances
        setGroupBalances({});
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const getAvailableUsers = () => {
    if (!selectedGroup) return [];
    const memberIds = selectedGroup.members?.map(m => m.id) || [];
    return state.users.filter(user => !memberIds.includes(user.id));
  };

  const getUserBalance = (groupId, userName) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return 0;
    return balance.userBalances[userName] || 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600">Manage your expense groups and members</p>
        </div>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Create Group</span>
        </button>
      </div>

      {/* Loading State */}
      {state.loading && (
        <div className="text-center py-8 text-gray-500">Loading groups...</div>
      )}

      {/* Groups Grid */}
      {!state.loading && state.groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.groups.map((group) => {
            const balance = groupBalances[group.id];
            const userBalance = getUserBalance(group.id, state.currentUser?.name);

            return (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Users size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowAddMember(true);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Settings size={18} />
                    </button>
                  </div>

                  {/* Group Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Members</span>
                      <span className="font-medium">{group.members?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Expenses</span>
                      <span className="font-medium">₹{group.totalExpenses?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Your Balance</span>
                      {loadingBalances ? (
                        <span className="text-sm text-gray-500">Loading...</span>
                      ) : (
                        <span className={`font-medium ${userBalance > 0 ? 'text-red-600' : userBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {userBalance > 0 ? `You owe ₹${userBalance.toFixed(2)}` :
                           userBalance < 0 ? `You're owed ₹${Math.abs(userBalance).toFixed(2)}` :
                           'Settled up'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Members</span>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowAddMember(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {group.members?.slice(0, 3).map((member) => (
                        <div key={member.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{member.name}</span>
                          {!loadingBalances && (
                            <span className={`text-xs ${getUserBalance(group.id, member.name) > 0 ? 'text-red-600' : getUserBalance(group.id, member.name) < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {getUserBalance(group.id, member.name) !== 0 ? `₹${Math.abs(getUserBalance(group.id, member.name)).toFixed(2)}` : 'Settled'}
                            </span>
                          )}
                        </div>
                      ))}
                      {group.members?.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{group.members.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="border-t pt-3 mt-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      Created {group.createdAt ? format(new Date(group.createdAt), 'MMM dd, yyyy') : 'Recently'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : !state.loading ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-600 mb-6">Create your first group to start splitting expenses</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Group
          </button>
        </div>
      ) : null}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Weekend Trip, Roommates, Team Lunch"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of the group"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Member to {selectedGroup.name}</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getAvailableUsers().map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAddMember(user.id)}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </button>
              ))}
              {getAvailableUsers().length === 0 && (
                <p className="text-gray-500 text-center py-4">No more users to add</p>
              )}
            </div>
            <button
              onClick={() => setShowAddMember(false)}
              className="w-full mt-4 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
