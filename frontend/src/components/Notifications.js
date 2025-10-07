import React, { useState, useEffect } from 'react';
import { Mail, Check, X, Users, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Notifications = ({ currentUser }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, all

  const API_BASE = 'http://localhost:8080/api';

  useEffect(() => {
    if (currentUser) {
      fetchInvitations();
    }
  }, [currentUser, filter]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending' 
        ? `${API_BASE}/invitations/user/${currentUser.id}/pending`
        : `${API_BASE}/invitations/user/${currentUser.id}`;
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      setProcessingId(invitationId);
      const response = await fetch(`${API_BASE}/invitations/${invitationId}/accept`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh invitations list
        await fetchInvitations();
      } else {
        alert('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId) => {
    try {
      setProcessingId(invitationId);
      const response = await fetch(`${API_BASE}/invitations/${invitationId}/reject`, {
        method: 'POST'
      });

      if (response.ok) {
        // Refresh invitations list
        await fetchInvitations();
      } else {
        alert('Failed to reject invitation');
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      alert('Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = invitations.filter(inv => inv.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {pendingCount > 0 ? `${pendingCount} pending invitation${pendingCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All History
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {invitations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center">
              <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-sm sm:text-base text-gray-500">
                {filter === 'pending'
                  ? "You don't have any pending invitations"
                  : "No invitations found"
                }
              </p>
            </div>
          ) : (
            invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 transition-all duration-200 hover:shadow-xl ${
                  invitation.status === 'PENDING' ? 'ring-2 ring-blue-100' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      invitation.status === 'PENDING'
                        ? 'bg-blue-100'
                        : invitation.status === 'ACCEPTED'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {invitation.status === 'PENDING' && <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
                      {invitation.status === 'ACCEPTED' && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
                      {invitation.status === 'REJECTED' && <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                        Group Invitation: {invitation.groupName}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-2 truncate">
                        Invited by <span className="font-medium">{invitation.inviterName}</span>
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {formatDate(invitation.createdAt)}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invitation.status === 'PENDING'
                            ? 'bg-blue-100 text-blue-800'
                            : invitation.status === 'ACCEPTED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invitation.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {invitation.status === 'PENDING' && (
                    <div className="flex space-x-2 sm:space-x-3 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base font-medium transition-colors flex items-center justify-center min-w-20"
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Accept</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(invitation.id)}
                        disabled={processingId === invitation.id}
                        className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base font-medium transition-colors flex items-center justify-center min-w-20"
                      >
                        {processingId === invitation.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Reject</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Info for Accepted/Rejected */}
                {invitation.status !== 'PENDING' && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {invitation.status === 'ACCEPTED' && 'You joined this group'}
                      {invitation.status === 'REJECTED' && 'You declined this invitation'}
                      {invitation.respondedAt && ` on ${formatDate(invitation.respondedAt)}`}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Help Text */}
          {filter === 'pending' && pendingCount > 0 && (
            <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
              <h3 className="text-sm sm:text-base font-medium text-blue-900 mb-2">Need help deciding?</h3>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Accepting will add you to the group and let you participate in expense splitting</li>
                <li>• You can leave a group anytime from the Groups page</li>
                <li>• Rejecting won't notify the inviter, but they can send another invitation</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
