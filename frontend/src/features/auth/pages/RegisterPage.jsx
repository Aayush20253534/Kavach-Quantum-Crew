import React from 'react';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
      <p className="text-center text-gray-500 mb-4">Form placeholder</p>
      <div className="text-center mt-4 text-sm">
        <Link to="/login" className="text-blue-500 hover:underline">Already have an account? Login</Link>
      </div>
    </div>
  );
}
