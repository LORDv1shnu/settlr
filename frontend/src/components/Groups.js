import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Users, Plus, UserPlus, Settings, DollarSign, Calendar, TrendingUp, TrendingDown, ArrowRight, Trash2, X, RefreshCw, Receipt } from 'lucide-react';

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
  const [error, setError] = useState(null);
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

  // Individual operation loading states
  const [deletingGroupId, setDeletingGroupId] = useState(null);
  const [invitingUserId, setInvitingUserId] = useState(null);

  // Refs for cleanup
  const searchTimeoutRef = useRef(null);
  const addMemberSearchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const API_BASE = 'http://localhost:8080/api';

  // Memoized fetchGroups function to prevent infinite loops
  const fetchGroups = useCallback(async () => {
    if (!currentUser?.id) {
      setGroups([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_BASE}/groups/user/${currentUser.id}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
      }

      const groupsData = await response.json();
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching groups:', error);
        setError('Failed to load groups. Please try again.');
        setGroups([]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentUser?.id, API_BASE]);

  // Memoized function to load balances and expenses
  const loadGroupBalancesAndExpenses = useCallback(async () => {
    if (loadingBalances || groups.length === 0) return;

    setLoadingBalances(true);
    const balances = {};
    const expenses = {};

    try {
      await Promise.allSettled(
        groups.map(async (group) => {
          try {
            const [balanceResponse, expenseResponse] = await Promise.all([
              fetch(`${API_BASE}/expenses/group/${group.id}/balances`),
              fetch(`${API_BASE}/expenses/group/${group.id}`)
            ]);

            if (balanceResponse.ok) {
              const balanceData = await balanceResponse.json();
              balances[group.id] = balanceData;
            }

            if (expenseResponse.ok) {
              const expenseData = await expenseResponse.json();
              expenses[group.id] = Array.isArray(expenseData) ? expenseData : [];
            }
          } catch (error) {
            console.error(`Error loading data for group ${group.id}:`, error);
          }
        })
      );

      setGroupBalances(balances);
      setGroupExpenses(expenses);
    } finally {
      setLoadingBalances(false);
    }
  }, [groups, loadingBalances, API_BASE]);

  // Debounced search function
  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`${API_BASE}/users/search?name=${encodeURIComponent(trimmedQuery)}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const usersData = await response.json();
      const filtered = Array.isArray(usersData)
        ? usersData.filter(user =>
            user.id !== currentUser?.id && !formData.memberIds.includes(user.id)
          )
        : [];
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentUser?.id, formData.memberIds, API_BASE]);

  const searchUsersForAddMember = useCallback(async (query) => {
    if (!query || query.trim().length < 2 || !selectedGroup) {
      setAddMemberSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/search?name=${encodeURIComponent(query.trim())}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const usersData = await response.json();
      const memberIds = selectedGroup.members?.map(m => m.id) || [];
      const filtered = Array.isArray(usersData)
        ? usersData.filter(user => !memberIds.includes(user.id))
        : [];
      setAddMemberSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users for add member:', error);
      setAddMemberSearchResults([]);
    }
  }, [selectedGroup, API_BASE]);

  // Effect for initial data loading
  useEffect(() => {
    if (currentUser?.id) {
      fetchGroups();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentUser?.id, fetchGroups]);

  // Effect for loading balances and expenses (only when groups change)
  useEffect(() => {
    if (groups.length > 0) {
      loadGroupBalancesAndExpenses();
    }
  }, [groups.length]); // Only depend on length to avoid infinite loops

  // Debounced search effects
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    if (addMemberSearchTimeoutRef.current) {
      clearTimeout(addMemberSearchTimeoutRef.current);
    }

    addMemberSearchTimeoutRef.current = setTimeout(() => {
      searchUsersForAddMember(addMemberSearchQuery);
    }, 300);

    return () => {
      if (addMemberSearchTimeoutRef.current) {
        clearTimeout(addMemberSearchTimeoutRef.current);
      }
    };
  }, [addMemberSearchQuery, searchUsersForAddMember]);

  // Effect for component unmount cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Cleanup all timeouts and abort controllers
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (addMemberSearchTimeoutRef.current) {
        clearTimeout(addMemberSearchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    // Form validation
    if (!formData.name?.trim()) {
      alert('Please enter a group name');
      return;
    }

    if (formData.name.trim().length < 3) {
      alert('Group name must be at least 3 characters long');
      return;
    }

    if (formData.name.trim().length > 50) {
      alert('Group name must be less than 50 characters');
      return;
    }

    if (formData.description && formData.description.length > 200) {
      alert('Description must be less than 200 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Sanitize input data
      const groupData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        memberIds: [currentUser.id] // Only add creator initially
      };

      const response = await fetch(`${API_BASE}/groups?createdByUserId=${currentUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create group: ${response.status} - ${errorText}`);
      }

      const newGroup = await response.json();

      // Send invitations to selected members
      if (formData.memberIds.length > 0) {
        try {
          const invitationResults = await Promise.allSettled(
            formData.memberIds.map(memberId =>
              fetch(`${API_BASE}/invitations/send?groupId=${newGroup.id}&inviterId=${currentUser.id}&inviteeId=${memberId}`, {
                method: 'POST'
              })
            )
          );

          const successCount = invitationResults.filter(result =>
            result.status === 'fulfilled' && result.value.ok
          ).length;

          alert(`Group created successfully! ${successCount} out of ${formData.memberIds.length} invitation(s) sent.`);
        } catch (inviteError) {
          console.error('Error sending invitations:', inviteError);
          alert('Group created successfully, but some invitations failed to send.');
        }
      } else {
        alert('Group created successfully!');
      }

      // Update state and reset form
      await fetchGroups();
      setFormData({ name: '', description: '', memberIds: [] });
      setSearchQuery('');
      setSearchResults([]);
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      setError(error.message);
      alert(`Failed to create group: ${error.message}`);
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
      setInvitingUserId(userId); // Set loading state for inviting user
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
    } finally {
      setInvitingUserId(null); // Reset loading state
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingGroupId(groupId); // Set loading state for deleting group
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
    } finally {
      setDeletingGroupId(null); // Reset loading state
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
    
    // Enhanced form validation
    if (!expenseFormData.description?.trim()) {
      alert('Please enter a description for the expense');
      return;
    }

    if (expenseFormData.description.trim().length < 3) {
      alert('Description must be at least 3 characters long');
      return;
    }

    if (expenseFormData.description.trim().length > 100) {
      alert('Description must be less than 100 characters');
      return;
    }

    const amount = parseFloat(expenseFormData.amount);
    if (!expenseFormData.amount || isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (amount > 1000000) {
      alert('Amount cannot exceed ₹10,00,000');
      return;
    }

    if (!expenseFormData.paidById) {
      alert('Please select who paid for the expense');
      return;
    }

    if (expenseFormData.splitBetween.length === 0) {
      alert('Please select at least one person to split the expense with');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const expenseData = {
        description: expenseFormData.description.trim(),
        amount: amount,
        paidById: parseInt(expenseFormData.paidById),
        groupId: selectedGroup.id,
        splitBetween: expenseFormData.splitBetween.map(id => parseInt(id))
      };

      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create expense: ${response.status} - ${errorText}`);
      }

      alert('Expense created successfully!');
      setShowAddExpense(false);
      setExpenseFormData({
        description: '',
        amount: '',
        paidById: '',
        splitBetween: []
      });

      // Refresh data to update balances
      await Promise.all([fetchGroups(), loadGroupBalancesAndExpenses()]);
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error.message);
      alert(`Failed to create expense: ${error.message}`);
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

  // Enhanced utility functions with better error handling
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Recently';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0.00';
    }

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(amount));
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `₹${Number(amount).toFixed(2)}`;
    }
  }, []);

  const getUserBalance = useCallback((groupId, userId) => {
    if (!groupId || !userId) return 0;

    try {
      const balance = groupBalances[groupId];
      if (!balance || !balance.userBalances) return 0;

      const userBalance = balance.userBalances[userId];
      return typeof userBalance === 'number' ? userBalance : 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }, [groupBalances]);

  const getGroupTotalExpenses = useCallback((groupId) => {
    if (!groupId) return 0;

    try {
      const balance = groupBalances[groupId];
      const total = balance?.totalExpenses;
      return typeof total === 'number' ? total : 0;
    } catch (error) {
      console.error('Error getting group total expenses:', error);
      return 0;
    }
  }, [groupBalances]);

  const getGroupExpenseCount = useCallback((groupId) => {
    if (!groupId) return 0;

    try {
      const expenses = groupExpenses[groupId];
      return Array.isArray(expenses) ? expenses.length : 0;
    } catch (error) {
      console.error('Error getting group expense count:', error);
      return 0;
    }
  }, [groupExpenses]);

  // Early return for invalid user
  if (!currentUser?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Please log in to view your groups.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Groups</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your expense groups and track balances
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  fetchGroups();
                  loadGroupBalancesAndExpenses();
                }}
                disabled={loading || loadingBalances}
                className="bg-white text-gray-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${(loading || loadingBalances) ? 'animate-soft-pulse' : ''}`} />
                <span className="text-sm sm:text-base">Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Create Group</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="animate-breathe rounded-full h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 border-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading groups...</p>
          </div>
        )}

        {/* Groups Grid */}
        {!loading && groups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {groups.map((group) => {
              const userBalance = getUserBalance(group.id, currentUser.id);
              const totalExpenses = getGroupTotalExpenses(group.id);
              const expenseCount = getGroupExpenseCount(group.id);
              const isSettled = Math.abs(userBalance) < 0.01;

              return (
                <div key={group.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="p-4 sm:p-6">
                    {/* Group Header */}
                    <div className="flex items-start justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{group.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{group.description}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                            <span className="flex items-center">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {group.members?.length || 0} members
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {group.createdAt ? formatDate(group.createdAt) : 'Recently'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
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
                          className="text-gray-400 hover:text-green-600 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-green-50"
                          title="Add Expense"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setShowAddMember(true);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-blue-50"
                          title="Add Member"
                        >
                          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-red-50"
                          title="Delete Group"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Group Statistics */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{expenseCount}</div>
                        <div className="text-xs text-blue-600">Expenses</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <div className="text-sm sm:text-lg font-bold text-green-600 truncate">{formatCurrency(totalExpenses)}</div>
                        <div className="text-xs text-green-600">Total Spent</div>
                      </div>
                      <div className={`text-center p-2 sm:p-3 rounded-lg ${
                        isSettled ? 'bg-gray-50' : userBalance > 0 ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className={`text-sm sm:text-lg font-bold truncate ${
                          isSettled ? 'text-gray-600' : userBalance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isSettled ? 'Settled' : formatCurrency(Math.abs(userBalance))}
                        </div>
                        <div className={`text-xs ${
                          isSettled ? 'text-gray-600' : userBalance > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isSettled ? 'All Good' : userBalance > 0 ? 'You\'re Owed' : 'You Owe'}
                        </div>
                      </div>
                    </div>

                    {/* Group Members */}
                    <div className="mb-4 sm:mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Members</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.members?.slice(0, 6).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center bg-gray-50 rounded-full px-2 sm:px-3 py-1 sm:py-1.5"
                          >
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-1.5 sm:mr-2">
                              <span className="text-white text-xs font-medium">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-700 truncate max-w-20 sm:max-w-none">
                              {member.name}
                            </span>
                          </div>
                        ))}
                        {group.members?.length > 6 && (
                          <div className="flex items-center bg-gray-100 rounded-full px-2 sm:px-3 py-1 sm:py-1.5">
                            <span className="text-xs sm:text-sm text-gray-500">
                              +{group.members.length - 6} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Expenses */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Recent Expenses</h4>
                      {groupExpenses[group.id]?.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3">
                          {groupExpenses[group.id].slice(0, 3).map((expense) => (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center min-w-0 flex-1 mr-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                  <Receipt className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                    {expense.description}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {expense.paidBy?.name}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                  {formatCurrency(expense.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4 bg-gray-50 rounded-lg">
                          No expenses yet
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && (
          <div className="text-center py-8 sm:py-12">
            <Users className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6">
              Create your first group to start splitting expenses with friends
            </p>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 inline-flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Group</span>
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
                        disabled={invitingUserId === user.id}
                      >
                        {invitingUserId === user.id ? 'Inviting...' : 'Invite'}
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

Groups.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    // Add other user fields as needed
  }).isRequired,
};

export default Groups;
