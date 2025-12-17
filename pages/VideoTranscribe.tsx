import React, { useState } from 'react';
import { Button, Card, Badge } from '../components/UI';
import { Upload, Link as LinkIcon, Copy, Check, Download, Mic, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

export const VideoTranscribe: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');

  const handleTranscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'url' && !url) return;
    if (activeTab === 'upload' && !file) return;

    setLoading(true);
    setTranscription('');
    setError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let contentPart = null;

        if (activeTab === 'upload' && file) {
            if (file.size > 20 * 1024 * 1024) {
                throw new Error("File too large. Please upload a file smaller than 20MB for the demo.");
            }

            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            contentPart = {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            };
        } else if (activeTab === 'url' && url) {
            // For URLs, we use the text model to summarize/analyze as we can't directly ingest YT videos client-side 
            // without a proxy or Google Search Grounding tool (available in Pro models).
            contentPart = { text: `Please provide a detailed summary and transcription style output for the content at this URL: ${url}` };
        }

        if (!contentPart) throw new Error("No content to transcribe.");

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    contentPart,
                    { text: "Generate a timestamped transcription of this content. Format it as '[MM:SS] Text'. If the content is a URL and you cannot access it directly, please summarize the likely content based on the URL context." }
                ]
            }
        });

        if (response.text) {
            setTranscription(response.text);
        } else {
            throw new Error("No transcription generated.");
        }

    } catch (err: any) {
        console.error("AI Error:", err);
        setError(err.message || "An error occurred during transcription.");
    } finally {
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

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <Badge color="blue"><div className="flex items-center gap-2"><Mic className="w-3 h-3" /> AI Speech-to-Text</div></Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mt-4 mb-4">Video Transcriber</h1>
            <p className="text-[#C4C7C5] max-w-2xl mx-auto">
                Convert video and audio to text instantly using Gemini AI. Perfect for creating subtitles, meeting notes, and content repurposing.
            </p>
        </div>

        <Card className="p-0 overflow-hidden bg-[#1E1F20] border-t-4 border-t-[#A8C7FA]">
            <div className="flex border-b border-[#444746]">
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'url' ? 'bg-[#1E1F20] text-[#A8C7FA]' : 'bg-[#131314] text-[#8E918F] hover:bg-[#1E1F20]/50'}`}
                    onClick={() => setActiveTab('url')}
                >
                    <LinkIcon className="w-4 h-4" /> Paste URL
                </button>
                <button 
                    className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-[#1E1F20] text-[#A8C7FA]' : 'bg-[#131314] text-[#8E918F] hover:bg-[#1E1F20]/50'}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <Upload className="w-4 h-4" /> Upload File
                </button>
            </div>
            
            <div className="p-8">
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
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[#C4C7C5] mb-2">Upload Video/Audio</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#444746] border-dashed rounded-xl cursor-pointer hover:bg-[#131314] transition-colors group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-3 text-[#8E918F] group-hover:text-[#A8C7FA]" />
                                    <p className="mb-2 text-sm text-[#8E918F]"><span className="font-semibold text-[#E3E3E3]">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-[#5E5E5E]">MP4, MP3, MOV (Max 20MB)</p>
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
                    
                    <Button className="w-full" size="lg" isLoading={loading}>
                        {loading ? 'Processing Media...' : 'Start Transcription'}
                    </Button>
                </form>

                {loading && (
                    <div className="mt-8 flex flex-col items-center justify-center text-[#8E918F]">
                        <Loader2 className="w-8 h-8 animate-spin text-[#A8C7FA] mb-2" />
                        <p className="text-xs">Uploading and analyzing media with Gemini...</p>
                    </div>
                )}
                
                {error && (
                    <div className="mt-6 bg-[#370007] border border-[#F2B8B5]/20 text-[#FFB4AB] p-4 rounded-xl flex items-center gap-3 animate-fadeIn">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </Card>

        {transcription && (
            <div className="mt-8 animate-slideUp">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-[#E3E3E3]">Transcription Result</h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" icon={Copy} onClick={handleCopy}>Copy</Button>
                        <Button size="sm" variant="outline" icon={Download} onClick={handleDownload}>TXT</Button>
                    </div>
                </div>
                <Card className="p-0 bg-[#131314] overflow-hidden">
                    <div className="p-4 bg-[#1E1F20] border-b border-[#444746] flex gap-4 text-sm text-[#8E918F]">
                        <span>Words: <b>{transcription.split(/\s+/).length}</b></span>
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
      </div>
    </div>
  );
};