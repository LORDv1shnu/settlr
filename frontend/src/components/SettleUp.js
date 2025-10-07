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
  const [animatingGroup, setAnimatingGroup] = useState(null);

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

  const handleGroupSelect = async (group) => {
    // Add animation state to prevent multiple clicks
    if (animatingGroup === group.id || loading) return;

    setAnimatingGroup(group.id);

    // Add a small delay for visual feedback
    setTimeout(() => {
      setSelectedGroup(group);
      fetchGroupExpenses(group.id);
      setAnimatingGroup(null);
    }, 150);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="animate-breathe rounded-full h-12 w-12 bg-blue-100 border-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading groups...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Settle Up</h1>
          </div>

          {!selectedGroup ? (
            <div className="animate-fadeIn">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">Select a Group to Settle</h2>
              {groups.length === 0 ? (
                <div className="text-center py-8 sm:py-12 animate-slideIn">
                  <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 px-4">No groups found. Create a group first to start settling expenses.</p>
                </div>
              ) : (
                <div className="responsive-grid animate-slideIn">
                  {groups.map((group, index) => (
                    <div
                      key={group.id}
                      onClick={() => handleGroupSelect(group)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleGroupSelect(group);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Select group ${group.name}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className={`
                        bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white
                        cursor-pointer shadow-lg transition-all duration-300 ease-out
                        hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:-translate-y-1
                        focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50
                        active:scale-95 touch-manipulation animate-fadeIn
                        ${animatingGroup === group.id ? 'animate-pulse scale-95' : ''}
                        ${processing ? 'pointer-events-none opacity-75' : ''}
                      `}
                    >
                      <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-1">{group.name}</h3>
                      <p className="text-blue-100 text-xs sm:text-sm mb-3 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-blue-200">
                          {group.members?.length || 0} members
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-200 opacity-70" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-slideIn">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-blue-600 hover:text-blue-700 text-sm sm:text-base"
                  >
                    ← Back to groups
                  </button>
                  <div className="text-sm sm:text-base text-gray-500">|</div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{selectedGroup.name}</h2>
                </div>
                <button
                  onClick={() => fetchGroupExpenses(selectedGroup.id)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-soft-pulse rounded-full h-4 w-4 bg-white bg-opacity-30 mr-2"></div>
                      Loading...
                    </>
                  ) : 'Refresh'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-breathe rounded-full h-8 w-8 sm:h-12 sm:w-12 bg-blue-100 border-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm sm:text-base">Calculating balances...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Pending Settlements */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Pending Settlements</h3>
                    {pendingSettlements.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-4" />
                        <p className="text-green-600 font-medium text-sm sm:text-base">All settled up! 🎉</p>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">No pending settlements in this group</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {pendingSettlements.map((settlement, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <span className="text-red-600 text-xs sm:text-sm font-semibold">
                                    {settlement.from.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                    {settlement.from}
                                  </span>
                                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                    {settlement.to}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3 sm:justify-end">
                                <div className="text-lg sm:text-xl font-bold text-red-600">
                                  {formatCurrency(settlement.amount)}
                                </div>
                                <button
                                  onClick={() => markAsSettled(settlement)}
                                  disabled={processing}
                                  className="bg-green-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs sm:text-sm font-medium flex-shrink-0"
                                >
                                  {processing ? 'Processing...' : 'Mark Paid'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Settlement History */}
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Settlement History</h3>
                    {existingSettlements.length === 0 ? (
                      <div className="text-center py-6 sm:py-8">
                        <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm sm:text-base">No settlements yet</p>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">Settlement history will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                        {existingSettlements
                          .sort((a, b) => new Date(b.settledAt) - new Date(a.settledAt))
                          .map((settlement, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                        {settlement.fromUserName}
                                      </span>
                                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                      <span className="text-sm sm:text-base font-medium text-gray-800 truncate">
                                        {settlement.toUserName}
                                      </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                      {formatDate(settlement.settledAt)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-base sm:text-lg font-bold text-green-600 flex-shrink-0">
                                  {formatCurrency(settlement.amount)}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
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
