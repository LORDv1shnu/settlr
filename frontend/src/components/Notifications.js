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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500">
                {pendingCount > 0 ? `${pendingCount} pending invitation${pendingCount > 1 ? 's' : ''}` : 'No pending invitations'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Invitations List */}
      {invitations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations</h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? "You don't have any pending group invitations" 
              : "You haven't received any invitations yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className={`bg-white rounded-xl shadow-sm p-6 transition-all ${
                invitation.status === 'PENDING' 
                  ? 'border-l-4 border-blue-500' 
                  : 'opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.groupName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Invited by <span className="font-medium text-gray-700">{invitation.inviterName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 ml-13">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(invitation.createdAt)}</span>
                    </div>

                    {invitation.status !== 'PENDING' && (
                      <div className="flex items-center space-x-1">
                        {invitation.status === 'ACCEPTED' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Accepted</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">Rejected</span>
                          </>
                        )}
                        <span className="text-gray-400">• {formatDate(invitation.respondedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {invitation.status === 'PENDING' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      disabled={processingId === invitation.id}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleReject(invitation.id)}
                      disabled={processingId === invitation.id}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
