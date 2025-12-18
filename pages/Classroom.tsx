
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getCompletedLessons, saveCompletedLesson, getCurrentUser, postStudentQuestion, getQuestionsByLesson } from '../services/mockData';
import { Course, Module, Lesson, TutorQuestion } from '../types';
import { Button, Card, Badge, Textarea } from '../components/UI';
import { useFeedback } from '../App';
import { PlayCircle, CheckCircle, Lock, Menu, FileText, Video, X, ChevronRight, ChevronLeft, ChevronDown, HelpCircle, Download, ExternalLink, Loader2, MessageCircle, Send, User } from 'lucide-react';

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1];
            const ampPos = videoId.indexOf('&');
            if (ampPos !== -1) videoId = videoId.substring(0, ampPos);
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1];
        } else if (url.includes('vimeo.com/')) {
            videoId = url.split('vimeo.com/')[1];
            return `https://player.vimeo.com/video/${videoId}`;
        } else if (url.includes('youtube.com/embed/')) return url;
        else return url;
        return `https://www.youtube.com/embed/${videoId}`;
    } catch { return url; }
};

export const Classroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, celebrate } = useFeedback();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<Module | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState<'content' | 'support'>('content');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (id) {
        try {
            const c = await api.getCourseById(id);
            if (c && c.modules.length > 0) {
              setCourse(c);
              const completed = getCompletedLessons(id);
              setCompletedIds(completed);
              setActiveModule(c.modules[0]);
              setActiveLesson(c.modules[0].lessons[0]);
            }
        } catch (e) {
            console.error("Course load failed");
        }
      }
    };
    load();
  }, [id]);

  const handleDownloadInternal = async (fileId: string) => {
    setDownloading(true);
    try {
        const material = await api.getMaterial(fileId);
        const link = document.createElement('a');
        link.href = material.file_data; // This is the base64 string
        link.download = material.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Download started", "success");
    } catch (err) {
        showToast("Failed to download material", "error");
    } finally {
        setDownloading(false);
    }
  };

  const handleMarkComplete = () => {
      if(!course || !activeLesson) return;
      saveCompletedLesson(course.id, activeLesson.id);
      if(!completedIds.includes(activeLesson.id)) setCompletedIds([...completedIds, activeLesson.id]);
      showToast(`${activeLesson.title} completed!`, 'success');
  };

  if (!course || !activeModule || !activeLesson) return <div className="h-screen bg-[#131314] flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative bg-[#0E0E0E] flex-col md:flex-row">
      <div className={`fixed lg:relative inset-y-0 left-0 z-[100] w-full sm:w-80 bg-[#1E1F20] border-r border-[#444746] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#444746] flex items-center justify-between sticky top-0 bg-[#1E1F20] z-10">
            <h2 className="font-bold text-[#E3E3E3] truncate text-xs uppercase tracking-[0.2em]">{course.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 -mr-2 text-[#C4C7C5]"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-74px)] custom-scrollbar pb-20">
            {course.modules.map((m, mIdx) => (
                <div key={m.id} className="border-b border-[#444746]/30">
                    <div 
                        className={`p-5 cursor-pointer flex justify-between items-center transition-colors ${activeModule.id === m.id ? 'bg-[#A8C7FA]/5 text-[#A8C7FA]' : 'text-[#8E918F] hover:bg-[#131314]'}`} 
                        onClick={() => setActiveModule(m)}
                    >
                        <span className="text-xs font-bold">{m.title}</span>
                        {activeModule.id === m.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                    </div>
                    {activeModule.id === m.id && (
                        <div className="bg-[#131314]/80">
                            {m.lessons.map((l, lIdx) => (
                                <div 
                                    key={l.id} 
                                    className={`pl-10 pr-6 py-4 cursor-pointer flex items-center gap-4 text-xs transition-all border-l-2 ${activeLesson.id === l.id ? 'text-[#A8C7FA] bg-[#A8C7FA]/10 border-[#A8C7FA]' : 'text-[#8E918F] border-transparent hover:text-[#C4C7C5]'}`} 
                                    onClick={() => setActiveLesson(l)}
                                >
                                    <span className="truncate flex-1 font-medium">{lIdx + 1}. {l.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full relative h-full">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#444746] bg-[#131314]/95 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#C4C7C5] hover:bg-[#1E1F20] rounded-xl lg:hidden">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="truncate">
                    <h3 className="text-sm font-bold text-[#E3E3E3] truncate">{activeLesson.title}</h3>
                </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/training')}>Exit</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-32">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
                {activeLesson.type === 'video' ? (
                    <div className="aspect-video bg-black rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl border border-[#444746]">
                        <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(activeLesson.content)} frameBorder="0" allowFullScreen></iframe>
                    </div>
                ) : (
                    <Card className="p-6 md:p-12 border-[#444746] rounded-3xl md:rounded-[48px] bg-[#1E1F20]/50">
                        <div className="prose prose-invert max-w-none text-[#C4C7C5] leading-loose whitespace-pre-wrap font-light">
                            {activeLesson.content}
                        </div>
                    </Card>
                )}

                {activeLesson.fileUrl && (
                    <div className="p-6 md:p-10 bg-[#131314] rounded-3xl border border-[#444746] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA] shrink-0"><FileText className="w-8 h-8" /></div>
                            <div>
                                <h4 className="font-bold text-[#E3E3E3] text-base md:text-lg">Lesson Materials</h4>
                                <p className="text-xs text-[#8E918F] mt-1 uppercase tracking-widest font-black">PDF / DOC Resource</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            {activeLesson.fileUrl.startsWith('internal://') ? (
                                <Button 
                                    className="w-full sm:w-auto px-8" 
                                    icon={downloading ? Loader2 : Download} 
                                    isLoading={downloading}
                                    onClick={() => handleDownloadInternal(activeLesson.fileUrl!.replace('internal://', ''))}
                                >
                                    Download File
                                </Button>
                            ) : (
                                <a 
                                    href={activeLesson.fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-8 py-3 bg-[#A8C7FA] text-[#062E6F] rounded-2xl font-bold text-sm"
                                >
                                    <ExternalLink className="w-4 h-4" /> Open External Link
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="px-4 md:px-8 py-6 border-t border-[#444746] bg-[#131314] flex flex-row justify-between items-center fixed md:relative bottom-0 left-0 right-0 z-30">
            <Button variant="outline" icon={ChevronLeft} onClick={() => {}}>Previous</Button>
            <Button className="bg-[#6DD58C] text-[#0F5223]" onClick={handleMarkComplete}>Mark Complete & Next <ChevronRight className="ml-2 w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};
