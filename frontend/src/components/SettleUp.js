import React, { useState, useEffect } from 'react';

const SettleUp = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    if (currentUser) {
      fetchGroups();
    }
  }, [currentUser]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/groups/user/${currentUser.id}`);
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupExpenses = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/group/${groupId}`);
      if (response.ok) {
        const expensesData = await response.json();
        setExpenses(expensesData);
        calculateSettlements(expensesData);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const calculateSettlements = (expensesData) => {
    // Calculate who owes what to whom
    const balances = {};
    const settlements = [];

    // Initialize balances for all users who have expenses
    expensesData.forEach(expense => {
      if (expense.paidBy?.name && !balances[expense.paidBy.name]) {
        balances[expense.paidBy.name] = 0;
      }
      if (expense.splitBetweenUsers) {
        expense.splitBetweenUsers.forEach(user => {
          if (!balances[user.name]) {
            balances[user.name] = 0;
          }
        });
      }
    });

    // Calculate net balances
    expensesData.forEach(expense => {
      const totalAmount = expense.amount;
      const splitCount = expense.splitBetweenUsers?.length || 1;
      const amountPerPerson = totalAmount / splitCount;

      // Person who paid gets credited
      if (expense.paidBy?.name) {
        balances[expense.paidBy.name] += totalAmount - amountPerPerson;
      }

      // Each person in split owes their share
      if (expense.splitBetweenUsers) {
        expense.splitBetweenUsers.forEach(user => {
          if (user.name !== expense.paidBy?.name) {
            balances[user.name] -= amountPerPerson;
          }
        });
      }
    });

    // Generate settlements
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([user, balance]) => {
      if (balance > 0.01) {
        creditors.push({ user, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ user, amount: Math.abs(balance) });
      }
    });

    // Create settlements
    creditors.forEach(creditor => {
      debtors.forEach(debtor => {
        if (creditor.amount > 0 && debtor.amount > 0) {
          const settlementAmount = Math.min(creditor.amount, debtor.amount);
          if (settlementAmount > 0.01) {
            settlements.push({
              from: debtor.user,
              to: creditor.user,
              amount: settlementAmount
            });
            creditor.amount -= settlementAmount;
            debtor.amount -= settlementAmount;
          }
        }
      });
    });

    setSettlements(settlements);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    fetchGroupExpenses(group.id);
  };

  const markAsSettled = async (settlement) => {
    // In a real app, you'd want to record this settlement in the database
    setSettlements(prev => prev.filter(s => s !== settlement));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">💰 Settle Up</h1>

          {!selectedGroup ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a Group to Settle</h2>
              {groups.length === 0 ? (
                <p className="text-gray-500">No groups found. Create a group first to start settling expenses.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                      <p className="text-blue-100 text-sm">{group.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-700">
                  Settlements for: {selectedGroup.name}
                </h2>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setExpenses([]);
                    setSettlements([]);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Groups
                </button>
              </div>

              {settlements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">All Settled Up!</h3>
                  <p className="text-gray-500">No outstanding balances in this group.</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Outstanding Settlements ({settlements.length})
                  </h3>
                  <div className="space-y-4">
                    {settlements.map((settlement, index) => (
                      <div
                        key={index}
                        className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-yellow-600">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-gray-800">
                                <span className="font-semibold">{settlement.from}</span> owes{' '}
                                <span className="font-semibold">{settlement.to}</span>
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(settlement.amount)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => markAsSettled(settlement)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Mark as Settled
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">💡 Settlement Tips</h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Use payment apps like Venmo, PayPal, or Zelle for quick transfers</li>
                      <li>• Take a screenshot of successful payments for your records</li>
                      <li>• Mark settlements as complete only after payment is confirmed</li>
                      <li>• Consider rounding to the nearest dollar for convenience</li>
                    </ul>
                  </div>
                </div>
              )}

              {expenses.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Recent Expenses ({expenses.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      {expenses.slice(0, 5).map(expense => (
                        <div key={expense.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{expense.description}</span>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                            <div className="text-gray-500 text-xs">
                              Paid by {expense.paidBy?.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {expenses.length > 5 && (
                      <p className="text-gray-500 text-sm mt-2">
                        ...and {expenses.length - 5} more expenses
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettleUp;
