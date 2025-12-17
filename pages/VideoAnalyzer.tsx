import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button, Card, Badge, Textarea } from '../components/UI';
import { Video, Upload, ArrowLeft, Loader2, Sparkles, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VideoAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [video, setVideo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Summarize the key events in this video.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState('');
  const [fileSizeError, setFileSizeError] = useState('');

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 20MB limit for base64 inline encoding for client-side demo
      if (file.size > 20 * 1024 * 1024) {
          setFileSizeError('File is too large for client-side analysis. Please use a file smaller than 20MB.');
          setVideo(null);
          return;
      }
      setFileSizeError('');
      setMimeType(file.type);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result as string);
        setResult('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!video) return;
    setLoading(true);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = video.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'video/mp4',
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      setResult(response.text || 'No response generated.');
    } catch (err: any) {
      console.error(err);
      setResult('Error analyzing video: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
      setVideo(null);
      setResult('');
      setPrompt('Summarize the key events in this video.');
      setFileSizeError('');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/ai-tools')}>Back</Button>
            <Badge color="green"><div className="flex items-center gap-2"><Video className="w-3 h-3" /> Video Understanding</div></Badge>
            <div className="w-10"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Card className="p-6 bg-[#1E1F20] min-h-[400px] flex flex-col">
                    {!video ? (
                        <label className="flex-1 border-2 border-dashed border-[#444746] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#131314] transition-colors group">
                            <Upload className="w-12 h-12 text-[#8E918F] group-hover:text-[#6DD58C] mb-4" />
                            <p className="text-[#C4C7C5] font-medium">Upload Video (Max 20MB)</p>
                            <p className="text-[#8E918F] text-xs mt-2">MP4, MOV, WEBM</p>
                            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                        </label>
                    ) : (
                        <div className="relative flex-1 bg-[#131314] rounded-2xl overflow-hidden flex items-center justify-center border border-[#444746]">
                            <video src={video} controls className="max-w-full max-h-[350px]" />
                            <button onClick={handleReset} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-[#6DD58C] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    
                    {fileSizeError && (
                        <div className="mt-4 p-3 bg-[#370007] border border-[#F2B8B5]/20 rounded-xl flex items-center gap-2 text-[#FFB4AB] text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {fileSizeError}
                        </div>
                    )}

                    {video && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm text-[#C4C7C5] mb-2 block">Prompt</label>
                                <Textarea 
                                    value={prompt} 
                                    onChange={(e) => setPrompt(e.target.value)} 
                                    className="text-sm min-h-[80px]"
                                />
                            </div>
                            <Button 
                                onClick={handleAnalyze} 
                                className="w-full bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]" 
                                icon={Sparkles}
                                isLoading={loading}
                            >
                                Analyze Video
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="p-6 bg-[#1E1F20] h-full flex flex-col">
                    <h3 className="text-lg font-bold text-[#E3E3E3] mb-4">Gemini Analysis</h3>
                    <div className="flex-1 bg-[#131314] rounded-2xl p-6 border border-[#444746] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#8E918F] gap-4">
                                <Loader2 className="w-8 h-8 text-[#6DD58C] animate-spin" />
                                <p>Processing video frames...</p>
                            </div>
                        ) : result ? (
                            <div className="prose prose-invert prose-sm max-w-none text-[#E3E3E3] leading-relaxed whitespace-pre-wrap">
                                {result}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#8E918F] opacity-50">
                                <Video className="w-12 h-12 mb-2" />
                                <p>Analysis will appear here</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};