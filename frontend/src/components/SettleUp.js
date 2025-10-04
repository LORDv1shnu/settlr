import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { CreditCard, CheckCircle, ArrowRight } from 'lucide-react';

function SettleUp() {
  const { getSimplifiedBalances, settleUp, currentUser } = useExpense();
  const [settledBalances, setSettledBalances] = useState(new Set());
  
  const balances = getSimplifiedBalances();
  const userBalances = balances.filter(balance => 
    balance.from === currentUser || balance.to === currentUser
  );
  
  const handleSettleUp = (from, to, amount) => {
    settleUp(from, to, amount);
    setSettledBalances(prev => new Set([...prev, `${from}-${to}-${amount}`]));
  };
  
  const isSettled = (from, to, amount) => {
    return settledBalances.has(`${from}-${to}-${amount}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-full">
          <CreditCard className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settle Up</h1>
          <p className="text-gray-600 mt-1">Clear your outstanding balances</p>
        </div>
      </div>
      
      {userBalances.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All settled up!</h3>
          <p className="text-gray-500">
            You don't have any outstanding balances with your friends.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Balances</h2>
            <div className="space-y-4">
              {userBalances.map((balance, index) => {
                const settled = isSettled(balance.from, balance.to, balance.amount);
                const isYouOwing = balance.from === currentUser;
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      settled
                        ? 'bg-success-50 border-success-200'
                        : isYouOwing
                        ? 'bg-danger-50 border-danger-200'
                        : 'bg-success-50 border-success-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          settled
                            ? 'bg-success-100'
                            : isYouOwing
                            ? 'bg-danger-100'
                            : 'bg-success-100'
                        }`}>
                          {settled ? (
                            <CheckCircle className="w-6 h-6 text-success-600" />
                          ) : (
                            <ArrowRight className={`w-6 h-6 ${
                              isYouOwing ? 'text-danger-600' : 'text-success-600'
                            }`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {settled ? (
                              <span className="text-success-600">Settled up!</span>
                            ) : isYouOwing ? (
                              <>You owe <span className="font-semibold">{balance.to}</span></>
                            ) : (
                              <><span className="font-semibold">{balance.from}</span> owes you</>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {settled ? 'Balance cleared' : 'Outstanding balance'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          settled
                            ? 'text-success-600'
                            : isYouOwing
                            ? 'text-danger-600'
                            : 'text-success-600'
                        }`}>
                          ₹{balance.amount.toFixed(2)}
                        </p>
                        {!settled && (
                          <button
                            onClick={() => handleSettleUp(balance.from, balance.to, balance.amount)}
                            className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              isYouOwing
                                ? 'bg-danger-600 hover:bg-danger-700 text-white'
                                : 'bg-success-600 hover:bg-success-700 text-white'
                            }`}
                          >
                            {isYouOwing ? 'Mark as Paid' : 'Mark as Received'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* All Balances */}
          {balances.length > userBalances.length && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Group Balances</h2>
              <div className="space-y-3">
                {balances.map((balance, index) => {
                  const settled = isSettled(balance.from, balance.to, balance.amount);
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        settled ? 'bg-success-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {settled ? (
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        ) : (
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-gray-900">
                          {balance.from} owes {balance.to}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-semibold ${
                          settled ? 'text-success-600' : 'text-gray-900'
                        }`}>
                          ₹{balance.amount.toFixed(2)}
                        </span>
                        {!settled && (balance.from === currentUser || balance.to === currentUser) && (
                          <button
                            onClick={() => handleSettleUp(balance.from, balance.to, balance.amount)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Settle
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SettleUp;
