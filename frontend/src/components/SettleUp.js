import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const SettleUp = ({ currentUser }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [existingSettlements, setExistingSettlements] = useState([]);
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      setLoading(true);
      
      // Fetch expenses
      const expensesResponse = await fetch(`${API_BASE}/expenses/group/${groupId}`);
      if (!expensesResponse.ok) {
        throw new Error('Failed to fetch expenses');
      }
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData);

      // Fetch existing settlements from database
      const settlementsResponse = await fetch(`${API_BASE}/settlements/group/${groupId}`);
      if (!settlementsResponse.ok) {
        throw new Error('Failed to fetch settlements');
      }
      const settlementsData = await settlementsResponse.json();
      setExistingSettlements(settlementsData);

      // Calculate pending settlements (taking into account existing settlements)
      calculatePendingSettlements(expensesData, settlementsData);
    } catch (error) {
      console.error('Error fetching group data:', error);
      alert('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculatePendingSettlements = (expensesData, settlementsData) => {
    console.log('🔍 Starting settlement calculation...');
    console.log('📊 Expenses:', expensesData.length);
    console.log('✅ Existing settlements:', settlementsData.length);

    // Step 1: Calculate gross balances from expenses
    const balances = {};

    // Initialize balances
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

    // Calculate gross balances from expenses
    expensesData.forEach(expense => {
      const totalAmount = expense.amount;
      const splitCount = expense.splitBetweenUsers?.length || 1;
      const amountPerPerson = totalAmount / splitCount;

      console.log(`💰 ${expense.description}: ${totalAmount} ÷ ${splitCount} = ${amountPerPerson} each`);

      // Person who paid gets credited (they paid for others)
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

    console.log('📊 Gross balances (before applying settlements):', balances);

    // Step 2: Apply existing settlements to reduce balances
    // Key insight: When someone pays a settlement, their debt decreases (or credit increases)
    settlementsData.forEach(settlement => {
      const fromUserName = settlement.fromUserName;
      const toUserName = settlement.toUserName;
      const amount = settlement.amount;

      console.log(`💳 Applying settlement: ${fromUserName} paid ${amount} to ${toUserName}`);

      // When fromUser pays toUser:
      // - fromUser's debt decreases (add to their balance, bringing negative closer to 0)
      // - toUser's credit decreases (subtract from their balance, bringing positive closer to 0)
      if (balances[fromUserName] !== undefined) {
        balances[fromUserName] += amount;
        console.log(`  → ${fromUserName} balance: ${balances[fromUserName] - amount} + ${amount} = ${balances[fromUserName]}`);
      }
      if (balances[toUserName] !== undefined) {
        balances[toUserName] -= amount;
        console.log(`  → ${toUserName} balance: ${balances[toUserName] + amount} - ${amount} = ${balances[toUserName]}`);
      }
    });

    console.log('📊 Net balances (after applying settlements):', balances);

    // Step 3: Calculate who still owes whom (pending settlements)
    const creditors = [];
    const debtors = [];

    Object.entries(balances).forEach(([user, balance]) => {
      if (balance > 0.01) {
        creditors.push({ user, amount: balance });
        console.log(`👤 ${user} is owed: ${balance.toFixed(2)}`);
      } else if (balance < -0.01) {
        debtors.push({ user, amount: Math.abs(balance) });
        console.log(`👤 ${user} owes: ${Math.abs(balance).toFixed(2)}`);
      }
    });

    // Step 4: Generate optimal settlement plan
    const pendingSettlements = [];
    
    creditors.forEach(creditor => {
      debtors.forEach(debtor => {
        if (creditor.amount > 0.01 && debtor.amount > 0.01) {
          const settlementAmount = Math.min(creditor.amount, debtor.amount);
          
          pendingSettlements.push({
            from: debtor.user,
            to: creditor.user,
            amount: settlementAmount
          });
          
          console.log(`💸 Settlement needed: ${debtor.user} → ${creditor.user}: ${settlementAmount.toFixed(2)}`);
          
          creditor.amount -= settlementAmount;
          debtor.amount -= settlementAmount;
        }
      });
    });

    console.log('✅ Total pending settlements:', pendingSettlements.length);
    setPendingSettlements(pendingSettlements);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    fetchGroupExpenses(group.id);
  };

  const markAsSettled = async (settlement) => {
    if (!selectedGroup) return;

    try {
      setProcessing(true);

      // Find user IDs
      const fromUser = selectedGroup.members.find(m => m.name === settlement.from);
      const toUser = selectedGroup.members.find(m => m.name === settlement.to);

      if (!fromUser || !toUser) {
        alert('Error: Could not find user information');
        return;
      }

      // Record settlement in database
      const response = await fetch(`${API_BASE}/settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          amount: settlement.amount,
          paymentMethod: 'cash',
          notes: `${settlement.from} paid ${settlement.to}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record settlement');
      }

      console.log('✅ Settlement recorded successfully');
      
      // Refresh the data to show updated balances
      await fetchGroupExpenses(selectedGroup.id);
      
      alert('✅ Settlement recorded successfully!');
    } catch (error) {
      console.error('Error recording settlement:', error);
      alert('❌ Failed to record settlement. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !selectedGroup) {
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
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Settle Up</h1>
          </div>

          {!selectedGroup ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Select a Group to Settle</h2>
              {groups.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No groups found. Create a group first to start settling expenses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                      <p className="text-blue-100 text-sm mb-3">{group.description}</p>
                      <div className="text-xs text-blue-200">
                        {group.members?.length || 0} members
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">
                    {selectedGroup.name}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedGroup.description}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setExpenses([]);
                    setPendingSettlements([]);
                    setExistingSettlements([]);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  ← Back to Groups
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Calculating settlements...</p>
                </div>
              ) : (
                <>
                  {/* Pending Settlements */}
                  {pendingSettlements.length === 0 ? (
                    <div className="text-center py-12 bg-green-50 rounded-xl border-2 border-green-200">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-700 mb-2">All Settled Up! 🎉</h3>
                      <p className="text-green-600">No outstanding balances in this group.</p>
                    </div>
                  ) : (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm mr-2">
                          {pendingSettlements.length}
                        </span>
                        Pending Settlements
                      </h3>
                      <div className="space-y-4">
                        {pendingSettlements.map((settlement, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-6 rounded-r-xl shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                  <ArrowRight className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 mb-1">
                                    <span className="font-bold text-lg">{settlement.from}</span>
                                    <span className="text-gray-600 mx-2">owes</span>
                                    <span className="font-bold text-lg">{settlement.to}</span>
                                  </p>
                                  <p className="text-3xl font-bold text-green-600">
                                    {formatCurrency(settlement.amount)}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => markAsSettled(settlement)}
                                disabled={processing}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processing ? 'Recording...' : 'Mark as Settled'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settlement History */}
                  {existingSettlements.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        Settlement History ({existingSettlements.length})
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="space-y-3">
                          {existingSettlements.slice(0, 5).map(settlement => (
                            <div key={settlement.id} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0">
                              <div>
                                <span className="font-medium text-gray-700">{settlement.fromUserName}</span>
                                <span className="text-gray-500 mx-2">→</span>
                                <span className="font-medium text-gray-700">{settlement.toUserName}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">{formatCurrency(settlement.amount)}</div>
                                <div className="text-gray-400 text-xs">{formatDate(settlement.settledAt)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {existingSettlements.length > 5 && (
                          <p className="text-gray-500 text-sm mt-3 text-center">
                            ...and {existingSettlements.length - 5} more settlements
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  

                  {/* Recent Expenses */}
                  {expenses.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Recent Expenses ({expenses.length})
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="space-y-3">
                          {expenses.slice(0, 5).map(expense => (
                            <div key={expense.id} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0">
                              <div>
                                <div className="font-medium text-gray-800">{expense.description}</div>
                                <div className="text-gray-500 text-xs">
                                  Paid by {expense.paidBy?.name} • Split {expense.splitBetweenUsers?.length} ways
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-800">{formatCurrency(expense.amount)}</div>
                                <div className="text-gray-500 text-xs">{formatCurrency(expense.amountPerPerson)} each</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {expenses.length > 5 && (
                          <p className="text-gray-500 text-sm mt-3 text-center">
                            ...and {expenses.length - 5} more expenses
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettleUp;