
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
// Fixed import: Loader2 is from lucide-react, not UI
import { Button, Card, Badge, Input } from '../components/UI';
import { ArrowLeft, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export const AiChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Use the injected API key from environment
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: "You are Nexlify AI, a helpful assistant for the Nexlify platform. You help users with coding, design, and business questions."
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Failed to connect to AI server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <div className="h-20 border-b border-[#444746] flex items-center justify-between px-6 bg-[#131314]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/ai-tools')} className="p-2 hover:bg-[#1E1F20] rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#A8C7FA]/20 rounded-xl flex items-center justify-center text-[#A8C7FA]">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-sm font-bold">Nexlify Chat AI</h1>
                    <Badge color="green" className="text-[8px] py-0 px-1">Gemini 3 Powered</Badge>
                </div>
            </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <Sparkles className="w-12 h-12 text-[#A8C7FA] mb-4" />
                <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
                <p className="text-[#8E918F] text-sm">Ask me about Nexlify services, get help with coding, or brainstorm new business ideas.</p>
            </div>
        )}
        {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-[#A8C7FA] text-[#062E6F] rounded-tr-none' : 'bg-[#1E1F20] text-[#E3E3E3] border border-[#444746] rounded-tl-none'}`}>
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                        {m.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span className="text-[10px] font-bold uppercase tracking-widest">{m.role === 'user' ? 'You' : 'Nexlify AI'}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
            </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-[#1E1F20] p-4 rounded-3xl rounded-tl-none border border-[#444746]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#A8C7FA]" />
                </div>
            </div>
        )}
      </div>

      <div className="p-4 md:p-8 border-t border-[#444746] bg-[#131314]">
        <div className="max-w-4xl mx-auto relative">
            <input 
                type="text" 
                placeholder="Type a message..." 
                className="w-full bg-[#1E1F20] border border-[#444746] rounded-2xl py-4 pl-6 pr-16 text-[#E3E3E3] outline-none focus:border-[#A8C7FA] transition-all"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#A8C7FA] text-[#062E6F] rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
                <Send className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};
