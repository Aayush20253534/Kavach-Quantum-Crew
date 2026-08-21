import React from 'react';
import { Outlet } from 'react-router-dom';

export function TouristLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-blue-900 text-white p-4 hidden md:block">
        <h2 className="text-xl font-bold mb-4">Tourist Sidebar</h2>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="p-4 bg-white shadow-sm md:hidden">
          <h2 className="font-bold">Tourist Mobile Nav</h2>
        </header>
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
