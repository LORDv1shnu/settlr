import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';

const AddExpense = ({ selectedGroup, onClose, onExpenseAdded, currentUser }) => {
  const {
    createExpense,
    fetchUsers,
    users,
    groups,
    fetchUserGroups,
    fetchUserExpenses,
    loading
  } = useExpense();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidById: currentUser?.id || '',
    groupId: selectedGroup?.id || '',
    splitBetween: []
  });

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentSelectedGroup, setCurrentSelectedGroup] = useState(selectedGroup);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Load initial data only once
  useEffect(() => {
    if (!hasLoadedInitialData) {
      const loadData = async () => {
        try {
          await fetchUsers();
          if (currentUser && !selectedGroup) {
            await fetchUserGroups(currentUser.id);
          }
        } catch (error) {
          console.error('Error loading initial data:', error);
        } finally {
          setHasLoadedInitialData(true);
        }
      };

      loadData();
    }
  }, [fetchUsers, fetchUserGroups, currentUser, selectedGroup, hasLoadedInitialData]);

  // Update form when group changes
  useEffect(() => {
    if (selectedGroup || currentSelectedGroup) {
      const group = selectedGroup || currentSelectedGroup;
      setFormData(prev => ({
        ...prev,
        groupId: group.id
      }));
      // Pre-select all group members for splitting
      const memberIds = group.members?.map(member => member.id) || [];
      setSelectedMembers(memberIds);
      setFormData(prev => ({
        ...prev,
        splitBetween: memberIds
      }));
    }
  }, [selectedGroup, currentSelectedGroup]);

  // Set default paidById only if it's empty (initial load)
  useEffect(() => {
    if (currentUser && !formData.paidById) {
      setFormData(prev => ({
        ...prev,
        paidById: currentUser.id
      }));
    }
  }, [currentUser, formData.paidById]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (e) => {
    const groupId = parseInt(e.target.value);
    const group = groups.find(g => g.id === groupId);
    setCurrentSelectedGroup(group);

    setFormData(prev => ({
      ...prev,
      groupId: groupId,
      splitBetween: group?.members?.map(member => member.id) || []
    }));
    setSelectedMembers(group?.members?.map(member => member.id) || []);
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];

      setFormData(prevForm => ({
        ...prevForm,
        splitBetween: newSelection
      }));

      return newSelection;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.paidById) {
      setError('Please select who paid');
      return;
    }

    if (!formData.groupId) {
      setError('Group is required');
      return;
    }

    if (formData.splitBetween.length === 0) {
      setError('Please select at least one person to split with');
      return;
    }

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        paidById: parseInt(formData.paidById),
        groupId: parseInt(formData.groupId),
        splitBetween: formData.splitBetween.map(id => parseInt(id))
      };

      console.log('Submitting expense data:', expenseData);

      const newExpense = await createExpense(expenseData);

      // Verify expense was created successfully
      if (newExpense && newExpense.id) {
        console.log('✅ Expense created successfully with ID:', newExpense.id);
        setSuccess(`Expense added successfully! (ID: ${newExpense.id})`);

        // Refresh data to show the new expense
        try {
          console.log('🔄 Refreshing data after expense creation...');

          // Refresh user groups (which should include updated expense data)
          if (currentUser) {
            await fetchUserGroups(currentUser.id);
            await fetchUserExpenses(currentUser.id);
          }

          console.log('✅ Data refresh completed');
        } catch (refreshError) {
          console.error('⚠️ Error refreshing data:', refreshError);
          // Don't fail the whole operation for refresh errors
        }

        // Reset form
        setFormData({
          description: '',
          amount: '',
          paidById: currentUser?.id || '',
          groupId: selectedGroup?.id || currentSelectedGroup?.id || '',
          splitBetween: selectedGroup?.members?.map(member => member.id) || currentSelectedGroup?.members?.map(member => member.id) || []
        });

        // Reset selected members
        const group = selectedGroup || currentSelectedGroup;
        setSelectedMembers(group?.members?.map(member => member.id) || []);

        // Notify parent component if used as modal
        if (onExpenseAdded) {
          onExpenseAdded(newExpense);
        }

        // Auto-close/redirect after success
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000); // Increased timeout to show success message
      } else {
        console.error('❌ Expense creation failed - no ID returned');
        setError('Failed to create expense. Please check the server logs.');
      }

    } catch (error) {
      console.error('❌ Error creating expense:', error);
      setError(error.message || 'Failed to add expense. Please try again.');
    }
  };

  const activeGroup = selectedGroup || currentSelectedGroup;

  // Show loading while initial data is being fetched
  if (!hasLoadedInitialData) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If used as standalone page and no group selected
  if (!selectedGroup && !currentSelectedGroup && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-md mx-auto pt-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <p className="text-gray-600 mb-4">You need to create or join a group first to add expenses.</p>
            <div className="text-center text-gray-500">
              Please go to Groups to create or join a group first.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal mode (when selectedGroup is provided)
  if (selectedGroup) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Add Expense to {selectedGroup.name}</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Lunch at restaurant"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid By *
            </label>
            <select
              name="paidById"
              value={formData.paidById}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select who paid</option>
              {selectedGroup.members?.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {/* Split Between */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split Between * (Select members)
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {selectedGroup.members?.map(member => (
                <label key={member.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {member.name} ({member.email})
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected: {selectedMembers.length} member(s)
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Standalone page mode
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Add New Expense</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Group Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Group *
              </label>
              <select
                name="groupId"
                value={formData.groupId}
                onChange={handleGroupChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Choose a group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Lunch at restaurant"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Show remaining fields only if group is selected */}
            {activeGroup && (
              <>
                {/* Paid By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid By *
                  </label>
                  <select
                    name="paidById"
                    value={formData.paidById}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select who paid</option>
                    {activeGroup.members?.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Split Between */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split Between * (Select members)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {activeGroup.members?.map(member => (
                      <label key={member.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {member.name} ({member.email})
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {selectedMembers.length} member(s)
                  </p>
                </div>
              </>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading || !activeGroup}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={() => {/* Navigation handled by parent component */}}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
