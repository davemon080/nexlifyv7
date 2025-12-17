import React, { useState } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Button, Card, Badge, Textarea } from '../components/UI';
import { AudioLines, Play, ArrowLeft, Loader2, Volume2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to decode base64 to ArrayBuffer
function decodeAudioData(base64String: string) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export const TextToSpeech: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleGenerate = async () => {
    if (!text) return;
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
          playAudio(base64Audio);
      } else {
          alert("No audio generated");
      }

    } catch (err: any) {
      console.error(err);
      alert("Error generating speech: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (base64Data: string) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await audioContext.decodeAudioData(decodeAudioData(base64Data));
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => setIsPlaying(false);
        
        source.start(0);
        setIsPlaying(true);
      } catch (e) {
          console.error("Audio playback error", e);
      }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/ai-tools')}>Back</Button>
            <Badge color="yellow"><div className="flex items-center gap-2"><AudioLines className="w-3 h-3" /> Text to Speech</div></Badge>
            <div className="w-10"></div>
        </div>

        <Card className="p-8 bg-[#1E1F20]">
            <div className="mb-6">
                <label className="text-sm text-[#C4C7C5] mb-2 block">Enter Text</label>
                <Textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    placeholder="Type something here to convert to speech..."
                    className="min-h-[150px] text-lg"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="text-sm text-[#C4C7C5] mb-2 block">Select Voice</label>
                    <div className="grid grid-cols-3 gap-2">
                        {voices.map(voice => (
                            <button
                                key={voice}
                                onClick={() => setSelectedVoice(voice)}
                                className={`px-3 py-2 rounded-lg text-sm border transition-colors flex items-center justify-center gap-2 ${selectedVoice === voice ? 'bg-[#FFD97D] text-[#5B4300] border-[#FFD97D]' : 'bg-[#131314] text-[#8E918F] border-[#444746] hover:bg-[#2D2E30]'}`}
                            >
                                <User className="w-3 h-3" /> {voice}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-end">
                    <Button 
                        onClick={handleGenerate} 
                        className="w-full h-[42px] bg-[#FFD97D] text-[#5B4300] hover:bg-[#FFEebb]" 
                        icon={isPlaying ? Volume2 : Play}
                        isLoading={loading}
                        disabled={isPlaying}
                    >
                        {isPlaying ? 'Playing...' : 'Generate Speech'}
                    </Button>
                </div>
            </div>

            {isPlaying && (
                <div className="flex items-center justify-center gap-3 p-4 bg-[#5B4300]/20 rounded-xl border border-[#FFD97D]/30 text-[#FFD97D] animate-pulse">
                    <Volume2 className="w-6 h-6" />
                    <span className="font-medium">Playing Audio...</span>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};