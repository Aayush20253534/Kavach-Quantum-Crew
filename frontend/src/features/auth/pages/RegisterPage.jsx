import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ShieldCheck, 
  User, 
  AtSign, 
  Mail, 
  Phone, 
  LockKeyhole, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { setAuth } from '../store/authSlice';

const registerSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to safety data sharing' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
=======
import {
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { authService } from '../api/authService';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the terms and privacy policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)

  const {
    register,
    handleSubmit,
<<<<<<< HEAD
    watch,
=======
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
<<<<<<< HEAD
      agreeTerms: true,
=======
      agreeTerms: false,
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
    },
  });

  const passwordVal = watch('password', '');
  const calculateStrength = () => {
    if (!passwordVal) return 0;
    let score = 1;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal)) score++;
    if (/[0-9]/.test(passwordVal)) score++;
    if (/[^A-Za-z0-9]/.test(passwordVal)) score++;
    return score;
  };
  const strength = calculateStrength();

  const onSubmit = async (data) => {
    setRegisterError('');
    try {
<<<<<<< HEAD
      const newUser = {
        id: `usr_${Date.now()}`,
=======
      await authService.register({
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
<<<<<<< HEAD
        role: 'TOURIST',
        onboardingComplete: false, // Redirect to onboarding
      };

      dispatch(setAuth({ user: newUser }));
      // Forward to mandatory onboarding flow
      navigate('/onboarding');
    } catch (err) {
      setRegisterError('Failed to create account. Please try again.');
=======
        password: data.password,
        role: 'TOURIST',
      });
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      setRegisterError(
        error.response?.data?.message || 'Registration failed. Please check your details and try again.'
      );
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
    }
  };

  return (
<<<<<<< HEAD
    <Card variant="elevated" className="border-slate-800 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <ShieldCheck className="w-7 h-7" />
=======
    <>
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
          Create an Account
        </h2>
        <p className="text-xs text-slate-500">
          Register your digital identity for safe travel
        </p>
      </div>

      {registerError && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {registerError}
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
        </div>
        <CardTitle className="justify-center text-2xl font-black text-white">
          Create Tourist ID
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Register to activate your 24/7 Prayagraj Safety Network
        </CardDescription>
      </CardHeader>

<<<<<<< HEAD
      <CardContent className="space-y-4 pt-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <Input
            label="Full Name"
            leftIcon={User}
            placeholder="e.g. Prachi Maurya"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Username"
              leftIcon={AtSign}
              placeholder="prachi_m"
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="Mobile Number"
              leftIcon={Phone}
              placeholder="9876543210"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            leftIcon={Mail}
            placeholder="prachi@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              leftIcon={LockKeyhole}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              leftIcon={LockKeyhole}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          {/* Password strength meter */}
          {passwordVal && (
            <div className="space-y-1 pt-1 text-left">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Password Strength</span>
                <span className={strength >= 4 ? 'text-emerald-400' : strength >= 2 ? 'text-amber-400' : 'text-red-400'}>
                  {strength >= 4 ? 'Strong' : strength >= 2 ? 'Medium' : 'Weak'}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 w-full bg-[#060b16] rounded-full overflow-hidden">
                <div className={`h-full flex-1 ${strength >= 1 ? (strength >= 4 ? 'bg-emerald-500' : strength >= 2 ? 'bg-amber-500' : 'bg-red-500') : 'bg-slate-800'}`} />
                <div className={`h-full flex-1 ${strength >= 2 ? (strength >= 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-800'}`} />
                <div className={`h-full flex-1 ${strength >= 3 ? (strength >= 4 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-800'}`} />
                <div className={`h-full flex-1 ${strength >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 pt-1 text-left">
            <input
              id="agreeTerms"
              type="checkbox"
              {...register('agreeTerms')}
              className="mt-0.5 h-4 w-4 rounded bg-[#060b16] border-slate-700 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
              I agree to share my emergency medical and contact info with local first responders in case of SOS.
            </label>
          </div>
          {errors.agreeTerms && (
            <p className="text-xs text-red-400 text-left">{errors.agreeTerms.message}</p>
          )}

          {registerError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
              {registerError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
            rightIcon={ArrowRight}
          >
            Create Account & Continue to Safety Setup
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-sky-400 hover:underline">
            Sign In Here →
          </Link>
        </div>
      </CardContent>
    </Card>
=======
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* NAME */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Full Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Prachi Maurya"
                {...register('name')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-3
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.name ? 'border-red-500' : 'border-slate-200'}
                `}
              />
            </div>
            {errors.name && <p className="mt-1 text-[10px] text-red-500">{errors.name.message}</p>}
          </div>

          {/* USERNAME */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Username
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. prachi_m"
                {...register('username')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-3
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.username ? 'border-red-500' : 'border-slate-200'}
                `}
              />
            </div>
            {errors.username && <p className="mt-1 text-[10px] text-red-500">{errors.username.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* EMAIL */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-3
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.email ? 'border-red-500' : 'border-slate-200'}
                `}
              />
            </div>
            {errors.email && <p className="mt-1 text-[10px] text-red-500">{errors.email.message}</p>}
          </div>

          {/* PHONE */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Mobile Number
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="10-digit number"
                {...register('phone')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-3
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.phone ? 'border-red-500' : 'border-slate-200'}
                `}
              />
            </div>
            {errors.phone && <p className="mt-1 text-[10px] text-red-500">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* PASSWORD */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Password
            </label>
            <div className="relative">
              <LockKeyhole size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-8
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.password ? 'border-red-500' : 'border-slate-200'}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-[10px] text-red-500">{errors.password.message}</p>}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-800">
              Confirm Password
            </label>
            <div className="relative">
              <LockKeyhole size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={`
                  h-9 w-full rounded-md border bg-white pl-9 pr-3
                  text-xs text-slate-900 outline-none transition
                  placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500
                  ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'}
                `}
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-[10px] text-red-500">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {/* AGREE TERMS */}
        <div>
          <label className="flex items-start gap-1.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              {...register('agreeTerms')}
              className="h-3 w-3 mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-[11px] text-slate-500 leading-tight">
              I agree to the <a href="#terms" className="text-red-600 hover:underline">Terms of Safety Monitoring</a> and privacy policy.
            </span>
          </label>
          {errors.agreeTerms && <p className="text-red-500 text-[10px] mt-1">{errors.agreeTerms.message}</p>}
        </div>

        {/* REGISTER BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="group flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#e33636] text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 mt-1"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Registering...
            </>
          ) : (
            <>
              Register Now
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>

      {/* =================================================
          LOGIN LINK
      ================================================== */}
      <p className="mt-5 text-center text-xs text-slate-500">
        Already have an account?
        <Link to="/login" className="ml-1.5 font-bold text-red-600 hover:text-red-700 transition">
          Login Here →
        </Link>
      </p>
    </>
>>>>>>> 60ad7f78 (feat: add project memory documentation and redesign AuthLayout to light theme)
  );
}
