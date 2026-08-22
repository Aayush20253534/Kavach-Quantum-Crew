import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJoinGroup } from '../api/groupQueries';

export function JoinGroupPage() {
  const navigate = useNavigate();
  const joinMutation = useJoinGroup();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token.trim()) {
      setError('Please enter a valid invite token.');
      return;
    }

    try {
      await joinMutation.mutateAsync(token.trim());
      navigate('/tourist/trips/current'); // Redirect to the active group trip dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group. Invalid or expired token.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Join a Group</h1>
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
        <p className="text-gray-600 mb-6 text-center">
          Enter the invite token (or scan a QR code) to join your friends' trip.
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter Invite Token" 
              className="w-full border p-3 rounded text-center text-xl font-mono tracking-widest uppercase" 
            />
          </div>

          <button 
            type="submit" 
            disabled={joinMutation.isPending}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {joinMutation.isPending ? "Joining..." : "Join Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
