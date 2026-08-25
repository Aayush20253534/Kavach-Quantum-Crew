import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../api/authService';
import { setAuth } from '../store/authSlice';

export function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get initial email from router state, search params, or default
  const initialEmail = location.state?.email || searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);

  // 6 separate digits for an authentic OTP input experience
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(45);

  // Resend cooldown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle digit change with auto-focus next
  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanValue;
    setDigits(newDigits);
    setError('');

    // Move to next input if digit entered
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle full OTP paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const otp = digits.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your registered email address.');
      setIsEditingEmail(true);
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.verifyEmail({
        email: email.trim().toLowerCase(),
        otp,
      });

      const authData = response?.data ?? response;
      const user = authData?.user;
      const accessToken = authData?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Invalid verification response from server.');
      }

      localStorage.setItem('quantum_access_token', accessToken);
      dispatch(setAuth({ user }));

      setSuccess('Email verified successfully! Initializing your tourist pass...');
      navigate(user.onboardingCompleted ? '/tourist/profile' : '/onboarding', {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'Invalid or expired OTP code. Please check or request a new code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email to receive a verification code.');
      setIsEditingEmail(true);
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');

    try {
      await authService.resendVerification({ email: email.trim().toLowerCase() });
      setSuccess(`A new 6-digit code has been dispatched to ${email}.`);
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to resend code. Please try again in a moment.'
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div className="mb-4 text-center mt-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          Verify Email
        </h2>
        <p className="text-xs text-slate-500">
          Enter the 6-digit code sent to your registered email
        </p>
      </div>

      {/* Email Context Editor */}
      <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs">
        <Mail size={14} className="text-slate-400 flex-shrink-0" />
        {isEditingEmail ? (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="bg-transparent text-slate-900 focus:outline-none w-full placeholder-slate-400"
            autoFocus
          />
        ) : (
          <span className="font-medium text-slate-900 truncate max-w-[220px]">
            {email || 'No email specified'}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsEditingEmail(!isEditingEmail)}
          className="text-[11px] font-bold text-red-600 hover:text-red-700 transition ml-2 shrink-0"
        >
          {isEditingEmail ? 'Save' : 'Edit'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-800 text-center mb-2">
            6-Digit Security PIN
          </label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`
                  w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-bold font-mono rounded-md border bg-white text-slate-900 transition-all outline-none
                  ${digit ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500'}
                `}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-start gap-2">
            <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={otp.length !== 6 || !email || loading}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-[13px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Validating...
            </>
          ) : (
            <>
              Verify & Enter Portal
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      <div className="flex flex-col items-center gap-3 mt-5">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || resending || !email}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:text-slate-400 transition-colors"
        >
          <RefreshCw size={14} className={resending ? 'animate-spin text-red-600' : ''} />
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Verification Code'}
        </button>

        <div className="w-full h-px bg-slate-200 mt-1" />

        <Link
          to="/login"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition pb-4"
        >
          <ArrowLeft size={14} /> Back to Login
        </Link>
      </div>
    </>
  );
}
