import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { TrendingUp, Users, DollarSign, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const SettleUp = () => {
  const { state, actions } = useExpense();
  const [groupBalances, setGroupBalances] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    if (state.currentUser) {
      actions.loadGroups(state.currentUser.id);
    }
  }, [state.currentUser]);

  useEffect(() => {
    const loadBalances = async () => {
      const balances = {};
      for (const group of state.groups) {
        try {
          const groupBalance = await actions.getGroupBalances(group.id);
          balances[group.id] = groupBalance;
        } catch (error) {
          console.error('Error loading balance for group:', group.id);
        }
      }
      setGroupBalances(balances);
    };

    if (state.groups.length > 0) {
      loadBalances();
    }
  }, [state.groups]);

  // Calculate optimal settlements for a group
  const calculateSettlements = (groupId) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return [];

    const settlements = [];
    const balances = { ...balance.userBalances };

    // Get people who owe money (positive balance) and who are owed money (negative balance)
    const debtors = Object.entries(balances).filter(([_, amount]) => amount > 0);
    const creditors = Object.entries(balances).filter(([_, amount]) => amount < 0);

    // Calculate optimal settlements
    for (let [debtor, debtAmount] of debtors) {
      for (let [creditor, creditAmount] of creditors) {
        if (debtAmount > 0 && creditAmount < 0) {
          const settleAmount = Math.min(debtAmount, Math.abs(creditAmount));
          if (settleAmount > 0) {
            settlements.push({
              from: debtor,
              to: creditor,
              amount: settleAmount
            });

            // Update remaining balances
            balances[debtor] -= settleAmount;
            balances[creditor] += settleAmount;
            debtAmount -= settleAmount;
            creditAmount += settleAmount;
          }
        }
      }
    }

    return settlements;
  };

  const getUserBalance = (groupId, userName) => {
    const balance = groupBalances[groupId];
    if (!balance || !balance.userBalances) return 0;
    return balance.userBalances[userName] || 0;
  };

  const getGroupSettlements = (groupId) => {
    return calculateSettlements(groupId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settle Up</h1>
          <p className="text-gray-600">Review balances and settle debts with your friends</p>
        </div>
        <div className="bg-green-100 p-3 rounded-full">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Overall Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Overall Balance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            let totalOwed = 0;
            let totalToReceive = 0;
            let settledGroups = 0;

            state.groups.forEach(group => {
              const userBalance = getUserBalance(group.id, state.currentUser?.name);
              if (userBalance > 0) {
                totalOwed += userBalance;
              } else if (userBalance < 0) {
                totalToReceive += Math.abs(userBalance);
              } else {
                settledGroups++;
              }
            });

            return (
              <>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">You Owe</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalOwed.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">You're Owed</p>
                  <p className="text-2xl font-bold text-green-600">₹{totalToReceive.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Settled Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{settledGroups}</p>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Groups List */}
      {state.groups.length > 0 ? (
        <div className="space-y-4">
          {state.groups.map((group) => {
            const balance = groupBalances[group.id];
            const userBalance = getUserBalance(group.id, state.currentUser?.name);
            const groupSettlements = getGroupSettlements(group.id);
            const userInvolved = groupSettlements.some(s =>
              s.from === state.currentUser?.name || s.to === state.currentUser?.name
            );

            return (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Users size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.members?.length || 0} members • ₹{balance?.totalExpense?.toFixed(2) || '0.00'} total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${userBalance > 0 ? 'text-red-600' : userBalance < 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {userBalance > 0 ? `You owe ₹${userBalance.toFixed(2)}` :
                         userBalance < 0 ? `You're owed ₹${Math.abs(userBalance).toFixed(2)}` :
                         'All settled up!'}
                      </p>
                      {userBalance === 0 && (
                        <div className="flex items-center justify-end text-green-600 text-sm mt-1">
                          <CheckCircle size={16} className="mr-1" />
                          <span>Settled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Balances */}
                  {balance && balance.userBalances && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Member Balances</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(balance.userBalances).map(([userName, userBalance]) => (
                          <div key={userName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className={`font-medium ${userName === state.currentUser?.name ? 'text-green-600' : 'text-gray-900'}`}>
                              {userName} {userName === state.currentUser?.name ? '(You)' : ''}
                            </span>
                            <span className={`text-sm ${userBalance > 0 ? 'text-red-600' : userBalance < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {userBalance > 0 ? `Owes ₹${userBalance.toFixed(2)}` :
                               userBalance < 0 ? `Owed ₹${Math.abs(userBalance).toFixed(2)}` :
                               'Settled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Settlements */}
                  {groupSettlements.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Suggested Settlements</h4>
                      <div className="space-y-3">
                        {groupSettlements.map((settlement, index) => (
                          <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                            settlement.from === state.currentUser?.name || settlement.to === state.currentUser?.name
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">
                                {settlement.from}
                              </span>
                              <ArrowRight size={16} className="text-gray-400" />
                              <span className="font-medium text-gray-900">
                                {settlement.to}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-green-600">
                                ₹{settlement.amount.toFixed(2)}
                              </span>
                              {(settlement.from === state.currentUser?.name || settlement.to === state.currentUser?.name) && (
                                <p className="text-xs text-blue-600 mt-1">You're involved</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group Stats */}
                  <div className="border-t pt-4 mt-4">
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <p className="text-gray-500">Per Person</p>
                        <p className="font-medium">₹{balance?.perPersonShare?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Expenses</p>
                        <p className="font-medium">₹{balance?.totalExpense?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Members</p>
                        <p className="font-medium">{balance?.memberCount || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No groups to settle</h3>
          <p className="text-gray-600 mb-6">Join or create groups to start tracking expenses</p>
        </div>
      )}

      {/* Settlement Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3">💡 Settlement Tips</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Settlements are automatically optimized to minimize the number of transactions</li>
          <li>• You can settle up using UPI, cash, or bank transfers</li>
          <li>• Keep track of payments made outside the app by updating expense records</li>
          <li>• Regular settlements help maintain good relationships with friends</li>
        </ul>
      </div>
    </div>
  );
};

export default SettleUp;
