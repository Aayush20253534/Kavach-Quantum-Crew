import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';
import { AuthInitializer } from './guards/AuthInitializer';
import { ChatbotWidget } from '../components/chatbot/ChatbotWidget';

export function App() {
  return (
    <Providers>
      <AuthInitializer>
        <RouterProvider router={router} />
        <ChatbotWidget />
      </AuthInitializer>
    </Providers>
  );
}
