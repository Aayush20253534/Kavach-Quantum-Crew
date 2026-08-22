import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { setAuth } from '../store/authSlice';

const loginSchema = z.object({
  identifier: z.string().min(2, 'Username or Email is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['TOURIST', 'AUTHORITY']),
  rememberMe: z.boolean().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('TOURIST');
  const [authError, setAuthError] = useState('');

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
      rememberMe: true,
    },
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data) => {
    setAuthError('');
    try {
      // Quick simulation delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const isAuthority = data.role === 'AUTHORITY';
      const userPayload = {
        id: isAuthority ? 'usr_auth_901' : 'usr_tourist_101',
        name: isAuthority ? 'Insp. Rajesh Verma' : 'Prachi Maurya',
        username: data.identifier.includes('@') ? data.identifier.split('@')[0] : data.identifier,
        email: data.identifier.includes('@') ? data.identifier : `${data.identifier}@touristsafety.in`,
        role: data.role,
        department: isAuthority ? 'Prayagraj Police & Tourism Security' : undefined,
        onboardingComplete: isAuthority ? true : false,
      };

      dispatch(setAuth({ user: userPayload }));

      if (isAuthority) {
        navigate('/authority/dashboard');
      } else {
        navigate('/tourist/dashboard');
      }
    } catch (err) {
      setAuthError('Invalid credentials. Please check your login details.');
    }
  };

  const handleQuickDemoLogin = (role) => {
    if (role === 'AUTHORITY') {
      setValue('identifier', 'officer_sharma');
      setValue('password', 'police2026');
      setValue('role', 'AUTHORITY');
      setSelectedRole('AUTHORITY');
    } else {
      setValue('identifier', 'prachi_m');
      setValue('password', 'tourist123');
      setValue('role', 'TOURIST');
      setSelectedRole('TOURIST');
    }
  };

  return (
    <Card variant="elevated" className="border-slate-200 bg-white/90 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden">
      {/* Top Accent Stripe */}
      <div className={`h-1.5 w-full transition-colors duration-500 ${selectedRole === 'AUTHORITY' ? 'bg-amber-500' : 'bg-sky-500'}`} />

      <CardHeader className="text-center pb-2 pt-6 px-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <CardTitle className="justify-center text-2xl font-black tracking-tight text-slate-900">
          Prayagraj Safety Portal
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Sign in to access real-time tourist monitoring, SOS networks & passes
        </CardDescription>

        {/* Role Toggle Tab */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange('TOURIST')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
              selectedRole === 'TOURIST'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Tourist
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('AUTHORITY')}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
              selectedRole === 'AUTHORITY'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Police / Authority
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2 px-6 pb-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} />

          <Input
            variant="light"
            label={selectedRole === 'AUTHORITY' ? 'Badge ID or Official Email' : 'Email or Username'}
            leftIcon={User}
            placeholder={selectedRole === 'AUTHORITY' ? 'officer_sharma' : 'prachi_m or prachi@example.com'}
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          <div className="relative">
            <Input
              variant="light"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              leftIcon={LockKeyhole}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="h-4 w-4 rounded bg-white border-slate-300 text-sky-600 focus:ring-sky-600"
              />
              Remember me
            </label>
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact tourism support at 1363 or your registered mobile number.');
              }}
              className="text-sky-600 hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>

          {authError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-medium">
              {authError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className={`w-full ${
              selectedRole === 'AUTHORITY'
                ? '!bg-gradient-to-r !from-amber-500 !to-yellow-600 !text-slate-950 hover:!from-amber-400 hover:!to-yellow-500'
                : ''
            }`}
            rightIcon={ArrowRight}
          >
            {selectedRole === 'AUTHORITY' ? 'Access Authority Console' : 'Sign In to Safety Portal'}
          </Button>
        </form>

        {/* 1-Click Demo Buttons for presentation */}
        <div className="pt-2">
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" /> Demo Quick Login
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('TOURIST')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-[11px] font-bold text-slate-600 transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
              Fill Tourist Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('AUTHORITY')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 text-[11px] font-bold text-slate-600 transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              Fill Police Demo
            </button>
          </div>
        </div>

        {/* Bottom register link */}
        <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-200">
          New tourist in Prayagraj?{' '}
          <Link to="/register" className="font-bold text-sky-600 hover:underline">
            Register Digital ID →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
