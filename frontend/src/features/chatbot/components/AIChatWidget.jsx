import React, { useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';

const mockAnswer = (text) => {
  const q = text.toLowerCase();
  if (q.includes('sos') || q.includes('emergency')) {
    return 'Mock AI: use the red SOS control for immediate emergencies. It sends your active trip and live location to the real backend.';
  }
  if (q.includes('safe') || q.includes('risk')) {
    return 'Mock AI: check Live Tracking and the dashboard safety status for real geofence data. AI risk analysis is not connected yet.';
  }
  if (q.includes('trip')) {
    return 'Mock AI: create or manage a trip from My Trips. Trip, group, tracking and check-in data are connected to the real backend.';
  }
  return 'Mock AI assistant: this section is intentionally not connected to an AI provider yet. Core tourist safety features continue to use the real backend.';
};

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, bot: true, text: 'Mock AI assistant ready. Core safety actions use the real backend.' },
  ]);

  const send = (event) => {
    event?.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((items) => [
      ...items,
      { id: Date.now(), bot: false, text: value },
      { id: Date.now() + 1, bot: true, text: mockAnswer(value) },
    ]);
    setText('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-24 lg:bottom-6 z-40 w-12 h-12 rounded-full bg-slate-900 text-white shadow-xl flex items-center justify-center"
        title="Mock AI assistant"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed right-4 bottom-24 lg:bottom-20 z-50 w-[min(380px,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="text-sm font-black">AI Safety Assistant</p>
                <p className="text-[10px] text-slate-300 uppercase tracking-wider">Mock mode</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
          </div>

          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.bot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  message.bot ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-900 text-white'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="p-3 border-t border-slate-200 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask the mock assistant..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
            />
            <button className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
