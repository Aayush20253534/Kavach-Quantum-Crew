import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  const {
    register,
    handleSubmit,
    watch,
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
      agreeTerms: true,
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
      const newUser = {
        id: `usr_${Date.now()}`,
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        role: 'TOURIST',
        onboardingComplete: false, // Redirect to onboarding
      };

      dispatch(setAuth({ user: newUser }));
      // Forward to mandatory onboarding flow
      navigate('/onboarding');
    } catch (err) {
      setRegisterError('Failed to create account. Please try again.');
    }
  };

  return (
    <Card variant="elevated" className="border-slate-800 shadow-2xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <CardTitle className="justify-center text-2xl font-black text-white">
          Create Tourist ID
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Register to activate your 24/7 Prayagraj Safety Network
        </CardDescription>
      </CardHeader>

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
  );
}
