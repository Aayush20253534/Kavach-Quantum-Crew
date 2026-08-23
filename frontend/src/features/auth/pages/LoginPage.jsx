import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Smartphone,
  UserRound,
  Building2,
  UserCog,
  LogIn,
} from 'lucide-react';

import { authService } from '../api/authService';
import { setAuth } from '../store/authSlice';
import { setAccessToken } from '../../../services/apiClient';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, username, or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['TOURIST', 'DISASTER_MANAGER', 'SYSTEM_ADMIN']),
  remember: z.boolean().optional(),
});

const roles = [
  { id: 'TOURIST', title: 'Tourist', icon: UserRound },
  { id: 'DISASTER_MANAGER', title: 'Authority', icon: Building2 },
  { id: 'SYSTEM_ADMIN', title: 'Admin', icon: UserCog },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedRole, setSelectedRole] = useState('TOURIST');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      role: 'TOURIST',
      remember: false,
    },
  });

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setValue('role', roleId);
  };

  const onSubmit = async (data) => {
    setLoginError('');

    try {
      const response = await authService.login({
        identifier: data.identifier.trim(),
        password: data.password,
      });

      // Handles either:
      // { data: { user, accessToken } }
      // or directly { user, accessToken }
      const responseBody = response?.data ?? response;
      const authData = responseBody?.data ?? responseBody;

      const user = authData?.user;
      const accessToken = authData?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Invalid login response from server.');
      }

      setAccessToken(accessToken);
      dispatch(setAuth({ user }));

      if (user.role === 'DISASTER_MANAGER') {
        navigate('/authority/dashboard', { replace: true });
        return;
      }

      if (user.role === 'SYSTEM_ADMIN') {
        navigate('/', { replace: true });
        return;
      }

      if (user.role === 'TOURIST') {
        navigate(
          user.onboardingCompleted ? '/tourist/dashboard' : '/onboarding',
          { replace: true }
        );
        return;
      }

      setLoginError('Your account role is not supported by this portal.');
    } catch (error) {
      console.error('Login failed:', error);

      setLoginError(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Unable to login. Please check your credentials.'
      );
    }
  };

  return (
    <>
      <div className={`tourist-font transition-all duration-700 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>

        <div className="mb-4 mt-4 text-center">
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-slate-900">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-500">
            Login to your account to continue
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-0 overflow-hidden rounded-md border border-slate-200">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            const active = selectedRole === role.id;

            return (
              <button
              key={role.id}
              type="button"
              onClick={() => handleRoleChange(role.id)}
              className={`flex items-center justify-center gap-1.5 bg-white py-2 text-[11px] font-semibold transition ${
                active
                  ? 'relative z-10 rounded-md border border-red-600 bg-red-50/30 text-red-600 shadow-sm'
                  : 'border border-transparent text-slate-500 hover:text-slate-800'
              }`}
              style={{
                marginLeft: idx > 0 && active ? '-1px' : '0',
                marginRight: idx < roles.length - 1 && active ? '-1px' : '0',
              }}
            >
              <Icon
                size={14}
                className={active ? 'text-red-500' : 'text-slate-400'}
              />
              <div className="hidden flex-col items-start text-left leading-tight sm:flex">
                <span>{role.title}</span>
                <span
                  className={`text-[9px] font-normal ${
                    active ? 'text-red-400' : 'text-slate-400'
                  }`}
                >
                  I am a {role.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input type="hidden" {...register('role')} />

        <div>
          <label
            htmlFor="identifier"
            className="mb-1 block text-[11px] font-semibold text-slate-800"
          >
            Email, Username or Phone Number
          </label>

          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="identifier"
              type="text"
              placeholder="Enter your email, username or phone"
              {...register('identifier')}
              className={`h-9 w-full rounded-md border bg-white pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                errors.identifier ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>

          {errors.identifier && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-[11px] font-semibold text-slate-800"
            >
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-[10px] font-semibold text-red-600 hover:text-red-700"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="relative">
            <LockKeyhole
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              className={`h-9 w-full rounded-md border bg-white pl-9 pr-8 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                errors.password ? 'border-red-500' : 'border-slate-200'
              }`}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {errors.password && (
            <p className="mt-1 text-[10px] text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-1.5 pb-1 pt-1">
          <input
            type="checkbox"
            {...register('remember')}
            className="h-3 w-3 rounded border-slate-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-[11px] text-slate-500">Remember me</span>
        </label>

        {loginError && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {loginError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={14} />
              Login
            </>
          )}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[9px] uppercase tracking-wider text-slate-400">
          or continue with
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Smartphone size={14} />
          Mobile OTP
        </button>
      </div>

      <p className="pb-4 text-center text-[11px] text-slate-500">
        Don't have an account?
        <Link
          to="/register"
          className="ml-1.5 font-bold text-red-600 transition hover:text-red-700"
        >
          Register Now →
        </Link>
      </p>
      </div>
    </>
  );
}
