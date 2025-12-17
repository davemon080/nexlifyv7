import React, { useState } from 'react';
import { Button, Card, Badge } from '../components/UI';
import { Download, Link as LinkIcon, Youtube, Facebook, Instagram, Video, CheckCircle, Loader2, AlertCircle, FileVideo, RefreshCw, ExternalLink, HardDrive } from 'lucide-react';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusText, setStatusText] = useState(''); 
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Reset state
    setProcessing(true);
    setResult(null);
    setError('');
    setDownloadProgress(0);
    setStatusText('Resolving video stream...');

    try {
        // We use Cobalt as a resolver to get the direct stream URL
        // This is a free, privacy-friendly tool that supports many platforms
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                vCodec: 'h264',
                vQuality: '720',
                aFormat: 'mp3',
                filenamePattern: 'basic'
            })
        });

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.text || 'Could not find video at this URL');
        }

        // Simulating metadata extraction since Cobalt simplifies the response
        const videoData = {
            title: data.filename || 'Downloaded Video',
            // Use a generic placeholder if no thumb available, or try to parse from URL if possible
            thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80', 
            source: new URL(url).hostname.replace('www.', ''),
            downloadUrl: data.url,
            formats: [
                { quality: '720p/High', type: 'mp4', url: data.url }
            ]
        };
        
        setStatusText('Stream located');
        await new Promise(r => setTimeout(r, 500)); // UX delay
        setResult(videoData);

    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to process video.');
    } finally {
        setProcessing(false);
    }
  };

  const downloadFileInBrowser = async (fileUrl: string, fileName: string) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      setStatusText('Initializing download...');

      try {
          // fetch the remote file
          const response = await fetch(fileUrl);
          
          if (!response.ok) throw new Error(`Network error: ${response.statusText}`);
          if (!response.body) throw new Error('ReadableStream not supported');

          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          let loaded = 0;

          const reader = response.body.getReader();
          const chunks = [];

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              if (value) {
                chunks.push(value);
                loaded += value.length;
                if (total > 0) {
                    setDownloadProgress(Math.round((loaded / total) * 100));
                } else {
                    // Estimate progress if total size is unknown
                    setDownloadProgress(prev => Math.min(prev + 1, 95));
                }
              }
          }

          setStatusText('Finalizing file...');
          const blob = new Blob(chunks, { type: 'video/mp4' });
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Trigger download
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName.endsWith('.mp4') ? fileName : `${fileName}.mp4`;
          document.body.appendChild(a);
          a.click();
          
          // Cleanup
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
          
          setDownloadProgress(100);
          setStatusText('Download Complete!');
          setTimeout(() => setIsDownloading(false), 2000);

      } catch (err) {
          console.error("Browser download failed (likely CORS)", err);
          setError("Direct browser download failed due to security (CORS). Opening fallback link.");
          setIsDownloading(false);
          // Fallback
          window.open(fileUrl, '_blank');
      }
  };

  const reset = () => {
      setResult(null);
      setUrl('');
      setError('');
      setDownloadProgress(0);
      setIsDownloading(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <Badge color="green"><div className="flex items-center gap-2"><HardDrive className="w-3 h-3" /> Browser Downloader</div></Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mt-4 mb-4">Universal Video Downloader</h1>
            <p className="text-[#C4C7C5] max-w-2xl mx-auto">
                Save videos directly to your device. Supports YouTube, TikTok, Twitter, and more.
            </p>
        </div>

        {/* Input Section */}
        <Card className="p-8 md:p-10 mb-8 bg-[#1E1F20] border-t-4 border-t-[#6DD58C]">
            {!processing && !result ? (
                <form onSubmit={handleProcess} className="relative animate-fadeIn">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <LinkIcon className="h-5 w-5 text-[#8E918F]" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste video URL here..."
                                className="w-full pl-12 pr-4 py-4 bg-[#131314] border border-[#444746] rounded-xl text-[#E3E3E3] focus:ring-2 focus:ring-[#6DD58C] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <Button size="lg" className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3] h-auto py-4 px-8" icon={Download}>
                            Resolve
                        </Button>
                    </div>
                    <div className="flex justify-center gap-6 mt-6 text-[#8E918F] text-sm">
                        <span className="flex items-center gap-2"><Youtube className="w-4 h-4" /> YouTube</span>
                        <span className="flex items-center gap-2"><Facebook className="w-4 h-4" /> Facebook</span>
                        <span className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</span>
                    </div>
                </form>
            ) : processing ? (
                 <div className="py-8 text-center animate-fadeIn">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 text-[#6DD58C] animate-spin" />
                        <div>
                            <h3 className="text-xl font-bold text-[#E3E3E3]">{statusText}</h3>
                            <p className="text-[#8E918F] text-sm mt-1">Analyzing media source...</p>
                        </div>
                    </div>
                 </div>
            ) : (
                <div className="animate-slideUp">
                    <div className="flex justify-between items-center mb-6 border-b border-[#444746] pb-4">
                        <h3 className="text-xl font-bold text-[#E3E3E3]">Download Ready</h3>
                        <Button variant="outline" size="sm" onClick={reset} icon={RefreshCw}>New Search</Button>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Download Options */}
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-[#444746] bg-[#131314]">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-[#6DD58C]/20 text-[#6DD58C]">
                                        <Video className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[#E3E3E3] font-bold truncate pr-4">{result.title}</div>
                                        <div className="text-[#8E918F] text-xs uppercase">{result.source} • {result.formats[0].quality}</div>
                                    </div>
                                </div>
                            </div>
                            
                            {isDownloading ? (
                                <div className="p-6 bg-[#131314] rounded-xl border border-[#444746] text-center animate-fadeIn">
                                    <div className="mb-4 relative h-3 w-full bg-[#1E1F20] rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-[#6DD58C] transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#E3E3E3] font-bold">{downloadProgress}%</span>
                                        <span className="text-[#8E918F]">{statusText}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <Button 
                                        className="flex-1 bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3] py-4"
                                        icon={Download}
                                        onClick={() => downloadFileInBrowser(result.downloadUrl, result.title)}
                                    >
                                        Download to Device
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        icon={ExternalLink}
                                        onClick={() => window.open(result.downloadUrl, '_blank')}
                                    >
                                        Direct Link
                                    </Button>
                                </div>
                            )}

                            <div className="mt-4 p-4 bg-[#A8C7FA]/10 rounded-xl border border-[#A8C7FA]/20 text-sm text-[#A8C7FA] flex gap-3 items-start">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    Video is downloaded directly in your browser. If the progress bar doesn't move, use the "Direct Link" button.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>

        {error && (
            <div className="bg-[#370007] border border-[#F2B8B5]/20 text-[#FFB4AB] p-4 rounded-xl flex items-center gap-3 mb-8 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </div>
        )}

        <div className="mt-8 text-center text-xs text-[#5E5E5E]">
            This tool processes data in-browser where possible. Please respect copyright laws.
        </div>
      </div>
    </div>
  );
};