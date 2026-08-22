import React, { useState, useRef, useEffect } from 'react';
<<<<<<< HEAD
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
=======
import { MessageSquare, X, Send, Bot, User, AlertCircle, MapPin, Activity } from 'lucide-react';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! I am your Prayagraj safety assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const messagesEndRef = useRef(null);

  const quickActions = [
    { label: 'Nearest Safe Zone', icon: MapPin },
    { label: 'Report Issue', icon: AlertCircle },
    { label: 'Current Crowds', icon: Activity },
>>>>>>> afb0877c (feat: implement GlobalLayout and move ChatbotWidget to root-level layout for consistent access across all routes)
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
<<<<<<< HEAD
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
=======
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'ai',
          text: 'Acknowledged. Retrieving relevant data from the municipal grid...',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    setMessage(action.label);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[340px] sm:w-[380px] h-[500px] max-h-[80vh] bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 mb-4 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 flex items-center justify-center border border-red-100 text-red-600 rounded-md">
                <Bot size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-[13px] tracking-tight mb-0.5">
                  Rakshak AI
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Tourist Safety Assistant</p>
>>>>>>> afb0877c (feat: implement GlobalLayout and move ChatbotWidget to root-level layout for consistent access across all routes)
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
<<<<<<< HEAD
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
=======
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 rounded-md ${
                    msg.sender === 'user'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3 py-2 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#e33636] text-white rounded-md rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-md rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-0.5">{msg.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions & Input Area */}
          <div className="bg-white border-t border-slate-200 p-3 shrink-0 flex flex-col gap-3">
            {/* Quick Action Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-500 hover:bg-red-50/50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-3 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-1 w-7 h-7 bg-[#e33636] text-white flex items-center justify-center rounded-md disabled:opacity-60 hover:bg-red-700 transition shadow-sm"
              >
                <Send size={12} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-md flex items-center justify-center shadow-[0_4px_14px_0_rgb(227,54,54,0.39)] transition-colors border-none bg-[#e33636] text-white hover:bg-red-700"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
>>>>>>> afb0877c (feat: implement GlobalLayout and move ChatbotWidget to root-level layout for consistent access across all routes)
    </div>
  );
}
