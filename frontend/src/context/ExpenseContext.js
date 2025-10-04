import React, { createContext, useContext, useReducer } from 'react';

const ExpenseContext = createContext();

const initialState = {
  expenses: [
    {
      id: 1,
      description: 'Dinner at Paradise Biryani',
      amount: 1200,
      paidBy: 'Rahul',
      group: 'College Friends',
      splitBetween: ['You', 'Rahul', 'Priya', 'Arjun'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      description: 'Ola cab to airport',
      amount: 450,
      paidBy: 'You',
      group: 'Mumbai Trip',
      splitBetween: ['You', 'Sneha', 'Vikram'],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      description: 'Movie tickets at PVR',
      amount: 800,
      paidBy: 'Priya',
      group: 'College Friends',
      splitBetween: ['You', 'Rahul', 'Priya', 'Arjun'],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  groups: [
    {
      id: 1,
      name: 'College Friends',
      members: ['You', 'Rahul', 'Priya', 'Arjun'],
      color: '#3b82f6'
    },
    {
      id: 2,
      name: 'Mumbai Trip',
      members: ['You', 'Sneha', 'Vikram'],
      color: '#22c55e'
    },
    {
      id: 3,
      name: 'Office Lunch',
      members: ['You', 'Deepak', 'Kavya', 'Rohit', 'Ananya'],
      color: '#f59e0b'
    }
  ],
  currentUser: 'You',
  balances: {
    'You': {
      'Rahul': 300,  // You owe Rahul ₹300 (from biryani dinner)
      'Sneha': 150,  // You owe Sneha ₹150 (from cab)
      'Vikram': 150  // You owe Vikram ₹150 (from cab)
    },
    'Priya': {
      'You': 200,    // Priya owes you ₹200 (from movie tickets)
      'Rahul': 300   // Priya owes Rahul ₹300 (from biryani dinner)
    },
    'Arjun': {
      'Rahul': 300   // Arjun owes Rahul ₹300 (from biryani dinner)
    }
  }
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'ADD_EXPENSE':
      const newExpense = {
        id: Date.now(),
        ...action.payload,
        createdAt: new Date().toISOString()
      };
      
      // Calculate new balances
      const updatedBalances = { ...state.balances };
      const { amount, paidBy, splitBetween } = action.payload;
      const splitAmount = amount / splitBetween.length;
      
      // Update balances for each person
      splitBetween.forEach(person => {
        if (!updatedBalances[person]) {
          updatedBalances[person] = {};
        }
        if (!updatedBalances[person][paidBy]) {
          updatedBalances[person][paidBy] = 0;
        }
        if (!updatedBalances[paidBy]) {
          updatedBalances[paidBy] = {};
        }
        if (!updatedBalances[paidBy][person]) {
          updatedBalances[paidBy][person] = 0;
        }
        
        if (person !== paidBy) {
          // Person owes the person who paid
          updatedBalances[person][paidBy] = (updatedBalances[person][paidBy] || 0) + splitAmount;
        }
      });
      
      return {
        ...state,
        expenses: [...state.expenses, newExpense],
        balances: updatedBalances
      };
      
    case 'SETTLE_UP':
      const { from, to, amount: settleAmount } = action.payload;
      const settledBalances = { ...state.balances };
      
      if (settledBalances[from] && settledBalances[from][to]) {
        settledBalances[from][to] -= settleAmount;
        if (settledBalances[from][to] <= 0) {
          delete settledBalances[from][to];
        }
      }
      
      if (settledBalances[to] && settledBalances[to][from]) {
        settledBalances[to][from] += settleAmount;
        if (settledBalances[to][from] <= 0) {
          delete settledBalances[to][from];
        }
      }
      
      return {
        ...state,
        balances: settledBalances
      };
      
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, action.payload]
      };
      
    default:
      return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  
  const addExpense = (expense) => {
    dispatch({ type: 'ADD_EXPENSE', payload: expense });
  };
  
  const settleUp = (from, to, amount) => {
    dispatch({ type: 'SETTLE_UP', payload: { from, to, amount } });
  };
  
  const addGroup = (group) => {
    dispatch({ type: 'ADD_GROUP', payload: group });
  };
  
  const getNetBalance = (person) => {
    const balances = state.balances[person] || {};
    let totalOwed = 0;
    let totalOwing = 0;
    
    // Check what this person owes to others
    Object.entries(balances).forEach(([otherPerson, amount]) => {
      if (amount > 0) {
        totalOwing += amount;  // This person owes money
      }
    });
    
    // Check what others owe to this person
    Object.entries(state.balances).forEach(([otherPerson, otherBalances]) => {
      if (otherPerson !== person && otherBalances[person]) {
        totalOwed += otherBalances[person];  // Others owe this person money
      }
    });
    
    return { totalOwed, totalOwing, net: totalOwed - totalOwing };
  };
  
  const getSimplifiedBalances = () => {
    const simplified = [];
    const processed = new Set();
    
    Object.entries(state.balances).forEach(([person, balances]) => {
      Object.entries(balances).forEach(([otherPerson, amount]) => {
        const key = [person, otherPerson].sort().join('-');
        if (!processed.has(key) && amount !== 0) {
          simplified.push({
            from: person,  // person owes
            to: otherPerson,  // to otherPerson
            amount: Math.abs(amount)
          });
          processed.add(key);
        }
      });
    });
    
    return simplified;
  };
  
  return (
    <ExpenseContext.Provider value={{
      ...state,
      addExpense,
      settleUp,
      addGroup,
      getNetBalance,
      getSimplifiedBalances
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
