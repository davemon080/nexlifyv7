import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Button, Card, Badge } from '../components/UI';
import { Bot, Send, User, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AiChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatSession.current = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: 'You are a helpful, clever, and friendly AI assistant named Nexlify Bot.',
      },
    });
    
    // Initial greeting
    setMessages([{
        id: 'init',
        role: 'model',
        text: 'Hello! I am Nexlify Bot. How can I assist you today?'
    }]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSession.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg.text });
      const responseText = result.text || "I'm sorry, I couldn't generate a response.";
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to the AI service."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
      setMessages([]);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSession.current = ai.chats.create({ model: 'gemini-3-pro-preview' });
      setMessages([{
        id: 'init-2',
        role: 'model',
        text: 'Chat cleared. How can I help you now?'
    }]);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/ai-tools')}>Back</Button>
            <Badge color="purple"><div className="flex items-center gap-2"><Bot className="w-3 h-3" /> Gemini 3 Pro</div></Badge>
            <Button variant="outline" size="sm" icon={Trash2} onClick={handleClear}>Clear</Button>
        </div>

        <Card className="w-full max-w-4xl h-[70vh] flex flex-col bg-[#1E1F20] border border-[#444746] overflow-hidden p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#444746] scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#9B72CB] text-white'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-[#A8C7FA]/10 text-[#E3E3E3] rounded-tr-sm border border-[#A8C7FA]/20' 
                            : 'bg-[#131314] text-[#C4C7C5] rounded-tl-sm border border-[#444746]'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#9B72CB] text-white flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-[#131314] p-4 rounded-2xl rounded-tl-sm border border-[#444746]">
                            <Loader2 className="w-5 h-5 text-[#9B72CB] animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#131314] border-t border-[#444746]">
                <form onSubmit={handleSend} className="flex gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-[#1E1F20] border border-[#444746] rounded-xl px-4 py-3 text-[#E3E3E3] focus:ring-2 focus:ring-[#9B72CB] outline-none"
                    />
                    <Button type="submit" disabled={!input.trim() || loading} icon={Send} className="bg-[#9B72CB] hover:bg-[#B085DE] text-white">
                        Send
                    </Button>
                </form>
            </div>
        </Card>
    </div>
  );
};