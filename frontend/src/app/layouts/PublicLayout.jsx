import React from 'react';
import { Outlet } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold">Public Navbar</h1>
      </header>
      <main className="flex-1 container mx-auto p-4">
        <Outlet />
      </main>
      <footer className="p-4 bg-white border-t mt-auto">
        <p className="text-center text-sm text-gray-500">Public Footer</p>
      </footer>
    </div>
  );
}
