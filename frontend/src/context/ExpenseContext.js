import React, { createContext, useContext, useReducer, useEffect } from 'react';

// API base URL
const API_BASE = 'http://localhost:8080/api';

// Initial state
const initialState = {
  users: [],
  groups: [],
  expenses: [],
  currentUser: null,
  selectedGroup: null,
  loading: false,
  error: null
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USERS: 'SET_USERS',
  SET_GROUPS: 'SET_GROUPS',
  SET_EXPENSES: 'SET_EXPENSES',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP',
  ADD_USER: 'ADD_USER',
  ADD_GROUP: 'ADD_GROUP',
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE'
};

// Reducer
const expenseReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actionTypes.SET_USERS:
      return { ...state, users: action.payload, loading: false };
    case actionTypes.SET_GROUPS:
      return { ...state, groups: action.payload, loading: false };
    case actionTypes.SET_EXPENSES:
      return { ...state, expenses: action.payload, loading: false };
    case actionTypes.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
    case actionTypes.SET_SELECTED_GROUP:
      return { ...state, selectedGroup: action.payload };
    case actionTypes.ADD_USER:
      return { ...state, users: [...state.users, action.payload] };
    case actionTypes.ADD_GROUP:
      return { ...state, groups: [...state.groups, action.payload] };
    case actionTypes.ADD_EXPENSE:
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case actionTypes.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map(exp =>
          exp.id === action.payload.id ? action.payload : exp
        )
      };
    case actionTypes.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter(exp => exp.id !== action.payload)
      };
    default:
      return state;
  }
};

// Create context
const ExpenseContext = createContext();

// API functions
const api = {
  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async createUser(userData) {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  // Groups
  async getGroups() {
    const response = await fetch(`${API_BASE}/groups`);
    if (!response.ok) throw new Error('Failed to fetch groups');
    return response.json();
  },

  async getUserGroups(userId) {
    const response = await fetch(`${API_BASE}/groups/user/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user groups');
    return response.json();
  },

  async createGroup(groupData, createdByUserId) {
    const response = await fetch(`${API_BASE}/groups?createdByUserId=${createdByUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupData)
    });
    if (!response.ok) throw new Error('Failed to create group');
    return response.json();
  },

  async addMemberToGroup(groupId, userId) {
    const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to add member');
    return response.json();
  },

  // Expenses
  async getExpenses() {
    const response = await fetch(`${API_BASE}/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
  },

  async getGroupExpenses(groupId) {
    const response = await fetch(`${API_BASE}/expenses/group/${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch group expenses');
    return response.json();
  },

  async createExpense(expenseData) {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });
    if (!response.ok) throw new Error('Failed to create expense');
    return response.json();
  },

  async getGroupBalances(groupId) {
    const response = await fetch(`${API_BASE}/expenses/group/${groupId}/balances`);
    if (!response.ok) throw new Error('Failed to fetch balances');
    return response.json();
  }
};

// Provider component
export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  // Actions
  const actions = React.useMemo(() => ({
    setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }),

    setCurrentUser: (user) => {
      dispatch({ type: actionTypes.SET_CURRENT_USER, payload: user });
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
    },

    loadUsers: async () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const users = await api.getUsers();
        dispatch({ type: actionTypes.SET_USERS, payload: users });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    },

    loadGroups: async (userId = null) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const groups = userId ? await api.getUserGroups(userId) : await api.getGroups();
        dispatch({ type: actionTypes.SET_GROUPS, payload: groups });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    },

    loadExpenses: async (groupId = null) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const expenses = groupId ? await api.getGroupExpenses(groupId) : await api.getExpenses();
        dispatch({ type: actionTypes.SET_EXPENSES, payload: expenses });
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    },

    createUser: async (userData) => {
      try {
        const user = await api.createUser(userData);
        dispatch({ type: actionTypes.ADD_USER, payload: user });
        return user;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    createGroup: async (groupData, createdByUserId) => {
      try {
        const group = await api.createGroup(groupData, createdByUserId);
        dispatch({ type: actionTypes.ADD_GROUP, payload: group });
        return group;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    createExpense: async (expenseData) => {
      try {
        const expense = await api.createExpense(expenseData);
        dispatch({ type: actionTypes.ADD_EXPENSE, payload: expense });
        return expense;
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    selectGroup: (group) => {
      dispatch({ type: actionTypes.SET_SELECTED_GROUP, payload: group });
    },

    getGroupBalances: async (groupId) => {
      try {
        return await api.getGroupBalances(groupId);
      } catch (error) {
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
        throw error;
      }
    }
  }), []);

  // Load current user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: actionTypes.SET_CURRENT_USER, payload: user });
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  return (
    <ExpenseContext.Provider value={{ state, actions }}>
      {children}
    </ExpenseContext.Provider>
  );
};

// Custom hook
export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within ExpenseProvider');
  }
  return context;
};
