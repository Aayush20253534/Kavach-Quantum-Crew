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
  UserRound,
  Building2,
  UserCog,
  LogIn,
  ShieldAlert,
  Flame,
  Ambulance,
} from 'lucide-react';

import { authService } from '../api/authService';
import { setAuth } from '../store/authSlice';
import { setAccessToken } from '../../../services/apiClient';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email, username, or phone number is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['TOURIST', 'DISASTER_MANAGER', 'SYSTEM_ADMIN', 'POLICE', 'FIRE', 'AMBULANCE']),
  remember: z.boolean().optional(),
});

const mainRoles = [
  { id: 'TOURIST', title: 'Tourist', subtitle: 'Tourist access', icon: UserRound },
  {
    id: 'DISASTER_MANAGER',
    title: 'Disaster Mgt.',
    subtitle: 'Command',
    icon: Building2,
  },
  {
    id: 'SYSTEM_ADMIN',
    title: 'SysAdmin',
    subtitle: 'System',
    icon: UserCog,
  },
];

const responderRoles = [
  {
    id: 'POLICE',
    title: 'Police',
    icon: ShieldAlert,
    color: 'amber'
  },
  {
    id: 'FIRE',
    title: 'Fire',
    icon: Flame,
    color: 'red'
  },
  {
    id: 'AMBULANCE',
    title: 'Ambulance',
    icon: Ambulance,
    color: 'emerald'
  },
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
    
    // Every portal, including emergency-service fleets, authenticates against
    // the backend. Created Police/Fire/Ambulance accounts can therefore sign in
    // with their real username/email and password.
    setValue('identifier', '');
    setValue('password', '');
  };

  const onSubmit = async (data) => {
    setLoginError('');

    try {
      const response = await authService.login({
        identifier: data.identifier.trim(),
        password: data.password,
        role: data.role,
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
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      if (['POLICE', 'FIRE', 'AMBULANCE'].includes(user.role)) {
        navigate('/responder/dispatch', { replace: true });
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

        <div className="mb-3 mt-3 text-center">
          <h2 className="mb-1 text-[22px] font-bold tracking-tight text-slate-900">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-500">
            Login to your account to continue
          </p>
        </div>

        <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {mainRoles.map((role, idx) => {
            const Icon = role.icon;
            const isCategoryActive = 
              selectedRole === role.id || 
              (role.id === 'DISASTER_MANAGER' && ['POLICE', 'FIRE', 'AMBULANCE'].includes(selectedRole));

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`relative flex min-h-[44px] min-w-0 items-center justify-center gap-1.5 px-1.5 py-1.5 transition-colors ${
                  isCategoryActive
                    ? 'z-10 bg-red-50 text-red-600'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                } ${idx % 3 !== 0 ? 'border-l border-slate-200' : ''}`}
              >
                {isCategoryActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500" />
                )}

                <Icon
                  size={14}
                  className={`shrink-0 ${isCategoryActive ? 'text-red-500' : 'text-slate-400'}`}
                />

                <div className="min-w-0 text-left leading-tight">
                  <span
                    className={`block font-bold whitespace-nowrap text-[10px] sm:text-[11px] lg:text-[10px]`}
                  >
                    {role.title}
                  </span>
                  <span
                    className={`mt-0.5 hidden whitespace-nowrap text-[8px] font-medium 2xl:block ${
                      isCategoryActive ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {role.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {['DISASTER_MANAGER', 'POLICE', 'FIRE', 'AMBULANCE'].includes(selectedRole) && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Or login as Responder</p>
            <div className="grid grid-cols-3 gap-2">
              {responderRoles.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.id;
                
                const activeClasses = {
                  'amber': 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm',
                  'blue': 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
                  'red': 'bg-red-50 text-red-700 border-red-200 shadow-sm',
                  'emerald': 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                }[role.color];

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border transition-all ${
                      active
                        ? activeClasses
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={16} className={active ? '' : 'text-slate-400'} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{role.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

      <div className="h-4" />

      <p className="pb-4 text-center text-[11px] text-slate-500">
        Don't have an account?
        <Link
          to="/register"
          className="ml-1.5 font-bold text-red-600 transition hover:text-red-700"
        >
          Register Now →
        </Link>
      </p>
    </>
  );
}
