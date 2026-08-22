import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';

export function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.verifyEmail({ email, otp });
      
      if (response.accessToken) {
        localStorage.setItem('quantum_access_token', response.accessToken);
        window.location.href = '/tourist/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      await authService.resendVerification({ email });
      setSuccess('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  if (!email) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
        <p className="mb-4 text-red-600">No email provided for verification.</p>
        <button onClick={() => navigate('/login')} className="text-blue-500 underline">Return to Login</button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2">Verify Your Email</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        We sent a 6-digit code to <strong>{email}</strong>
      </p>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input 
            type="text" 
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit OTP" 
            className="w-full border p-2 rounded text-center text-lg tracking-[0.5em]" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || otp.length !== 6}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>
      </form>

      <div className="text-center mt-6 text-sm">
        <button onClick={handleResend} className="text-blue-500 hover:underline">
          Didn't receive the code? Resend
        </button>
      </div>
    </div>
  );
}
