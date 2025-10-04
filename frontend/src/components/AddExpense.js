import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';

function AddExpense() {
  const { groups, currentUser, addExpense } = useExpense();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidBy: currentUser,
    group: groups[0]?.name || '',
    splitBetween: [currentUser]
  });
  
  const [errors, setErrors] = useState({});
  
  const selectedGroup = groups.find(g => g.name === formData.group);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleSplitChange = (member, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        splitBetween: [...prev.splitBetween, member]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        splitBetween: prev.splitBetween.filter(m => m !== member)
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.group) {
      newErrors.group = 'Please select a group';
    }
    
    if (formData.splitBetween.length === 0) {
      newErrors.splitBetween = 'At least one person must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const expense = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    addExpense(expense);
    navigate('/');
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-600 mt-2">Split a new expense with your friends</p>
      </div>
      
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={`input-field ${errors.description ? 'border-danger-500' : ''}`}
            placeholder="What was this expense for?"
          />
          {errors.description && (
            <p className="text-danger-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`input-field pl-8 ${errors.amount ? 'border-danger-500' : ''}`}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {errors.amount && (
            <p className="text-danger-600 text-sm mt-1">{errors.amount}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
            Paid by
          </label>
          <select
            id="paidBy"
            name="paidBy"
            value={formData.paidBy}
            onChange={handleInputChange}
            className="input-field"
          >
            {selectedGroup?.members.map(member => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
            Group
          </label>
          <select
            id="group"
            name="group"
            value={formData.group}
            onChange={handleInputChange}
            className={`input-field ${errors.group ? 'border-danger-500' : ''}`}
          >
            <option value="">Select a group</option>
            {groups.map(group => (
              <option key={group.id} value={group.name}>{group.name}</option>
            ))}
          </select>
          {errors.group && (
            <p className="text-danger-600 text-sm mt-1">{errors.group}</p>
          )}
        </div>
        
        {selectedGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Split between
            </label>
            <div className="space-y-2">
              {selectedGroup.members.map(member => (
                <label key={member} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.splitBetween.includes(member)}
                    onChange={(e) => handleSplitChange(member, e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-gray-900">{member}</span>
                </label>
              ))}
            </div>
            {errors.splitBetween && (
              <p className="text-danger-600 text-sm mt-1">{errors.splitBetween}</p>
            )}
          </div>
        )}
        
        {formData.amount && formData.splitBetween.length > 0 && (
          <div className="bg-primary-50 p-4 rounded-lg">
            <h3 className="font-medium text-primary-900 mb-2">Split Summary</h3>
            <p className="text-primary-700">
              Each person pays: <span className="font-semibold">
                ₹{(parseFloat(formData.amount) / formData.splitBetween.length).toFixed(2)}
              </span>
            </p>
          </div>
        )}
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            Add Expense
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddExpense;
