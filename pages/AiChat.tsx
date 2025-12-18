import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import { ArrowLeft, Construction } from 'lucide-react';

export const AiChat: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center bg-[#1E1F20] border border-[#444746]">
        <div className="w-20 h-20 bg-[#131314] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#444746]">
            <Construction className="w-10 h-10 text-[#8E918F]" />
        </div>
        <h1 className="text-2xl font-bold text-[#E3E3E3] mb-2">AI Chatbot</h1>
        <Badge color="yellow" className="mb-6">Coming Soon</Badge>
        <p className="text-[#C4C7C5] mb-8 leading-relaxed">
            We are currently working on integrating the Gemini 3 Pro chat experience. This feature will be available in the next update.
        </p>
        <Button variant="outline" onClick={() => navigate('/ai-tools')} icon={ArrowLeft} className="w-full justify-center">
            Back to Tools
        </Button>
      </Card>
    </div>
  );
};