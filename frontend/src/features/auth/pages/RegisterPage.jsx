import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
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

  const {
    register,
    handleSubmit,
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
      agreeTerms: false,
    },
  });

  const onSubmit = async (data) => {
    setRegisterError('');
    try {
      await authService.register({
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'TOURIST',
      });
      navigate('/verify-email', { state: { email: data.email } });
    } catch (error) {
      setRegisterError(
        error.response?.data?.message || 'Registration failed. Please check your details and try again.'
      );
    }
  };

  return (
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
        </div>
      )}

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
  );
}
