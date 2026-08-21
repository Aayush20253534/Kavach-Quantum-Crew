import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';
<<<<<<< HEAD
=======
import { AuthInitializer } from './guards/AuthInitializer';
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe

export function App() {
  return (
    <Providers>
<<<<<<< HEAD
      <RouterProvider router={router} />
=======
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
    </Providers>
  );
}
