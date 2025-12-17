import React, { useState, useEffect } from 'react';
import { Button, Card, Badge } from '../components/UI';
import { Download, Link as LinkIcon, Youtube, Facebook, Instagram, Video, CheckCircle, Loader2, AlertCircle, FileVideo, RefreshCw } from 'lucide-react';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusStage, setStatusStage] = useState(''); // 'resolving', 'downloading', 'converting', 'ready'
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Helper to get YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setProcessing(true);
    setResult(null);
    setError('');
    setProgress(0);
    setStatusStage('resolving');

    // 1. Resolve URL (Simulated)
    setTimeout(() => {
        const ytId = getYouTubeId(url);
        
        // Basic Validation simulation
        if (!url.includes('http')) {
            setError('Please enter a valid URL starting with http:// or https://');
            setProcessing(false);
            return;
        }

        // 2. Start Download Simulation
        setStatusStage('downloading');
        let currentProgress = 0;
        
        const interval = setInterval(() => {
            currentProgress += Math.floor(Math.random() * 15) + 5;
            
            if (currentProgress > 60 && statusStage !== 'converting') {
                 setStatusStage('converting');
            }
            
            if (currentProgress >= 100) {
                clearInterval(interval);
                setProgress(100);
                finalizeResult(ytId);
            } else {
                setProgress(currentProgress);
            }
        }, 800);

    }, 1500);
  };

  const finalizeResult = (ytId: string | null) => {
      setProcessing(false);
      setStatusStage('ready');
      
      const isYouTube = !!ytId;
      
      setResult({
          title: isYouTube ? 'Extracted Video Content' : 'Social Media Video Clip',
          thumbnail: isYouTube 
            ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` 
            : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
          duration: '04:20',
          source: isYouTube ? 'YouTube' : 'External Source',
          embedUrl: isYouTube ? `https://www.youtube.com/embed/${ytId}` : null,
          formats: [
              { quality: '1080p (HD)', size: '145 MB', type: 'mp4', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }, // Sample video for demo
              { quality: '720p', size: '85 MB', type: 'mp4', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
              { quality: '480p', size: '45 MB', type: 'mp4', url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' },
              { quality: 'Audio Only', size: '12 MB', type: 'mp3', url: '#' }
          ]
      });
  };

  const handleDownloadFile = async (format: any) => {
      // In a real app, this would be a direct link to the backend stream.
      // Here we simulate the browser "serving" the file by creating a blob or opening the link.
      
      if(format.url === '#') {
          alert("Audio extraction requires server-side processing. (Demo Mode)");
          return;
      }

      const confirm = window.confirm(`Start downloading ${result.title} in ${format.quality}?`);
      if(!confirm) return;

      // Create a fake downloading anchor to simulate the UX
      try {
          // For demo purposes, we fetch a small sample file to show the browser native download behavior
          const res = await fetch(format.url);
          const blob = await res.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `nexlify_video_${Date.now()}.${format.type}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(blobUrl);
          document.body.removeChild(a);
      } catch (e) {
          // Fallback if CORS blocks the sample fetch
          window.open(format.url, '_blank');
      }
  };

  const reset = () => {
      setResult(null);
      setUrl('');
      setProgress(0);
      setStatusStage('');
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <Badge color="green"><div className="flex items-center gap-2"><Download className="w-3 h-3" /> Free Tool</div></Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mt-4 mb-4">Universal Video Downloader</h1>
            <p className="text-[#C4C7C5] max-w-2xl mx-auto">
                Download videos from your favorite social media platforms in high quality. No watermark, unlimited usage.
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
                                placeholder="Paste video URL here (e.g., https://youtube.com/...)"
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
                    <div className="mb-6 relative h-4 w-full bg-[#131314] rounded-full overflow-hidden border border-[#444746]">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#6DD58C] to-[#A8C7FA] transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#6DD58C] animate-spin" />
                        <h3 className="text-xl font-bold text-[#E3E3E3] capitalize">
                            {statusStage === 'resolving' && 'Resolving URL...'}
                            {statusStage === 'downloading' && 'Fetching Video Stream...'}
                            {statusStage === 'converting' && 'Processing Formats...'}
                        </h3>
                        <p className="text-[#8E918F] text-sm">{progress}% Complete</p>
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
                                {result.embedUrl ? (
                                    <iframe 
                                        src={result.embedUrl} 
                                        title="Video Preview"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#131314]">
                                        <div className="text-center">
                                            <img src={result.thumbnail} alt="thumb" className="w-full h-full object-cover opacity-50 absolute inset-0" />
                                            <div className="relative z-10 p-4 bg-black/60 rounded-xl backdrop-blur-sm">
                                                <Video className="w-12 h-12 text-[#E3E3E3] mx-auto mb-2" />
                                                <p className="text-[#E3E3E3] font-medium">Preview Unavailable</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold text-[#E3E3E3] line-clamp-2">{result.title}</h4>
                                <div className="flex gap-3 mt-2 text-sm text-[#8E918F]">
                                    <span className="bg-[#131314] px-2 py-1 rounded border border-[#444746]">{result.source}</span>
                                    <span className="bg-[#131314] px-2 py-1 rounded border border-[#444746]">{result.duration}</span>
                                </div>
                            </div>
                        </div>

                        {/* Download Options */}
                        <div className="w-full lg:w-1/2 space-y-4">
                            <p className="text-sm text-[#8E918F] font-medium uppercase tracking-wider mb-2">Available Formats</p>
                            {result.formats.map((format: any, idx: number) => (
                                <div 
                                    key={idx}
                                    className="flex items-center justify-between p-4 rounded-xl border border-[#444746] bg-[#131314] hover:border-[#6DD58C] transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${format.type === 'mp3' ? 'bg-[#9B72CB]/20 text-[#9B72CB]' : 'bg-[#6DD58C]/20 text-[#6DD58C]'}`}>
                                            {format.type === 'mp3' ? <FileVideo className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="text-[#E3E3E3] font-bold">{format.quality}</div>
                                            <div className="text-[#8E918F] text-xs uppercase">{format.type} • {format.size}</div>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        className={format.type === 'mp3' ? 'bg-[#9B72CB] text-white hover:bg-[#8A58C2]' : 'bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]'}
                                        icon={Download}
                                        onClick={() => handleDownloadFile(format)}
                                    >
                                        Download
                                    </Button>
                                </div>
                            ))}
                            
                            <div className="mt-6 p-4 bg-[#A8C7FA]/10 rounded-xl border border-[#A8C7FA]/20 text-sm text-[#A8C7FA] flex gap-3 items-start">
                                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p>Your download link has been generated successfully. Click the button to save the file to your device.</p>
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

        {/* SEO Content / Guide */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
                <div className="w-12 h-12 bg-[#1E1F20] rounded-full flex items-center justify-center mx-auto mb-4 text-[#A8C7FA] border border-[#444746]">
                    1
                </div>
                <h3 className="text-[#E3E3E3] font-bold mb-2">Copy URL</h3>
                <p className="text-[#8E918F] text-sm">Copy the video link from the app or browser address bar.</p>
            </div>
            <div className="p-6">
                <div className="w-12 h-12 bg-[#1E1F20] rounded-full flex items-center justify-center mx-auto mb-4 text-[#A8C7FA] border border-[#444746]">
                    2
                </div>
                <h3 className="text-[#E3E3E3] font-bold mb-2">Paste & Click</h3>
                <p className="text-[#8E918F] text-sm">Paste the link into the box above and hit the Download button.</p>
            </div>
            <div className="p-6">
                <div className="w-12 h-12 bg-[#1E1F20] rounded-full flex items-center justify-center mx-auto mb-4 text-[#A8C7FA] border border-[#444746]">
                    3
                </div>
                <h3 className="text-[#E3E3E3] font-bold mb-2">Save File</h3>
                <p className="text-[#8E918F] text-sm">Choose your preferred quality and save the video to your device.</p>
            </div>
        </div>
      </div>
    </div>
  );
};