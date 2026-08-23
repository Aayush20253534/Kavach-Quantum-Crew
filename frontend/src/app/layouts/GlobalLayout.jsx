import React from 'react';
import { Outlet } from 'react-router-dom';

export function GlobalLayout() {
  return (
    <>
      <Outlet />
    </>
  );
}
