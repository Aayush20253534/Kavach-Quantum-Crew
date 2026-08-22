import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { authService } from '../api/authService';

export function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      const response = await authService.verifyEmail({ email: email.trim(), otp });

      if (response?.accessToken) {
        localStorage.setItem('quantum_access_token', response.accessToken);
      }
      
      setSuccess('Email verified successfully! Initializing your tourist pass...');
      setTimeout(() => {
        window.location.href = '/tourist/dashboard';
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid or expired OTP code. Please check or request a new code.'
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
      await authService.resendVerification({ email: email.trim() });
      setSuccess(`A new 6-digit code has been dispatched to ${email}.`);
      setCountdown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  const handleFillDemoCode = () => {
    if (!email) {
      setEmail('prachi@touristsafety.in');
      setIsEditingEmail(false);
    }
    setDigits(['1', '2', '3', '4', '5', '6']);
    setError('');
  };

  return (
    <Card variant="elevated" className="border-slate-800/80 bg-slate-900/85 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden">
      {/* Top Accent Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />

      <CardHeader className="text-center pb-2 pt-6 px-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
          <KeyRound className="h-7 w-7" />
        </div>
        <CardTitle className="justify-center text-2xl font-black tracking-tight text-white">
          Verify Your Identity
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Enter the 6-digit verification code sent to your registered email
        </CardDescription>

        {/* Email Context Pill */}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-950/80 p-2.5 border border-slate-800 text-xs">
          <Mail className="h-3.5 w-3.5 text-sky-400 flex-shrink-0" />
          {isEditingEmail ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-transparent text-white focus:outline-none w-full text-center placeholder-slate-500 font-medium"
              autoFocus
            />
          ) : (
            <span className="font-semibold text-slate-200 truncate max-w-[200px]">
              {email || 'No email specified'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEditingEmail(!isEditingEmail)}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors ml-1 px-1.5 py-0.5 rounded hover:bg-sky-500/10 cursor-pointer"
          >
            {isEditingEmail ? 'Done' : 'Edit'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-2 px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 6-box OTP input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
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
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border bg-slate-950/90 text-white transition-all duration-200 shadow-inner ${
                    digit
                      ? 'border-sky-400 ring-2 ring-sky-400/30 bg-sky-500/5'
                      : 'border-slate-800 hover:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  } focus:outline-none`}
                />
              ))}
            </div>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={otp.length !== 6 || !email}
            className="w-full !bg-gradient-to-r !from-sky-500 !to-blue-600 hover:!from-sky-400 hover:!to-blue-500 !text-white font-bold"
            rightIcon={ArrowRight}
          >
            {loading ? 'Validating PIN...' : 'Verify & Enter Portal'}
          </Button>
        </form>

        {/* Resend Action */}
        <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-400">
          <span>Didn't receive code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resending || !email}
            className="flex items-center gap-1 font-bold text-sky-400 hover:text-sky-300 disabled:text-slate-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
          </button>
        </div>

        {/* 1-Click Demo Shortcut */}
        <div className="pt-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" /> Quick Testing
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={handleFillDemoCode}
            className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-sky-500/10 border border-slate-800 hover:border-sky-500/30 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
            Fill Demo Email & OTP (123456)
          </button>
        </div>

        {/* Navigation fallback */}
        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80 flex items-center justify-center gap-4">
          <Link to="/login" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </Link>
          <span className="text-slate-700">|</span>
          <Link to="/register" className="text-sky-400 hover:underline">
            Register New Account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
