import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import { Bot, Sparkles, Timer, ArrowLeft, Rocket, Download, FileText, Video, Play, Music } from 'lucide-react';

export const AiTools: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'downloader',
      title: 'Video Downloader',
      description: 'Download videos from YouTube, Facebook, Instagram, and more in high quality.',
      icon: Download,
      color: 'text-[#6DD58C]',
      bgColor: 'bg-[#0F5223]',
      status: 'Active',
      path: '/ai-tools/downloader'
    },
    {
      id: 'transcribe',
      title: 'Video Transcribe',
      description: 'Extract text and captions from any video using advanced AI speech recognition.',
      icon: FileText,
      color: 'text-[#A8C7FA]',
      bgColor: 'bg-[#0842A0]',
      status: 'Active',
      path: '/ai-tools/transcribe'
    },
    {
      id: 'chat',
      title: 'AI Chat Assistant',
      description: 'Get instant answers and coding help from our advanced language model.',
      icon: Bot,
      color: 'text-[#9B72CB]',
      bgColor: 'bg-[#4A0072]',
      status: 'Coming Soon',
      path: '#'
    },
    {
      id: 'content',
      title: 'Content Generator',
      description: 'Generate SEO-optimized blog posts, emails, and social media captions.',
      icon: Sparkles,
      color: 'text-[#D96570]',
      bgColor: 'bg-[#370007]',
      status: 'Coming Soon',
      path: '#'
    }
  ];

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge color="purple"><div className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> AI Powered Utilities</div></Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-[#E3E3E3] mt-6 mb-6">
            AI Tools <span className="text-[#A8C7FA]">Suite</span>
          </h1>
          <p className="text-xl text-[#C4C7C5] max-w-2xl mx-auto">
            Automate your workflow with our collection of intelligent tools designed for creators and professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card 
              key={tool.id} 
              className={`p-8 hoverEffect group border-t-4 border-t-transparent hover:border-t-[#A8C7FA] cursor-pointer relative overflow-hidden ${tool.status === 'Coming Soon' ? 'opacity-75' : ''}`}
              onClick={() => tool.status === 'Active' && navigate(tool.path)}
            >
              <div className={`w-14 h-14 ${tool.bgColor} rounded-2xl flex items-center justify-center mb-6 border border-white/10`}>
                <tool.icon className={`w-7 h-7 ${tool.color}`} />
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-[#E3E3E3]">{tool.title}</h3>
                {tool.status === 'Coming Soon' && (
                  <span className="text-[10px] bg-[#1E1F20] text-[#8E918F] px-2 py-1 rounded border border-[#444746]">
                    Soon
                  </span>
                )}
              </div>
              
              <p className="text-[#8E918F] text-sm leading-relaxed mb-6">
                {tool.description}
              </p>
              
              <div className="flex items-center text-sm font-medium text-[#A8C7FA] group-hover:translate-x-2 transition-transform">
                {tool.status === 'Active' ? 'Launch Tool' : 'Notify Me'} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
            <Button variant="outline" onClick={() => navigate('/')} icon={ArrowLeft}>
                Back to Home
            </Button>
        </div>
      </div>
    </div>
  );
};