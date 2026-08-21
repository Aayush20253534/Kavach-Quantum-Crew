import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
      <p className="text-center text-gray-500 mb-4">Form placeholder</p>
      <div className="flex justify-between mt-4 text-sm">
        <Link to="/" className="text-blue-500 hover:underline">Back Home</Link>
        <Link to="/register" className="text-blue-500 hover:underline">Create account</Link>
      </div>
      <div className="mt-8 pt-4 border-t flex flex-col gap-2 text-sm text-center">
        <p>Demo links:</p>
        <Link to="/tourist/dashboard" className="text-blue-500 hover:underline">Go to Tourist Dashboard</Link>
        <Link to="/authority/dashboard" className="text-blue-500 hover:underline">Go to Authority Dashboard</Link>
      </div>
    </div>
  );
}
