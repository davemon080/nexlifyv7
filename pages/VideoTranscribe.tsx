import React, { useState } from 'react';
import { Button, Card, Badge } from '../components/UI';
import { FileText, Upload, Link as LinkIcon, Copy, Check, Download, Mic, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: In a production environment, requests should be proxied through a backend to protect the API KEY.
// For this demo, we assume process.env.API_KEY is available or injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const VideoTranscribe: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');

  // Helper: Convert File/Blob to Base64
  const fileToBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the Data URL prefix (e.g., "data:video/mp4;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processWithGemini = async (base64Data: string, mimeType: string) => {
    setStatusText('Sending to Gemini AI...');
    setTranscription('');
    
    try {
        const model = 'gemini-2.5-flash';
        const prompt = "Transcribe the audio from this file accurately. Please format the output with timestamps [MM:SS] at the beginning of each new sentence or speaker change. If there are multiple speakers, label them as Speaker 1, Speaker 2, etc.";

        const responseStream = await ai.models.generateContentStream({
            model: model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        setStatusText('Transcribing...');
        
        for await (const chunk of responseStream) {
            setTranscription(prev => prev + chunk.text);
        }

        setStatusText('Completed');
        setLoading(false);

    } catch (err: any) {
        console.error("Gemini Error:", err);
        throw new Error(err.message || "AI processing failed. Ensure your API Key is valid.");
    }
  };

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTranscription('');

    try {
        if (activeTab === 'upload') {
            if (!file) throw new Error("Please select a file first.");
            
            // Size check (Browser based base64 handling has limits around 50-100MB usually)
            if (file.size > 20 * 1024 * 1024) {
                throw new Error("File is too large for browser-based processing (Max 20MB). Please compress it or use a shorter clip.");
            }

            setStatusText('Processing file...');
            const base64 = await fileToBase64(file);
            await processWithGemini(base64, file.type);

        } else {
            // URL Mode
            if (!url) throw new Error("Please enter a URL.");
            setStatusText('Resolving video URL...');

            // 1. Get Direct Stream URL via Cobalt
            const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, vCodec: 'h264', vQuality: '480', aFormat: 'mp3', filenamePattern: 'basic' })
            });
            const cobaltData = await cobaltRes.json();
            if (cobaltData.status === 'error') throw new Error(cobaltData.text || "Could not resolve URL.");
            
            // 2. Fetch the actual binary data
            // Note: This often fails due to CORS on YouTube/Social Media CDNs.
            setStatusText('Downloading media data...');
            try {
                const mediaRes = await fetch(cobaltData.url);
                if (!mediaRes.ok) throw new Error("Failed to fetch media data.");
                
                const blob = await mediaRes.blob();
                if (blob.size > 20 * 1024 * 1024) throw new Error("Video is too long/large for the free AI tier. Please try a shorter video.");
                
                setStatusText('Converting format...');
                const base64 = await fileToBase64(blob);
                
                // Use audio/mp3 mime type if we requested mp3, otherwise generic video
                await processWithGemini(base64, 'audio/mp3');

            } catch (fetchErr: any) {
                // Fallback suggestion for CORS errors
                console.error(fetchErr);
                throw new Error("Cannot fetch video data directly due to browser security (CORS). Please use the 'Video Downloader' tool to save the file, then upload it here.");
            }
        }
    } catch (err: any) {
        setError(err.message);
        setLoading(false);
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(transcription);
      alert('Transcript copied to clipboard!');
  };

  const handleDownload = () => {
      const element = document.createElement("a");
      const file = new Blob([transcription], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "transcript.txt";
      document.body.appendChild(element);
      element.click();
  };

  const reset = () => {
      setTranscription('');
      setFile(null);
      setUrl('');
      setError('');
      setLoading(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <Badge color="blue"><div className="flex items-center gap-2"><Mic className="w-3 h-3" /> AI Speech-to-Text</div></Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mt-4 mb-4">Video Transcriber</h1>
            <p className="text-[#C4C7C5] max-w-2xl mx-auto">
                Convert video and audio to text instantly using Gemini 1.5 Flash.
            </p>
        </div>

        <Card className="p-0 overflow-hidden bg-[#1E1F20] border-t-4 border-t-[#A8C7FA]">
            <div className="flex border-b border-[#444746]">
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'url' ? 'bg-[#1E1F20] text-[#A8C7FA]' : 'bg-[#131314] text-[#8E918F] hover:bg-[#1E1F20]/50'}`}
                    onClick={() => setActiveTab('url')}
                    disabled={loading}
                >
                    <LinkIcon className="w-4 h-4" /> Paste URL
                </button>
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-[#1E1F20] text-[#A8C7FA]' : 'bg-[#131314] text-[#8E918F] hover:bg-[#1E1F20]/50'}`}
                    onClick={() => setActiveTab('upload')}
                    disabled={loading}
                >
                    <Upload className="w-4 h-4" /> Upload File
                </button>
            </div>
            
            <div className="p-8">
                {!loading && !transcription ? (
                    <form onSubmit={handleTranscribe}>
                        {activeTab === 'url' ? (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[#C4C7C5] mb-2">Video Link</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className="w-full px-4 py-3 bg-[#131314] border border-[#444746] rounded-xl text-[#E3E3E3] focus:ring-2 focus:ring-[#A8C7FA] focus:border-transparent outline-none transition-all"
                                />
                                <p className="text-xs text-[#8E918F] mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Note: Some social links may be blocked by browser security. Use Upload for best results.
                                </p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-[#C4C7C5] mb-2">Upload Video/Audio</label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#444746] border-dashed rounded-xl cursor-pointer hover:bg-[#131314] transition-colors group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-3 text-[#8E918F] group-hover:text-[#A8C7FA]" />
                                        <p className="mb-2 text-sm text-[#8E918F]"><span className="font-semibold text-[#E3E3E3]">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-[#5E5E5E]">MP3, WAV, MP4, MOV (Max 20MB)</p>
                                    </div>
                                    <input type="file" className="hidden" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                </label>
                                {file && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-[#A8C7FA]">
                                        <Check className="w-4 h-4" /> Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <Button className="w-full" size="lg" icon={FileText}>
                            Start Transcription
                        </Button>
                    </form>
                ) : loading ? (
                    <div className="py-12 text-center animate-fadeIn">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 text-[#A8C7FA] animate-spin" />
                            <div>
                                <h3 className="text-xl font-bold text-[#E3E3E3]">{statusText}</h3>
                                <p className="text-[#8E918F] text-sm mt-1">
                                    {transcription.length > 0 ? `${transcription.length} characters generated...` : 'Analyzing audio...'}
                                </p>
                            </div>
                        </div>
                         {/* Live Preview of Stream */}
                         {transcription && (
                            <div className="mt-6 p-4 bg-[#131314] rounded-xl text-left text-xs text-[#8E918F] font-mono h-24 overflow-hidden opacity-70">
                                {transcription.slice(-200)}...
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-slideUp">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-[#E3E3E3]">Transcription Result</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" icon={RefreshCw} onClick={reset}>New</Button>
                                <Button size="sm" variant="outline" icon={Copy} onClick={handleCopy}>Copy</Button>
                                <Button size="sm" variant="outline" icon={Download} onClick={handleDownload}>TXT</Button>
                            </div>
                        </div>
                        <Card className="p-0 bg-[#131314] overflow-hidden">
                            <div className="p-4 bg-[#1E1F20] border-b border-[#444746] flex gap-4 text-sm text-[#8E918F]">
                                <span>Chars: <b>{transcription.length}</b></span>
                                <span>Model: <b>Gemini 2.5 Flash</b></span>
                            </div>
                            <textarea 
                                className="w-full h-96 p-6 bg-[#131314] text-[#E3E3E3] resize-none outline-none font-mono text-sm leading-relaxed"
                                value={transcription}
                                readOnly
                            ></textarea>
                        </Card>
                    </div>
                )}

                {error && (
                    <div className="mt-6 bg-[#370007] border border-[#F2B8B5]/20 text-[#FFB4AB] p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
            </div>
        </Card>
      </div>
    </div>
  );
};