import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Settings, DollarSign, Calendar, TrendingUp, TrendingDown, ArrowRight, Trash2, X, RefreshCw } from 'lucide-react';

const Groups = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [groupBalances, setGroupBalances] = useState({});
  const [groupExpenses, setGroupExpenses] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberIds: []
  });
  const [expenseFormData, setExpenseFormData] = useState({
    description: '',
    amount: '',
    paidById: '',
    splitBetween: []
  });
  
  // Search-related state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addMemberSearchQuery, setAddMemberSearchQuery] = useState('');
  const [addMemberSearchResults, setAddMemberSearchResults] = useState([]);

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
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

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 4) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`${API_BASE}/users/search?name=${encodeURIComponent(query)}`);
      if (response.ok) {
        const usersData = await response.json();
        // Filter out current user and already selected members
        const filtered = usersData.filter(user => 
          user.id !== currentUser.id && !formData.memberIds.includes(user.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchUsersForAddMember = async (query) => {
    if (!query || query.trim().length < 4) {
      setAddMemberSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/search?name=${encodeURIComponent(query)}`);
      if (response.ok) {
        const usersData = await response.json();
        // Filter out current group members
        const memberIds = selectedGroup.members?.map(m => m.id) || [];
        const filtered = usersData.filter(user => !memberIds.includes(user.id));
        setAddMemberSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsersForAddMember(addMemberSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [addMemberSearchQuery]);

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

      // Create group with only current user as member
      const groupData = {
        name: formData.name,
        description: formData.description,
        memberIds: [currentUser.id] // Only add creator initially
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
        
        // Send invitations to selected members
        if (formData.memberIds.length > 0) {
          await Promise.all(
            formData.memberIds.map(memberId =>
              fetch(`${API_BASE}/invitations/send?groupId=${newGroup.id}&inviterId=${currentUser.id}&inviteeId=${memberId}`, {
                method: 'POST'
              })
            )
          );
          alert(`Group created! Invitations sent to ${formData.memberIds.length} user(s).`);
        }

        setGroups(prev => [...prev, newGroup]);
        setFormData({ name: '', description: '', memberIds: [] });
        setSearchQuery('');
        setSearchResults([]);
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
    // Clear search after adding
    if (!formData.memberIds.includes(userId)) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      // Send invitation instead of directly adding
      const response = await fetch(`${API_BASE}/invitations/send?groupId=${selectedGroup.id}&inviterId=${currentUser.id}&inviteeId=${userId}`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Invitation sent successfully!');
        setShowAddMember(false);
        setAddMemberSearchQuery('');
        setAddMemberSearchResults([]);
        console.log('Invitation sent successfully');
      } else {
        console.error('Failed to send invitation');
        alert('Failed to send invitation. User may already have a pending invitation.');
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Group deleted successfully!');
        fetchGroups(); // Refresh the groups list
      } else {
        alert('Failed to delete group. You may not have permission.');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Member removed successfully!');
        fetchGroups(); // Refresh the groups list
        if (selectedGroup && selectedGroup.id === groupId) {
          // Update selectedGroup if we're viewing this group
          const updatedGroup = await response.json();
          setSelectedGroup(updatedGroup);
        }
      } else {
        alert('Failed to remove member. You may not have permission.');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    
    if (!expenseFormData.description || !expenseFormData.amount || !expenseFormData.paidById) {
      alert('Please fill in all required fields');
      return;
    }

    if (expenseFormData.splitBetween.length === 0) {
      alert('Please select at least one person to split the expense with');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseFormData.description,
          amount: parseFloat(expenseFormData.amount),
          paidById: expenseFormData.paidById,
          groupId: selectedGroup.id,
          splitBetween: expenseFormData.splitBetween
        })
      });

      if (response.ok) {
        alert('Expense created successfully!');
        setShowAddExpense(false);
        setExpenseFormData({
          description: '',
          amount: '',
          paidById: '',
          splitBetween: []
        });
        fetchGroups(); // Refresh to update balances
      } else {
        alert('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSplitToggle = (userId) => {
    setExpenseFormData(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(userId)
        ? prev.splitBetween.filter(id => id !== userId)
        : [...prev.splitBetween, userId]
    }));
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
    // The backend balance calculation already accounts for settlements
    // So we can just use the backend API response directly
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
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                fetchGroups();
                loadGroupBalancesAndExpenses();
              }}
              disabled={loading || loadingBalances}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh balances from database"
            >
              <RefreshCw className={`w-5 h-5 ${(loading || loadingBalances) ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Group</span>
            </button>
          </div>
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setExpenseFormData({
                              description: '',
                              amount: '',
                              paidById: currentUser.id,
                              splitBetween: group.members?.map(m => m.id) || []
                            });
                            setShowAddExpense(true);
                          }}
                          className="text-gray-400 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50"
                          title="Add Expense"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowAddMember(true);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          title="Add Member"
                        >
                          <UserPlus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Delete Group"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
                        <div className={`text-2xl font-bold ${isSettled ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {isSettled ? 'Settled' : formatCurrency(Math.abs(userBalance))}
                        </div>
                        <div className={`text-xs ${isSettled ? 'text-green-600' : userBalance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {isSettled ? 'All Good' : userBalance < 0 ? 'You Owe' : 'You\'re Owed'}
                        </div>
                      </div>
                    </div>

                    {/* Your Balance Status */}
                    <div className={`p-4 rounded-lg mb-4 ${
                      isSettled ? 'bg-green-50 border border-green-200' :
                      userBalance < 0 ? 'bg-red-50 border border-red-200' :
                      'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isSettled ? (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            </div>
                          ) : userBalance < 0 ? (
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
                              userBalance < 0 ? 'text-red-800' :
                              'text-blue-800'
                            }`}>
                              {isSettled ? 'All settled up!' :
                               userBalance < 0 ? `You owe ${formatCurrency(Math.abs(userBalance))}` :
                               `You're owed ${formatCurrency(userBalance)}`}
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
                            <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-2 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{member.name}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm font-medium ${
                                  memberIsSettled ? 'text-green-600' :
                                  memberBalance < 0 ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  {memberIsSettled ? 'Settled' :
                                   memberBalance < 0 ? `Owes ${formatCurrency(Math.abs(memberBalance))}` :
                                   `Owed ${formatCurrency(memberBalance)}`}
                                </span>
                                {member.id !== currentUser.id && (
                                  <button
                                    onClick={() => handleRemoveMember(group.id, member.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                                    title="Remove Member"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
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
                      Invite Members (optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Search for users by name or email. They will receive an invitation to join.
                    </p>
                    
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                      placeholder="Search users by name or email..."
                    />

                    {/* Search Results */}
                    {searchQuery.length >= 2 && (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 mb-2">
                        {isSearching ? (
                          <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>
                        ) : searchResults.length === 0 ? (
                          <div className="text-center py-4 text-gray-500 text-sm">No users found</div>
                        ) : (
                          searchResults.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleMemberToggle(user.id)}
                              className="w-full flex items-center space-x-3 py-2 px-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              <Plus className="w-4 h-4 text-blue-500" />
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      {formData.memberIds.length} user(s) will receive invitation(s)
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Invite Member to {selectedGroup.name}</h2>
              <p className="text-sm text-gray-600 mb-4">
                Search for a user to send them a group invitation
              </p>

              <input
                type="text"
                value={addMemberSearchQuery}
                onChange={(e) => setAddMemberSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                placeholder="Search users by name or email..."
              />

              <div className="max-h-60 overflow-y-auto mb-4">
                {addMemberSearchQuery.length < 4 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Type at least 4 characters to search
                  </p>
                ) : addMemberSearchResults.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No users found
                  </p>
                ) : (
                  addMemberSearchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg mb-2 hover:bg-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(user.id)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:from-green-600 hover:to-green-700"
                      >
                        Invite
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setAddMemberSearchQuery('');
                    setAddMemberSearchResults([]);
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && selectedGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Expense to {selectedGroup.name}</h2>
              
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Dinner at restaurant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({...expenseFormData, amount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paid By *
                  </label>
                  <select
                    required
                    value={expenseFormData.paidById}
                    onChange={(e) => setExpenseFormData({...expenseFormData, paidById: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select who paid</option>
                    {selectedGroup.members?.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split Between * (Select at least one)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 rounded-lg p-3">
                    {selectedGroup.members?.map(member => (
                      <label key={member.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={expenseFormData.splitBetween.includes(member.id)}
                          onChange={() => handleExpenseSplitToggle(member.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {expenseFormData.splitBetween.length > 0 
                      ? `Split among ${expenseFormData.splitBetween.length} member(s): ₹${expenseFormData.amount ? (parseFloat(expenseFormData.amount) / expenseFormData.splitBetween.length).toFixed(2) : '0.00'} per person`
                      : 'Select members to split this expense'}
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExpense(false);
                      setExpenseFormData({
                        description: '',
                        amount: '',
                        paidById: '',
                        splitBetween: []
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
