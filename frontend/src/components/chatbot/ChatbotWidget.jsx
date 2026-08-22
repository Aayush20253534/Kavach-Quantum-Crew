import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Shield, MapPin, PhoneCall, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Namaste! I am Rakshak AI, your 24/7 Smart Tourist Safety Companion for Prayagraj. How can I assist you today?',
      time: 'Just now',
    },
  ]);

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    '🏥 Nearest hospital in Prayagraj?',
    '🌊 Is Sangam ghat safe right now?',
    '🚨 Emergency police helpline numbers?',
    '👥 How do I invite my family to my group?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend = inputMessage) => {
    const text = typeof textToSend === 'string' ? textToSend.trim() : inputMessage.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Contextual AI safety responses
    setTimeout(() => {
      let botResponse = "I'm monitoring your safety. Let me check the local Prayagraj advisory for you.";

      const lower = text.toLowerCase();
      if (lower.includes('hospital') || lower.includes('medical') || lower.includes('doctor')) {
        botResponse = "🏥 **Nearest Medical Facilities**:\n1. **Tej Bahadur Sapru Hospital (Beli)** - Stanley Rd (1.8 km) · 📞 0532-2545000\n2. **SRN Medical College Hospital** - Lowther Rd (3.2 km) · 24/7 Trauma Center\n3. **Sangam First Aid Post #3** - Located directly at Ghat 4.";
      } else if (lower.includes('sangam') || lower.includes('crowd') || lower.includes('ghat')) {
        botResponse = "🌊 **Sangam Safety Advisory**:\n• Status: **LOW RISK / NORMAL FLOW**\n• Water flow speed: Moderate (1.2 m/s)\n• Deep-water barricades are strictly deployed.\n• 18 NDRF & SDRF lifeboats are currently patrolling.";
      } else if (lower.includes('police') || lower.includes('helpline') || lower.includes('emergency') || lower.includes('number')) {
        botResponse = "🚨 **Critical Helplines**:\n• National Emergency: **112**\n• Tourist Police Prayagraj: **1363**\n• Women Power Line: **1090**\n• Ambulance: **108**\n• Sangam Central Control Room: **0532-2500112**";
      } else if (lower.includes('group') || lower.includes('family') || lower.includes('invite')) {
        botResponse = "👥 **Group Sync Steps**:\n1. Open **Groups & QR** in your menu.\n2. Tap **Create Group** to generate a dynamic safety QR.\n3. Your companions can tap **Scan QR** to instantly join your live geo-tracker!";
      } else {
        botResponse = `Thanks for asking. All zones around your current location are operating under normal security standards. If you feel unsafe at any moment, press the **Red SOS** button at the top to alert nearest patrols.`;
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-sky-400/40 cursor-pointer"
          aria-label="Open AI Safety Assistant"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-400 border-2 border-[#060B16]"></span>
          </span>
          <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="relative w-[360px] sm:w-[400px] h-[540px] max-h-[85vh] rounded-2xl bg-[#0d1526] border border-sky-500/30 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#111c30] to-[#152238] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#111c30]"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-white tracking-wide">Rakshak AI</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-semibold">Safety Bot</span>
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">Live • 24/7 Tourist Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#080d18]/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 space-y-1 ${
                    msg.sender === 'user'
                      ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20'
                      : 'bg-[#152238] text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <p className={`text-[9px] ${msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'} text-right`}>
                    {msg.time}
                  </p>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex gap-1 bg-[#152238] border border-slate-700/60 rounded-2xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-[#0d1526] border-t border-slate-800/80 flex gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-[#152238] text-slate-300 hover:text-white hover:bg-sky-500/20 border border-slate-700/60 transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#111c30] border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about tourist safety..."
              className="flex-1 bg-[#080d18] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            <Button
              variant="primary"
              size="icon-sm"
              onClick={() => handleSend()}
              disabled={!inputMessage.trim()}
              className="rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
