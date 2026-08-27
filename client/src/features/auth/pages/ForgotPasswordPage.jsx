import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../api/authService';

const emptyOtp = () => ['', '', '', '', '', ''];

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const refs = useRef([]);
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(emptyOtp);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [countdown]);

  const normalizedEmail = email.trim().toLowerCase();
  const otp = digits.join('');

  const requestCode = async ({ resend = false } = {}) => {
    if (!normalizedEmail) {
      setError('Enter your registered email address.');
      return;
    }

    if (resend) setResending(true);
    else setBusy(true);
    setError('');
    setNotice('');

    try {
      await authService.requestPasswordReset({ email: normalizedEmail });
      setStep('OTP');
      setDigits(emptyOtp());
      setCountdown(60);
      setNotice(`If an account exists for ${normalizedEmail}, a 6-digit code has been sent.`);
      window.setTimeout(() => refs.current[0]?.focus(), 50);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Unable to send a reset code. Please try again.',
      );
    } finally {
      setBusy(false);
      setResending(false);
    }
  };

  const handleDigitChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = emptyOtp();
    for (let index = 0; index < pasted.length; index += 1) next[index] = pasted[index];
    setDigits(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await authService.verifyPasswordResetOtp({
        email: normalizedEmail,
        otp,
      });
      if (!result?.resetToken) throw new Error('Reset token was not returned by the server.');
      setResetToken(result.resetToken);
      setStep('PASSWORD');
      setNotice('Email confirmed. Set your new password.');
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          err.message ||
          'The verification code is invalid or expired.',
      );
    } finally {
      setBusy(false);
    }
  };

  const validatePassword = () => {
    if (password.length < 8) return 'Password must contain at least 8 characters.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/\d/.test(password)) return 'Password must contain a number.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await authService.resetPassword({
        email: normalizedEmail,
        resetToken,
        password,
        confirmPassword,
      });
      setStep('DONE');
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Unable to reset your password. Request a new code and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tourist-font">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          {step === 'DONE' ? <CheckCircle2 size={22} /> : <ShieldCheck size={22} />}
        </div>
        <h2 className="text-[22px] font-bold tracking-tight text-slate-900">
          {step === 'EMAIL' && 'Forgot Password'}
          {step === 'OTP' && 'Verify Reset Code'}
          {step === 'PASSWORD' && 'Create New Password'}
          {step === 'DONE' && 'Password Reset'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {step === 'EMAIL' && 'We will email you a secure 6-digit confirmation code.'}
          {step === 'OTP' && `Enter the code sent to ${normalizedEmail}.`}
          {step === 'PASSWORD' && 'Choose a strong password you have not used before.'}
          {step === 'DONE' && 'Your password has been updated and old sessions were signed out.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && step !== 'DONE' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {step === 'EMAIL' && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void requestCode();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-[11px] font-semibold text-slate-800">
              Registered Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !normalizedEmail}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Mail size={14} />
            )}
            Send Reset Code
          </button>
        </form>
      )}

      {step === 'OTP' && (
        <form onSubmit={verifyOtp} className="space-y-5">
          <div onPaste={handlePaste}>
            <label className="mb-2 block text-center text-[11px] font-semibold text-slate-800">
              6-Digit Email OTP
            </label>
            <div className="flex justify-center gap-2 sm:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { refs.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  className={`h-12 w-10 rounded-lg border bg-white text-center font-mono text-xl font-black text-slate-900 outline-none transition sm:w-11 ${
                    digit
                      ? 'border-red-500 bg-red-50/30 ring-1 ring-red-500'
                      : 'border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <ArrowRight size={14} />
            )}
            Verify Code
          </button>

          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => void requestCode({ resend: true })}
              disabled={countdown > 0 || resending}
              className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 disabled:text-slate-300"
            >
              <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('EMAIL');
                setDigits(emptyOtp());
                setError('');
                setNotice('');
              }}
              className="font-semibold text-red-600 hover:text-red-700"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      {step === 'PASSWORD' && (
        <form onSubmit={resetPassword} className="space-y-4">
          <PasswordField
            id="new-password"
            label="New Password"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />
          <PasswordField
            id="confirm-new-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((value) => !value)}
          />

          <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[10px] font-medium leading-5 text-slate-500">
            Use 8+ characters with uppercase, lowercase and at least one number.
          </div>

          <button
            type="submit"
            disabled={busy || !password || !confirmPassword}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LockKeyhole size={14} />
            )}
            Reset Password
          </button>
        </form>
      )}

      {step === 'DONE' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center text-xs font-medium leading-5 text-emerald-800">
            Your new password is active. For security, existing refresh sessions for this account have been revoked.
          </div>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-900 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Continue to Login <ArrowRight size={14} />
          </button>
        </div>
      )}

      {step !== 'DONE' && (
        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={13} /> Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-9 text-xs text-slate-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
