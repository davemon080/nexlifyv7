import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/UI';
import { Bot, Sparkles, ArrowLeft, Download, FileText, Video, Mic, Image, AudioLines, Bell } from 'lucide-react';

export const AiTools: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'chat',
      title: 'AI Chatbot',
      description: 'Ask questions and get intelligent responses from Gemini 3 Pro.',
      icon: Bot,
      color: 'text-[#9B72CB]',
      bgColor: 'bg-[#4A0072]',
      status: 'Coming Soon',
      path: '/ai-tools/chat'
    },
    {
      id: 'image',
      title: 'Image Analyzer',
      description: 'Upload photos and get detailed insights using computer vision.',
      icon: Image,
      color: 'text-[#D96570]',
      bgColor: 'bg-[#370007]',
      status: 'Coming Soon',
      path: '/ai-tools/image'
    },
    {
      id: 'video',
      title: 'Video Understanding',
      description: 'Analyze video content for summaries and key information.',
      icon: Video,
      color: 'text-[#6DD58C]',
      bgColor: 'bg-[#0F5223]',
      status: 'Coming Soon',
      path: '/ai-tools/video'
    },
    {
      id: 'audio',
      title: 'Audio Transcribe',
      description: 'Record your voice and convert it to text instantly.',
      icon: Mic,
      color: 'text-[#A8C7FA]',
      bgColor: 'bg-[#0842A0]',
      status: 'Coming Soon',
      path: '/ai-tools/audio'
    },
    {
      id: 'tts',
      title: 'Text to Speech',
      description: 'Turn your text into lifelike spoken audio.',
      icon: AudioLines,
      color: 'text-[#FFD97D]',
      bgColor: 'bg-[#5B4300]',
      status: 'Coming Soon',
      path: '/ai-tools/tts'
    },
    {
      id: 'downloader',
      title: 'Video Downloader',
      description: 'Download videos from YouTube, Facebook, and more.',
      icon: Download,
      color: 'text-[#6DD58C]',
      bgColor: 'bg-[#0F5223]',
      status: 'Coming Soon',
      path: '/ai-tools/downloader'
    },
    {
      id: 'transcribe_file',
      title: 'File Transcriber',
      description: 'Extract text from uploaded video and audio files.',
      icon: FileText,
      color: 'text-[#A8C7FA]',
      bgColor: 'bg-[#0842A0]',
      status: 'Coming Soon',
      path: '/ai-tools/transcribe'
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
            We are currently integrating the latest Gemini 2.5 & 3.0 models. These powerful tools will be available shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Card 
              key={tool.id} 
              className="p-8 border-t-4 border-t-transparent cursor-not-allowed relative overflow-hidden opacity-80 bg-[#1E1F20]/50"
            >
              <div className={`w-14 h-14 ${tool.bgColor} rounded-2xl flex items-center justify-center mb-6 border border-white/10 grayscale opacity-70`}>
                <tool.icon className={`w-7 h-7 ${tool.color}`} />
              </div>
              
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-[#8E918F]">{tool.title}</h3>
                <span className="text-[10px] bg-[#370007] text-[#FFB4AB] px-2 py-1 rounded border border-[#F2B8B5]/20">
                    Coming Soon
                </span>
              </div>
              
              <p className="text-[#5E5E5E] text-sm leading-relaxed mb-6">
                {tool.description}
              </p>
              
              <div className="flex items-center text-sm font-medium text-[#8E918F]">
                 <Bell className="w-4 h-4 mr-2" /> Notify Me
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