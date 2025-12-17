import React, { useState } from 'react';
import { Button, Card, Input, Badge, Textarea } from '../components/UI';
import { FileText, Upload, Link as LinkIcon, Play, Copy, Check, Download, Mic } from 'lucide-react';

export const VideoTranscribe: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [progress, setProgress] = useState(0);

  const handleTranscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'url' && !url) return;
    if (activeTab === 'upload' && !file) return;

    setLoading(true);
    setTranscription('');
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 90) {
                clearInterval(interval);
                return 90;
            }
            return prev + 10;
        });
    }, 500);

    // Simulate completion
    setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setLoading(false);
        setTranscription(`[00:00] Welcome to this tutorial on mastering React hooks.
[00:05] Today we are going to dive deep into useState and useEffect.
[00:12] These are the fundamental building blocks of modern React applications.
[00:18] First, let's look at how we initialize state...
[00:25] (Music playing in background)
[00:30] As you can see, the syntax is clean and concise.
[00:35] Now, let's move on to handling side effects with useEffect.
[00:42] This replaces lifecycle methods like componentDidMount.
[00:50] Don't forget your dependency array!
[00:55] Thanks for watching, and subscribe for more content.`);
    }, 5000);
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
                Convert video and audio to text instantly. Perfect for creating subtitles, meeting notes, and content repurposing.
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
                                    <p className="text-xs text-[#5E5E5E]">MP4, MP3, MOV (Max 500MB)</p>
                                </div>
                                <input type="file" className="hidden" accept="video/*,audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </label>
                            {file && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-[#A8C7FA]">
                                    <Check className="w-4 h-4" /> Selected: {file.name}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <Button className="w-full" size="lg" isLoading={loading}>
                        {loading ? `Processing... ${progress}%` : 'Start Transcription'}
                    </Button>
                </form>

                {loading && (
                    <div className="mt-8">
                        <div className="w-full bg-[#131314] rounded-full h-2 mb-2">
                            <div className="bg-[#A8C7FA] h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-center text-xs text-[#8E918F]">Analyzing audio tracks and generating captions...</p>
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
                        <span>Words: <b>{transcription.split(' ').length}</b></span>
                        <span>Confidence: <b>98%</b></span>
                    </div>
                    <textarea 
                        className="w-full h-64 p-6 bg-[#131314] text-[#E3E3E3] resize-none outline-none font-mono text-sm leading-relaxed"
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