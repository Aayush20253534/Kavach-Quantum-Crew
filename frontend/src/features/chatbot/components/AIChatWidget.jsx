import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Loader2, MessageSquare, ShieldAlert 
} from 'lucide-react';
import apiClient from '../../../services/apiClient';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI Safety Assistant. How can I help you today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), text: inputValue, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Assuming a conversationId could be maintained, leaving out for simplicity
      const response = await apiClient.post('/chatbot/messages', { 
        message: userMessage.text 
      });
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: response?.data?.reply || "I've received your message, but the AI engine is currently running in fallback mode.", 
        isBot: true 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      const errorMsg = { 
        id: Date.now() + 1, 
        text: err.response?.status === 501 
          ? "The AI Provider has not been configured by the System Admin yet. Emergency services are still available via the SOS button." 
          : "Sorry, I couldn't connect to the AI engine.", 
        isBot: true,
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all z-50 group border-4 border-white/20"
        >
          <Bot className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-slate-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-wider">AI Assistant</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] ${
                  msg.isBot && !msg.isError ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm' : 
                  msg.isError ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm shadow-sm' :
                  'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                }`}>
                  {msg.isError && <ShieldAlert className="w-4 h-4 text-red-600 mb-1" />}
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm shadow-sm p-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask for guidance or report issues..."
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
