import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { Receipt, Users, DollarSign, FileText, Tag } from 'lucide-react';

const AddExpense = () => {
  const { state, actions } = useExpense();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    notes: '',
    groupId: '',
    paidById: state.currentUser?.id || ''
  });
  const [errors, setErrors] = useState({});

  const categories = [
    'Food', 'Transportation', 'Accommodation', 'Entertainment',
    'Shopping', 'Bills', 'Healthcare', 'Education', 'Other'
  ];

  useEffect(() => {
    if (state.currentUser) {
      actions.loadGroups(state.currentUser.id);
      setFormData(prev => ({ ...prev, paidById: state.currentUser.id }));
    }
  }, [state.currentUser]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.groupId) {
      newErrors.groupId = 'Please select a group';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const selectedGroup = state.groups.find(g => g.id === parseInt(formData.groupId));
      const paidByUser = selectedGroup?.members?.find(m => m.id === parseInt(formData.paidById));

      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        notes: formData.notes,
        paidBy: {
          id: parseInt(formData.paidById),
          name: paidByUser?.name || state.currentUser?.name,
          email: paidByUser?.email || state.currentUser?.email
        },
        group: {
          id: parseInt(formData.groupId),
          name: selectedGroup?.name
        }
      };

      await actions.createExpense(expenseData);

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: 'Food',
        notes: '',
        groupId: '',
        paidById: state.currentUser?.id || ''
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create expense:', error);
      setErrors({ submit: 'Failed to create expense. Please try again.' });
    }
  };

  const selectedGroup = state.groups.find(g => g.id === parseInt(formData.groupId));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <Receipt className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
            <p className="text-gray-600">Record a new shared expense</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Dinner at restaurant, Uber ride, Groceries"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign size={16} className="inline mr-1" />
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag size={16} className="inline mr-1" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-1" />
              Group
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({...formData, groupId: e.target.value})}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.groupId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a group</option>
              {state.groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.members?.length || 0} members)
                </option>
              ))}
            </select>
            {errors.groupId && (
              <p className="text-red-500 text-sm mt-1">{errors.groupId}</p>
            )}
          </div>

          {/* Paid By */}
          {selectedGroup && selectedGroup.members && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid by
              </label>
              <select
                value={formData.paidById}
                onChange={(e) => setFormData({...formData, paidById: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {selectedGroup.members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === state.currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Additional details or context"
              rows={3}
            />
          </div>

          {/* Split Preview */}
          {selectedGroup && formData.amount && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Split Preview</h3>
              <p className="text-sm text-gray-600 mb-2">
                Total: ₹{parseFloat(formData.amount || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Split equally among {selectedGroup.members?.length || 0} members:
                <span className="font-medium ml-1">
                  ₹{(parseFloat(formData.amount || 0) / (selectedGroup.members?.length || 1)).toFixed(2)} per person
                </span>
              </p>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={state.loading}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Expenses are automatically split equally among all group members</li>
            <li>• You can change who paid for the expense if it wasn't you</li>
            <li>• Categories help you track spending patterns</li>
            <li>• Add notes for receipts or additional context</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
