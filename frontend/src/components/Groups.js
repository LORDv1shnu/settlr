import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Plus, Users, Trash2, X } from 'lucide-react';

function Groups() {
  const { groups, addGroup } = useExpense();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    members: ['You'],
    color: '#3b82f6'
  });
  
  const colors = [
    '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
  ];
  
  const handleAddMember = () => {
    setNewGroup(prev => ({
      ...prev,
      members: [...prev.members, '']
    }));
  };
  
  const handleMemberChange = (index, value) => {
    setNewGroup(prev => ({
      ...prev,
      members: prev.members.map((member, i) => i === index ? value : member)
    }));
  };
  
  const handleRemoveMember = (index) => {
    setNewGroup(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newGroup.name.trim()) return;
    
    const group = {
      ...newGroup,
      id: Date.now(),
      members: newGroup.members.filter(member => member.trim() !== '')
    };
    
    addGroup(group);
    setNewGroup({
      name: '',
      members: ['You'],
      color: '#3b82f6'
    });
    setShowAddForm(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-2">Manage your expense groups</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Group</span>
        </button>
      </div>
      
      {/* Add Group Form */}
      {showAddForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Group</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="e.g., College Friends, Mumbai Trip, Office Lunch"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Members
              </label>
              <div className="space-y-2">
                {newGroup.members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Member name"
                      required
                    />
                    {newGroup.members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(index)}
                        className="text-danger-600 hover:text-danger-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Add member
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newGroup.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div key={group.id} className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: group.color }}
              >
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500">{group.members.length} members</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {group.members.map(member => (
                <div key={member} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">{member}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 mb-4">Create your first group to start splitting expenses</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Create Group
          </button>
        </div>
      )}
    </div>
  );
}

export default Groups;
