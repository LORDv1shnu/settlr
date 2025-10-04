import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AddExpense from './components/AddExpense';
import Groups from './components/Groups';
import SettleUp from './components/SettleUp';
import Navigation from './components/Navigation';
import { ExpenseProvider } from './context/ExpenseContext';

function App() {
  return (
    <ExpenseProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-expense" element={<AddExpense />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/settle-up" element={<SettleUp />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ExpenseProvider>
  );
}

export default App;
