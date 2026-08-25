import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChatbotWidget } from '../../components/chatbot/ChatbotWidget';

export function GlobalLayout() {
  return (
    <>
      <Outlet />
      <ChatbotWidget />
    </>
  );
}
