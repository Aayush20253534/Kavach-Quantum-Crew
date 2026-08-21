import React from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to SIH Project</h1>
      <div className="flex gap-4">
        <Link to="/login" className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600 transition">
          Login
        </Link>
        <Link to="/register" className="px-4 py-2 border rounded hover:bg-gray-50 transition">
          Register
        </Link>
      </div>
    </div>
  );
}
