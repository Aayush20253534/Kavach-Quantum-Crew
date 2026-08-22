import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCreateGroupForTrip, useGroupForTrip, useCreateInvitation } from '../api/groupQueries';

export function CreateGroupPage() {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const navigate = useNavigate();

  const { data: existingGroup, isLoading: groupLoading } = useGroupForTrip(tripId);
  const createGroupMutation = useCreateGroupForTrip();
  const createInvitationMutation = useCreateInvitation();

  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    // If we loaded the page and there's no existing group, auto-create one
    if (tripId && !groupLoading && !existingGroup) {
      createGroupMutation.mutate(tripId);
    }
  }, [tripId, groupLoading, existingGroup, createGroupMutation]);

  const handleGenerateCode = async () => {
    if (!existingGroup?.id) return;
    try {
      const result = await createInvitationMutation.mutateAsync(existingGroup.id);
      setInviteToken(result.token);
    } catch (err) {
      console.error('Failed to create invitation:', err);
    }
  };

  if (!tripId) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border mt-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Request</h2>
        <p>A valid trip ID is required to create a group.</p>
        <button onClick={() => navigate('/tourist/trips/current')} className="mt-4 text-blue-600 underline">
          Go back to current trip
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Group Invite</h1>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto text-center">
        
        {createGroupMutation.isPending || groupLoading ? (
          <p className="text-gray-500">Initializing your group...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Your group is ready! Generate a unique invite token for your friends to join this trip.
            </p>

            {!inviteToken ? (
              <button 
                onClick={handleGenerateCode}
                disabled={createInvitationMutation.isPending}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 w-full"
              >
                {createInvitationMutation.isPending ? 'Generating...' : 'Generate Invite Code (QR placeholder)'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-2">Invite Token</p>
                  <p className="text-3xl font-mono tracking-widest font-bold text-blue-600 break-all">{inviteToken}</p>
                </div>
                <p className="text-sm text-gray-500">
                  (In a real app, this would render a React-QR-Code component)
                </p>
                <button 
                  onClick={() => navigate('/tourist/trips/current')}
                  className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 w-full"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
