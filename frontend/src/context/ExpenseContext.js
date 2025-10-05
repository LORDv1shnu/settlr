import React, { createContext, useContext, useState, useCallback } from 'react';

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

  const API_BASE = 'http://localhost:8080/api';

  // User Management
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        return newUser;
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Group Management
  const fetchUserGroups = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (groupData, createdByUserId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups?createdByUserId=${createdByUserId}`, {
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
  }, []);

  const addMemberToGroup = useCallback(async (groupId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedGroup = await response.json();
        setGroups(prev => prev.map(group =>
          group.id === groupId ? updatedGroup : group
        ));
        return updatedGroup;
      } else {
        throw new Error('Failed to add member to group');
      }
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Expense Management
  const fetchUserExpenses = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroupExpenses = useCallback(async (groupId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/expenses/group/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching group expenses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExpense = useCallback(async (expenseData) => {
    try {
      setLoading(true);
      console.log('Creating expense with data:', expenseData);

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
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to create expense: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getGroupBalances = useCallback(async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/group/${groupId}/balances`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching group balances:', error);
    }
  }, []);

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
    createUser,
    fetchUserGroups,
    createGroup,
    addMemberToGroup,
    fetchUserExpenses,
    fetchGroupExpenses,
    createExpense,
    getGroupBalances,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};
