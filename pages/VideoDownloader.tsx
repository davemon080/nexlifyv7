import React, { useState } from 'react';
import { Button, Card, Badge } from '../components/UI';
import { Download, Link as LinkIcon, Youtube, Facebook, Instagram, Video, CheckCircle, Loader2, AlertCircle, FileVideo, RefreshCw, ExternalLink } from 'lucide-react';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [statusText, setStatusText] = useState(''); 
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Helper to detect platform
  const getPlatform = (url: string) => {
    if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('facebook') || url.includes('fb.watch')) return 'Facebook';
    if (url.includes('instagram')) return 'Instagram';
    if (url.includes('twitter') || url.includes('x.com')) return 'Twitter/X';
    if (url.includes('tiktok')) return 'TikTok';
    return 'Web Video';
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    // Reset state
    setProcessing(true);
    setResult(null);
    setError('');
    setDownloadProgress(0);
    setStatusText('Connecting to server...');

    try {
        // Construct API URL with query parameters
        // We use format=mp4 to ensure we get video, not audio.
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://youtube-info-download-api.p.rapidapi.com/ajax/download.php?format=mp4&add_info=0&url=${encodedUrl}&allow_extended_duration=false&no_merge=false`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'youtube-info-download-api.p.rapidapi.com',
                'x-rapidapi-key': 'd65a7a1b87mshafe5687993d6894p101c7ajsn6d7c8469650c'
            }
        });

        if (!response.ok) {
             throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.status === 'error' || data.error) {
            throw new Error(data.message || data.error || 'Could not process video');
        }

        // Heuristic to find the URL in the response
        // Common RapidAPI patterns: data.url, data.link, data.result.url, data.download_url
        let videoUrl = data.url || data.link || data.download_url;
        
        // Sometimes data itself is the url if text/plain (unlikely for json fetch)
        if (!videoUrl && data.result && typeof data.result === 'string') videoUrl = data.result;
        if (!videoUrl && data.result && data.result.url) videoUrl = data.result.url;

        // Fallback checks
        if (!videoUrl) {
            if (data.formats && data.formats.length > 0) {
                videoUrl = data.formats[0].url;
            } else {
                 throw new Error('No download URL found in API response. The video might be private or restricted.');
            }
        }

        const platform = getPlatform(url);
        
        // Simulate "Processing" time for better UX if API is too fast
        setStatusText('Analyzing video streams...');
        await new Promise(r => setTimeout(r, 800));

        setResult({
            title: data.title || data.filename || `Downloaded ${platform} Video`,
            thumbnail: data.thumb || data.thumbnail || `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${new URL(url).origin}&size=128`, // Generic favicon/thumb fallback
            source: platform,
            downloadUrl: videoUrl,
            formats: [
                { quality: 'Best Available', size: 'Unknown', type: 'mp4', url: videoUrl }
            ]
        });

    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch video. Please check the URL and try again.');
    } finally {
        setProcessing(false);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
      setIsDownloading(true);
      setDownloadProgress(0);
      setStatusText('Starting download...');

      try {
          // Attempt 1: Fetch Blob (Allows Progress Bar)
          // This only works if the source server allows CORS (Access-Control-Allow-Origin: *)
          const response = await fetch(fileUrl);
          
          if (!response.ok) throw new Error('Network response was not ok');
          if (!response.body) throw new Error('ReadableStream not yet supported in this browser.');

          // to access headers, server must send Access-Control-Expose-Headers: content-length
          const contentLength = response.headers.get('content-length');
          if (!contentLength) {
             // Fallback if no content length: just download without specific progress
             console.warn("No content-length header");
          }

          const total = contentLength ? parseInt(contentLength, 10) : 0;
          let loaded = 0;

          const reader = response.body.getReader();
          const chunks = [];

          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              loaded += value.length;
              if (total > 0) {
                  setDownloadProgress(Math.round((loaded / total) * 100));
              } else {
                  // Fake progress if total unknown
                  setDownloadProgress(prev => Math.min(prev + 5, 90));
              }
          }

          const blob = new Blob(chunks);
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName; // Try to use the filename from API
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
          setDownloadProgress(100);
          setStatusText('Download Complete!');

      } catch (err) {
          console.warn("CORS blocked direct download, falling back to direct link.", err);
          // Attempt 2: Direct Window Open (Fallback)
          // This relies on the browser to handle the file
          window.open(fileUrl, '_blank');
          setStatusText('Opened in new tab (CORS restricted)');
      } finally {
          setTimeout(() => setIsDownloading(false), 3000);
      }
  };

  const reset = () => {
      setResult(null);
      setUrl('');
      setDownloadProgress(0);
      setIsDownloading(false);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <Badge color="green"><div className="flex items-center gap-2"><Download className="w-3 h-3" /> Free Tool</div></Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mt-4 mb-4">Universal Video Downloader</h1>
            <p className="text-[#C4C7C5] max-w-2xl mx-auto">
                Download videos from YouTube, Facebook, TikTok, Twitter and more.
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
                            Start
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
                            <p className="text-[#8E918F] text-sm mt-1">Please wait...</p>
                        </div>
                    </div>
                 </div>
            ) : (
                <div className="animate-slideUp">
                    <div className="flex justify-between items-center mb-6 border-b border-[#444746] pb-4">
                        <h3 className="text-xl font-bold text-[#E3E3E3]">Download Ready</h3>
                        <Button variant="outline" size="sm" onClick={reset} icon={RefreshCw}>Download Another</Button>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Video Preview */}
                        <div className="w-full lg:w-1/2">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-[#444746] shadow-2xl relative">
                                <video 
                                    src={result.downloadUrl} 
                                    controls 
                                    className="w-full h-full object-contain"
                                    poster={result.thumbnail}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold text-[#E3E3E3] line-clamp-2">{result.title}</h4>
                                <div className="flex gap-3 mt-2 text-sm text-[#8E918F]">
                                    <span className="bg-[#131314] px-2 py-1 rounded border border-[#444746]">{result.source}</span>
                                </div>
                            </div>
                        </div>

                        {/* Download Options */}
                        <div className="w-full lg:w-1/2 space-y-4">
                            <p className="text-sm text-[#8E918F] font-medium uppercase tracking-wider mb-2">Download File</p>
                            
                            {isDownloading ? (
                                <div className="p-6 bg-[#131314] rounded-xl border border-[#444746] text-center">
                                    <div className="mb-4 relative h-3 w-full bg-[#1E1F20] rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-[#6DD58C] transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[#E3E3E3] font-bold">{downloadProgress}%</p>
                                    <p className="text-[#8E918F] text-sm">{statusText}</p>
                                </div>
                            ) : (
                                result.formats.map((format: any, idx: number) => (
                                    <div 
                                        key={idx}
                                        className="flex items-center justify-between p-4 rounded-xl border border-[#444746] bg-[#131314] hover:border-[#6DD58C] transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-lg bg-[#6DD58C]/20 text-[#6DD58C]">
                                                <Video className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="text-[#E3E3E3] font-bold">{format.quality}</div>
                                                <div className="text-[#8E918F] text-xs uppercase">{format.type}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]"
                                                icon={Download}
                                                onClick={() => handleDownloadFile(format.url, result.title + '.mp4')}
                                            >
                                                Download
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(format.url, '_blank')}
                                                icon={ExternalLink}
                                            >
                                                Open
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="mt-6 p-4 bg-[#A8C7FA]/10 rounded-xl border border-[#A8C7FA]/20 text-sm text-[#A8C7FA] flex gap-3 items-start">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>
                                    If the download doesn't start automatically, click "Open" to view the raw file, then right-click and select "Save Video As".
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
            Powered by RapidAPI. This tool is for educational purposes only. Please respect copyright laws.
        </div>
      </div>
    </div>
  );
};