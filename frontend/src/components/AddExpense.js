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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Add New Expense</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Split an expense with your group members
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-red-800 text-sm sm:text-base">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-green-800 text-sm sm:text-base">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="e.g., Dinner at restaurant, Uber ride, Groceries"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="0.00"
                required
              />
            </div>

            {/* Group Selection */}
            {!selectedGroup && (
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group *
                </label>
                <select
                  id="groupId"
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleGroupChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  required
                >
                  <option value="">Choose a group</option>
                  {groups?.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paid By */}
            <div>
              <label htmlFor="paidById" className="block text-sm font-medium text-gray-700 mb-2">
                Paid By *
              </label>
              <select
                id="paidById"
                name="paidById"
                value={formData.paidById}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              >
                <option value="">Select who paid</option>
                {(selectedGroup || currentSelectedGroup)?.members?.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === currentUser?.id ? ' (You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Between */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Split Between * (Select at least one)
              </label>
              <div className="max-h-48 sm:max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                {(selectedGroup || currentSelectedGroup)?.members?.map(member => (
                  <label key={member.id} className="flex items-center space-x-3 p-2 sm:p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm sm:text-base text-gray-900 truncate block">
                          {member.name} {member.id === currentUser?.id ? ' (You)' : ''}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 truncate block">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Split Summary */}
              {selectedMembers.length > 0 && formData.amount && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm sm:text-base text-blue-800 font-medium">
                    Split among {selectedMembers.length} member(s):
                    <span className="ml-2 font-bold">
                      ₹{(parseFloat(formData.amount) / selectedMembers.length).toFixed(2)} per person
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 mt-1">
                    Total: ₹{parseFloat(formData.amount).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium transition-all duration-200 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </span>
                ) : 'Add Expense'}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full sm:flex-1 bg-gray-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 font-medium transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2">How it works:</h3>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              <li>• Enter the expense description and total amount</li>
              <li>• Select who paid for the expense</li>
              <li>• Choose which group members should split the cost</li>
              <li>• The amount will be divided equally among selected members</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
