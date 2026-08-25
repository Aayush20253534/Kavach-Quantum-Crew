import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  AlertCircle,
  MapPin,
  Activity,
} from 'lucide-react';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Namaste! I am your Prayagraj safety assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const messagesEndRef = useRef(null);

  const quickActions = [
    {
      label: 'Nearest Safe Zone',
      icon: MapPin,
    },
    {
      label: 'Report Issue',
      icon: AlertCircle,
    },
    {
      label: 'Current Crowds',
      icon: Activity,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text: trimmedMessage,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessage('');

    // Temporary simulated AI response.
    // Replace this with the real chatbot API later.
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Acknowledged. Retrieving relevant data from the municipal grid...',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        aiMessage,
      ]);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    setMessage(action.label);
  };

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[60] flex flex-col items-end font-sans">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[380px] h-[60vh] sm:h-[500px] max-h-[600px] bg-white rounded-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 mb-4 flex flex-col overflow-hidden">
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

                <p className="text-[10px] text-slate-500 font-medium">
                  Tourist Safety Assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
              aria-label="Close chatbot"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((currentMessage) => (
              <div
                key={currentMessage.id}
                className={`flex gap-2 max-w-[85%] ${currentMessage.sender === 'user'
                    ? 'ml-auto flex-row-reverse'
                    : 'mr-auto'
                  }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center shrink-0 mt-0.5 rounded-md ${currentMessage.sender === 'user'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                >
                  {currentMessage.sender === 'user' ? (
                    <User size={12} />
                  ) : (
                    <Bot size={12} />
                  )}
                </div>

                <div
                  className={`flex flex-col ${currentMessage.sender === 'user'
                      ? 'items-end'
                      : 'items-start'
                    }`}
                >
                  <div
                    className={`px-3 py-2 text-xs leading-relaxed shadow-sm ${currentMessage.sender === 'user'
                        ? 'bg-[#e33636] text-white rounded-md rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-md rounded-tl-none'
                      }`}
                  >
                    {currentMessage.text}
                  </div>

                  <span className="text-[9px] text-slate-400 mt-1 px-0.5">
                    {currentMessage.time}
                  </span>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions & Input */}
          <div className="bg-white border-t border-slate-200 p-3 shrink-0 flex flex-col gap-3">
            {/* Quick Action Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-500 hover:bg-red-50/50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    <Icon size={12} />
                    {action.label}
                  </button>
                );
              })}
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Type your message..."
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-3 pr-10 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />

              <button
                type="submit"
                disabled={!message.trim()}
                className="absolute right-1 w-7 h-7 bg-[#e33636] text-white flex items-center justify-center rounded-md disabled:opacity-60 hover:bg-red-700 transition shadow-sm"
                aria-label="Send message"
              >
                <Send size={12} className="ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="w-12 h-12 rounded-md flex items-center justify-center shadow-[0_4px_14px_0_rgb(227,54,54,0.39)] transition-colors border-none bg-[#e33636] text-white hover:bg-red-700"
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <MessageSquare size={20} />
        )}
      </button>
    </div>
  );
}