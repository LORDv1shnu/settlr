import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { format } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';

function Dashboard() {
  const { expenses, getNetBalance, getSimplifiedBalances, currentUser } = useExpense();
  const netBalance = getNetBalance(currentUser);
  const simplifiedBalances = getSimplifiedBalances();
  
  const recentExpenses = expenses.slice(-5).reverse();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back, {currentUser}!
        </div>
      </div>
      
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">You are owed</p>
              <p className="text-2xl font-bold text-success-600">
                ₹{netBalance.totalOwed.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">You owe</p>
              <p className="text-2xl font-bold text-danger-600">
                ₹{netBalance.totalOwing.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-danger-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-danger-600" />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Balance</p>
              <p className={`text-2xl font-bold ${
                netBalance.net >= 0 ? 'text-success-600' : 'text-danger-600'
              }`}>
                ₹{netBalance.net.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
          {recentExpenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses yet</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.description}</p>
                    <p className="text-sm text-gray-500">
                      {expense.group} • {format(new Date(expense.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {expense.paidBy === currentUser ? 'You paid' : `${expense.paidBy} paid`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Balances */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Balances</h2>
          {simplifiedBalances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All settled up!</p>
          ) : (
            <div className="space-y-3">
              {simplifiedBalances.map((balance, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {balance.from} owes {balance.to}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ₹{balance.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
