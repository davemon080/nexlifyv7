import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import { Bot, Sparkles, Timer, ArrowLeft, Rocket } from 'lucide-react';

export const AiTools: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[85vh] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[500px] bg-[#4285F4]/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 max-w-3xl w-full text-center">
        <Badge color="purple"><div className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Under Development</div></Badge>
        
        <h1 className="text-4xl md:text-7xl font-bold text-[#E3E3E3] mt-8 mb-6 tracking-tight">
          AI Tools <span className="text-[#A8C7FA]">Suite</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#C4C7C5] mb-12 leading-relaxed max-w-2xl mx-auto">
          We are crafting a collection of powerful AI utilities to automate your tasks and boost creativity. 
          Text generation, image analysis, and smart assistants are on the way.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left opacity-60 pointer-events-none grayscale">
            <Card className="p-6 border border-[#444746]/50">
                <div className="w-10 h-10 rounded-full bg-[#131314] flex items-center justify-center border border-[#444746] mb-4">
                    <Bot className="w-5 h-5 text-[#A8C7FA]" />
                </div>
                <h3 className="font-bold text-[#E3E3E3] mb-2">Chat Assistant</h3>
                <p className="text-xs text-[#8E918F]">Advanced conversational AI for support and queries.</p>
            </Card>
            <Card className="p-6 border border-[#444746]/50">
                <div className="w-10 h-10 rounded-full bg-[#131314] flex items-center justify-center border border-[#444746] mb-4">
                    <Sparkles className="w-5 h-5 text-[#9B72CB]" />
                </div>
                <h3 className="font-bold text-[#E3E3E3] mb-2">Content Gen</h3>
                <p className="text-xs text-[#8E918F]">Generate blogs, emails, and social posts instantly.</p>
            </Card>
            <Card className="p-6 border border-[#444746]/50">
                <div className="w-10 h-10 rounded-full bg-[#131314] flex items-center justify-center border border-[#444746] mb-4">
                    <Rocket className="w-5 h-5 text-[#D96570]" />
                </div>
                <h3 className="font-bold text-[#E3E3E3] mb-2">Smart Analysis</h3>
                <p className="text-xs text-[#8E918F]">Data insights powered by machine learning.</p>
            </Card>
        </div>

        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#1E1F20] rounded-full border border-[#444746]">
                <Timer className="w-5 h-5 text-[#6DD58C]" />
                <span className="text-[#E3E3E3] font-medium">Launching Soon</span>
            </div>
            
            <Button variant="outline" onClick={() => navigate('/')} icon={ArrowLeft}>
                Back to Home
            </Button>
        </div>
      </div>
    </div>
  );
};