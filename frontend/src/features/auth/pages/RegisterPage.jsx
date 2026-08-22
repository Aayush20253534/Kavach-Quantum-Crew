import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function RegisterPage() {
  const navigate = useNavigate();
  const [registerError, setRegisterError] = useState("");
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setRegisterError("");
    try {
      // Create unverified TOURIST account
      await authService.register({
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: "TOURIST" 
      });
      
      // Redirect to OTP Verification page
      navigate('/verify-email', { state: { email: data.email } });
      
    } catch (error) {
      setRegisterError(error.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
      
      {registerError && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
          {registerError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <input 
            {...register("name")} 
            placeholder="Full Name" 
            className="w-full border p-2 rounded" 
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        
        <div>
          <input 
            {...register("username")} 
            placeholder="Username" 
            className="w-full border p-2 rounded" 
          />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <input 
            {...register("email")} 
            type="email" 
            placeholder="Email Address" 
            className="w-full border p-2 rounded" 
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <input 
            {...register("phone")} 
            placeholder="Phone Number" 
            className="w-full border p-2 rounded" 
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <input 
            {...register("password")} 
            type="password" 
            placeholder="Password" 
            className="w-full border p-2 rounded" 
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <input 
            {...register("confirmPassword")} 
            type="password" 
            placeholder="Confirm Password" 
            className="w-full border p-2 rounded" 
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="text-center mt-4 text-sm">
        <Link to="/login" className="text-blue-500 hover:underline">Already have an account? Login</Link>
      </div>
    </div>
  );
}
