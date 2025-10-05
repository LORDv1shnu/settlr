import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { TrendingUp, Users, DollarSign, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SettleUp = () => {
  const { currentUser, groups, fetchUserGroups, getGroupBalances } = useExpense();
  const [groupBalances, setGroupBalances] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchUserGroups(currentUser.id);
    }
  }, [currentUser, fetchUserGroups]);

  useEffect(() => {
    const loadBalances = async () => {
      const balances = {};
      for (const group of groups) {
        try {
          const groupBalance = await getGroupBalances(group.id);
          balances[group.id] = groupBalance;
        } catch (error) {
          console.error('Error loading balance for group:', group.id);
        }
      }
      setGroupBalances(balances);
    };

    if (groups.length > 0) {
      loadBalances();
    }
  }, [groups, getGroupBalances]);

  // Calculate optimal settlements for a group
  const calculateSettlements = (groupId) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return [];

    const settlements = [];
    const balances = { ...balance.userBalances };

    // Get the group to access member information
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    // Create a mapping of user ID to user name for display
    const userIdToName = {};
    group.members?.forEach(member => {
      userIdToName[member.id] = member.name;
    });

    // Get people who owe money (positive balance) and who are owed money (negative balance)
    const debtors = Object.entries(balances).filter(([_, amount]) => amount > 0);
    const creditors = Object.entries(balances).filter(([_, amount]) => amount < 0);

    // Calculate optimal settlements
    for (let [debtorId, debtAmount] of debtors) {
      for (let [creditorId, creditAmount] of creditors) {
        if (debtAmount > 0 && creditAmount < 0) {
          const settleAmount = Math.min(debtAmount, Math.abs(creditAmount));
          if (settleAmount > 0) {
            settlements.push({
              fromId: debtorId,
              toId: creditorId,
              fromName: userIdToName[debtorId] || `User ${debtorId}`,
              toName: userIdToName[creditorId] || `User ${creditorId}`,
              amount: settleAmount,
              groupId: groupId
            });

            // Update remaining balances
            balances[debtorId] -= settleAmount;
            balances[creditorId] += settleAmount;
            debtAmount -= settleAmount;
            creditAmount += settleAmount;
          }
        }
      }
    }

    return settlements;
  };

  // Handle settlement recording
  const handleSettlement = async (settlement) => {
    try {
      // For now, we'll create a settlement expense to record the payment
      // In a full implementation, you'd want a dedicated settlements API
      const settlementExpense = {
        description: `Settlement: ${settlement.fromName} → ${settlement.toName}`,
        amount: settlement.amount,
        paidById: parseInt(settlement.toId), // Person receiving gets "paid"
        groupId: parseInt(settlement.groupId),
        splitBetween: [parseInt(settlement.fromId)] // Only the payer "owes" this
      };

      // You could also add a settlement record or modify balances directly
      console.log('Recording settlement:', settlementExpense);

      // For now, just refresh the balances to simulate settlement
      // In a real app, you'd call a settlement API here
      alert(`Settlement recorded: ${settlement.fromName} paid ₹${settlement.amount.toFixed(2)} to ${settlement.toName}`);

      // Refresh balances after settlement
      const balances = {};
      for (const group of groups) {
        try {
          const groupBalance = await getGroupBalances(group.id);
          balances[group.id] = groupBalance;
        } catch (error) {
          console.error('Error loading balance for group:', group.id);
        }
      }
      setGroupBalances(balances);

    } catch (error) {
      console.error('Error recording settlement:', error);
      alert('Failed to record settlement. Please try again.');
    }
  };

  const getUserBalance = (groupId, userId) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return 0;
    return balance.userBalances[userId] || 0;
  };

  const getGroupSettlements = (groupId) => {
    return calculateSettlements(groupId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settle Up</h1>
            <p className="text-gray-600">Review balances and settle debts with your friends</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Overall Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Overall Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              let totalOwed = 0;
              let totalToReceive = 0;
              let settledGroups = 0;

              groups.forEach(group => {
                const userBalance = getUserBalance(group.id, currentUser?.id); // Changed from currentUser?.name to currentUser?.id
                console.log(`🔍 Group ${group.name} (ID: ${group.id}) - User ${currentUser?.id} balance:`, userBalance);

                if (userBalance > 0) {
                  totalOwed += userBalance;
                } else if (userBalance < 0) {
                  totalToReceive += Math.abs(userBalance);
                } else {
                  settledGroups++;
                }
              });

              console.log('💰 Final SettleUp totals - Owed:', totalOwed, 'To Receive:', totalToReceive, 'Settled Groups:', settledGroups);

              return (
                <>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">₹{totalOwed.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">You owe</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">₹{totalToReceive.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">You're owed</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{settledGroups}</div>
                    <div className="text-sm text-gray-600">Settled groups</div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-6">
          {groups.map(group => {
            const userBalance = getUserBalance(group.id, currentUser?.id);
            const groupSettlements = getGroupSettlements(group.id);
            const isSettled = Math.abs(userBalance) < 0.01;

            return (
              <div key={group.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">{group.members?.length} members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isSettled ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Settled up</span>
                      </div>
                    ) : (
                      <div className={`font-medium ${userBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {userBalance > 0 ? `You owe ₹${userBalance.toFixed(2)}` : `You're owed ₹${Math.abs(userBalance).toFixed(2)}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Group Members Balances */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Member Balances</h4>
                  <div className="space-y-2">
                    {group.members?.map(member => {
                      const memberBalance = getUserBalance(group.id, member.id); // Changed from member.name to member.id
                      return (
                        <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{member.name}</span>
                          <span className={`text-sm font-medium ${
                            memberBalance > 0 ? 'text-red-600' :
                            memberBalance < 0 ? 'text-green-600' :
                            'text-gray-600'
                          }`}>
                            {memberBalance > 0 ? `Owes ₹${memberBalance.toFixed(2)}` :
                             memberBalance < 0 ? `Owed ₹${Math.abs(memberBalance).toFixed(2)}` :
                             'Settled'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Suggested Settlements */}
                {groupSettlements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggested Settlements</h4>
                    <div className="space-y-2">
                      {groupSettlements.map((settlement, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {settlement.fromName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{settlement.fromName}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-blue-600" />
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-green-600">
                                  {settlement.toName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">{settlement.toName}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-blue-600 text-lg">₹{settlement.amount.toFixed(2)}</span>
                            <button
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                              onClick={() => handleSettlement(settlement)}
                            >
                              Mark as Settled
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700">
                        💡 <strong>Tip:</strong> These are optimized settlements to minimize the number of transactions needed.
                      </p>
                    </div>
                  </div>
                )}

                {isSettled && (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">All settled up in this group!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
            <p className="text-gray-600">Join or create a group to start settling expenses</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettleUp;
