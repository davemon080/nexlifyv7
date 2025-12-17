import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button, Card, Badge } from '../components/UI';
import { Mic, Square, ArrowLeft, Loader2, Copy, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AudioTranscribe: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription('');
      setAudioBlob(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: 'audio/webm', // MediaRecorder usually outputs webm
                            data: base64Audio
                        }
                    },
                    {
                        text: "Please transcribe this audio accurately."
                    }
                ]
            }
          });
          
          setTranscription(response.text || "No speech detected.");
          setLoading(false);
      };

    } catch (err: any) {
      console.error(err);
      setTranscription("Error transcribing audio.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/ai-tools')}>Back</Button>
            <Badge color="blue"><div className="flex items-center gap-2"><Mic className="w-3 h-3" /> Audio Transcription</div></Badge>
            <div className="w-10"></div>
        </div>

        <Card className="p-8 bg-[#1E1F20] text-center">
            <div className="mb-8">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isRecording ? 'border-[#D96570] bg-[#370007] animate-pulse' : 'border-[#444746] bg-[#131314]'}`}>
                    <Mic className={`w-10 h-10 ${isRecording ? 'text-[#D96570]' : 'text-[#8E918F]'}`} />
                </div>
                <p className="mt-4 text-[#C4C7C5] font-medium">
                    {isRecording ? 'Recording... Speak now' : audioBlob ? 'Audio Recorded' : 'Click to Record'}
                </p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                {!isRecording ? (
                    <Button 
                        onClick={startRecording} 
                        className="bg-[#A8C7FA] text-[#062E6F] hover:bg-[#C2D9FC]" 
                        icon={Mic}
                        disabled={loading}
                    >
                        {audioBlob ? 'Record New' : 'Start Recording'}
                    </Button>
                ) : (
                    <Button 
                        onClick={stopRecording} 
                        variant="danger" 
                        icon={Square}
                    >
                        Stop Recording
                    </Button>
                )}
            </div>

            {audioBlob && !isRecording && (
                <div className="mb-8 p-4 bg-[#131314] rounded-xl border border-[#444746] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-[#6DD58C]" />
                        <span className="text-sm text-[#C4C7C5]">Recording ready ({Math.round(audioBlob.size / 1024)} KB)</span>
                    </div>
                    <Button size="sm" onClick={handleTranscribe} isLoading={loading}>
                        Transcribe with Gemini
                    </Button>
                </div>
            )}

            {loading && (
                <div className="py-8">
                    <Loader2 className="w-8 h-8 text-[#A8C7FA] animate-spin mx-auto mb-2" />
                    <p className="text-[#8E918F] text-sm">Transcribing audio...</p>
                </div>
            )}

            {transcription && (
                <div className="text-left mt-6 animate-slideUp">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-[#E3E3E3]">Transcription:</h3>
                        <button onClick={() => navigator.clipboard.writeText(transcription)} className="p-1 hover:bg-[#444746] rounded text-[#A8C7FA]">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4 bg-[#131314] rounded-xl border border-[#444746] text-[#E3E3E3] leading-relaxed whitespace-pre-wrap">
                        {transcription}
                    </div>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
};