import React, { createContext, useContext, useState, useEffect } from 'react';

const ExpenseContext = createContext();

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  // API Base URL
  const API_BASE = 'http://localhost:8080/api';

  // Load data on mount
  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        return data;
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user groups
  const fetchUserGroups = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        return data;
      } else {
        throw new Error('Failed to fetch user groups');
      }
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch all groups
  const fetchAllGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        return data;
      } else {
        throw new Error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch user expenses
  const fetchUserExpenses = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        return data;
      } else {
        throw new Error('Failed to fetch user expenses');
      }
    } catch (error) {
      console.error('Error fetching user expenses:', error);
      setExpenses([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch all expenses
  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        return data;
      } else {
        throw new Error('Failed to fetch expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create expense
  const createExpense = async (expenseData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        const newExpense = await response.json();
        setExpenses(prev => [...prev, newExpense]);
        return newExpense;
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create group
  const createGroup = async (groupData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [...prev, newGroup]);
        return newGroup;
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get group balances
  const getGroupBalances = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/group/${groupId}/balances`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('Failed to get group balances');
      }
    } catch (error) {
      console.error('Error getting group balances:', error);
      throw error;
    }
  };

  // Login user
  const loginUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  // Logout user
  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setUsers([]);
    setGroups([]);
    setExpenses([]);
  };

  const value = {
    // State
    currentUser,
    users,
    groups,
    expenses,
    loading,

    // Actions
    setCurrentUser,
    fetchUsers,
    fetchUserGroups,
    fetchAllGroups,
    fetchUserExpenses,
    fetchAllExpenses,
    createExpense,
    createGroup,
    getGroupBalances,
    loginUser,
    logoutUser,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export default ExpenseContext;
