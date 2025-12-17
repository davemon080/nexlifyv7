import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button, Card, Badge, Textarea } from '../components/UI';
import { Image, Upload, ArrowLeft, Loader2, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ImageAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Describe this image in detail.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mimeType, setMimeType] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(''); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = image.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: base64Data
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      setResult(response.text || 'No description generated.');
    } catch (err: any) {
      console.error(err);
      setResult('Error analyzing image: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
      setImage(null);
      setResult('');
      setPrompt('Describe this image in detail.');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/ai-tools')}>Back</Button>
            <Badge color="red"><div className="flex items-center gap-2"><Image className="w-3 h-3" /> Image Understanding</div></Badge>
            <div className="w-10"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Card className="p-6 bg-[#1E1F20] min-h-[400px] flex flex-col">
                    {!image ? (
                        <label className="flex-1 border-2 border-dashed border-[#444746] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-[#131314] transition-colors group">
                            <Upload className="w-12 h-12 text-[#8E918F] group-hover:text-[#D96570] mb-4" />
                            <p className="text-[#C4C7C5] font-medium">Upload Image to Analyze</p>
                            <p className="text-[#8E918F] text-xs mt-2">JPG, PNG, WEBP</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    ) : (
                        <div className="relative flex-1 bg-[#131314] rounded-2xl overflow-hidden flex items-center justify-center border border-[#444746]">
                            <img src={image} alt="Upload" className="max-w-full max-h-[350px] object-contain" />
                            <button onClick={handleReset} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-[#D96570] transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    
                    {image && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="text-sm text-[#C4C7C5] mb-2 block">What do you want to know?</label>
                                <Textarea 
                                    value={prompt} 
                                    onChange={(e) => setPrompt(e.target.value)} 
                                    className="text-sm min-h-[80px]"
                                />
                            </div>
                            <Button 
                                onClick={handleAnalyze} 
                                className="w-full bg-[#D96570] text-[#370007] hover:bg-[#F2B8B5] hover:text-[#370007]" 
                                icon={Sparkles}
                                isLoading={loading}
                            >
                                Analyze Image
                            </Button>
                        </div>
                    )}
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="p-6 bg-[#1E1F20] h-full flex flex-col">
                    <h3 className="text-lg font-bold text-[#E3E3E3] mb-4">Analysis Result</h3>
                    <div className="flex-1 bg-[#131314] rounded-2xl p-6 border border-[#444746] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-[#8E918F] gap-4">
                                <Loader2 className="w-8 h-8 text-[#D96570] animate-spin" />
                                <p>Gemini Pro is looking at your image...</p>
                            </div>
                        ) : result ? (
                            <div className="prose prose-invert prose-sm max-w-none text-[#E3E3E3] leading-relaxed whitespace-pre-wrap">
                                {result}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#8E918F] opacity-50">
                                <Image className="w-12 h-12 mb-2" />
                                <p>Result will appear here</p>
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