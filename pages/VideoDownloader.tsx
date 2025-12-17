import React, { useState } from 'react';
import { Button, Card, Input, Badge } from '../components/UI';
import { Download, Link as LinkIcon, Youtube, Facebook, Instagram, Video, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setResult(null);
    setError('');

    // Simulate API processing delay
    setTimeout(() => {
        setLoading(false);
        if (url.includes('youtube') || url.includes('youtu.be') || url.includes('facebook') || url.includes('instagram')) {
             setResult({
                 title: 'Amazing Video Content - ( viral video )',
                 thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                 duration: '10:05',
                 source: url.includes('youtube') ? 'YouTube' : url.includes('facebook') ? 'Facebook' : 'Instagram',
                 formats: [
                     { quality: '1080p (HD)', size: '145 MB', type: 'mp4' },
                     { quality: '720p', size: '85 MB', type: 'mp4' },
                     { quality: '480p', size: '45 MB', type: 'mp4' },
                     { quality: 'Audio Only', size: '12 MB', type: 'mp3' }
                 ]
             });
        } else {
            setError('Unsupported URL or private video. Please try a public link from YouTube, Facebook, or Instagram.');
        }
    }, 2000);
  };

  const simulateDownload = (format: any) => {
      alert(`Starting download for: ${result.title} [${format.quality}]`);
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

        <Card className="p-8 md:p-10 mb-8 bg-[#1E1F20] border-t-4 border-t-[#6DD58C]">
            <form onSubmit={handleDownload} className="relative">
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
                    <Button size="lg" className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3] h-auto py-4 px-8" isLoading={loading} icon={Download}>
                        Download
                    </Button>
                </div>
                <div className="flex justify-center gap-6 mt-6 text-[#8E918F] text-sm">
                    <span className="flex items-center gap-2"><Youtube className="w-4 h-4" /> YouTube</span>
                    <span className="flex items-center gap-2"><Facebook className="w-4 h-4" /> Facebook</span>
                    <span className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</span>
                </div>
            </form>
        </Card>

        {error && (
            <div className="bg-[#370007] border border-[#F2B8B5]/20 text-[#FFB4AB] p-4 rounded-xl flex items-center gap-3 mb-8 animate-fadeIn">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
            </div>
        )}

        {result && (
            <div className="animate-slideUp">
                <Card className="p-6 bg-[#131314] border border-[#444746] overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-64 flex-shrink-0">
                            <div className="aspect-video rounded-xl overflow-hidden relative group">
                                <img src={result.thumbnail} alt="Video Thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Video className="w-8 h-8 text-white opacity-80" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                    {result.duration}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge color="blue">{result.source}</Badge>
                                <span className="text-[#6DD58C] text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#E3E3E3] mb-6 line-clamp-2">{result.title}</h3>
                            
                            <div className="space-y-3">
                                <p className="text-sm text-[#8E918F] font-medium uppercase tracking-wider mb-2">Select Quality</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {result.formats.map((format: any, idx: number) => (
                                        <button 
                                            key={idx}
                                            onClick={() => simulateDownload(format)}
                                            className="flex items-center justify-between p-3 rounded-lg border border-[#444746] bg-[#1E1F20] hover:bg-[#2D2E30] hover:border-[#6DD58C] transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded ${format.type === 'mp3' ? 'bg-[#9B72CB]/20 text-[#9B72CB]' : 'bg-[#6DD58C]/20 text-[#6DD58C]'}`}>
                                                    {format.type === 'mp3' ? 'MP3' : 'MP4'}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-[#E3E3E3] font-medium text-sm">{format.quality}</div>
                                                    <div className="text-[#8E918F] text-xs">{format.size}</div>
                                                </div>
                                            </div>
                                            <Download className="w-4 h-4 text-[#8E918F] group-hover:text-[#E3E3E3]" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
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