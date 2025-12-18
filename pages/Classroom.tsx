
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Course, Module, Lesson, User } from '../types';
// Fixed import: Loader2 is from lucide-react, not UI
import { Button, Card, Badge } from '../components/UI';
import { useFeedback } from '../App';
import { PlayCircle, CheckCircle, Menu, X, ChevronRight, ChevronLeft, ChevronDown, MessageCircle, Send, Loader2 } from 'lucide-react';

export const Classroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getCourseById(id);
        if (data) {
          setCourse(data);
          // Set first lesson as default
          if (data.modules?.length > 0 && data.modules[0].lessons?.length > 0) {
            setActiveLesson(data.modules[0].lessons[0]);
          }
        }
      } catch (err) {
        showToast("Error loading classroom content", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-[#A8C7FA]" /></div>;
  if (!course) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center"><Badge color="red" className="mb-4">404</Badge><h1 className="text-xl font-bold">Course content unavailable.</h1><Button className="mt-6" onClick={() => navigate('/training')}>Back to Academy</Button></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0E0E0E]">
      {/* Sidebar */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-[#1E1F20] border-r border-[#444746] transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}>
        <div className="p-6 border-b border-[#444746] flex items-center justify-between">
            <h2 className="font-bold text-[#E3E3E3] truncate text-sm">{course.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#C4C7C5]"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto h-full p-4 space-y-2">
            {course.modules.map((m, mIdx) => (
                <div key={m.id} className="space-y-1">
                    <div className="px-4 py-2 text-[10px] font-black uppercase text-[#8E918F] tracking-widest">Module {mIdx + 1}</div>
                    {m.lessons.map(l => (
                        <button 
                            key={l.id} 
                            onClick={() => { setActiveLesson(l); if(window.innerWidth < 1024) setSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all ${activeLesson?.id === l.id ? 'bg-[#A8C7FA]/10 text-[#A8C7FA]' : 'text-[#8E918F] hover:bg-[#131314]'}`}
                        >
                            <PlayCircle className="w-4 h-4" />
                            <span className="truncate">{l.title}</span>
                        </button>
                    ))}
                </div>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#444746] bg-[#131314]">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#C4C7C5] lg:hidden"><Menu className="w-6 h-6" /></button>
            <h3 className="text-sm font-bold text-[#E3E3E3] truncate">{activeLesson?.title || 'Select a lesson'}</h3>
            <button onClick={() => navigate('/training')} className="text-[#8E918F] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12">
            <div className="max-w-4xl mx-auto">
                {activeLesson ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {activeLesson.type === 'video' ? (
                            <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-[#444746]">
                                <iframe 
                                    src={activeLesson.content.replace('watch?v=', 'embed/')} 
                                    className="w-full h-full" 
                                    frameBorder="0" 
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <Card className="p-8 lg:p-12">
                                <h1 className="text-3xl font-bold mb-8">{activeLesson.title}</h1>
                                <div className="prose prose-invert max-w-none text-[#C4C7C5] leading-relaxed whitespace-pre-wrap">
                                    {activeLesson.content}
                                </div>
                            </Card>
                        )}
                        <div className="flex justify-between items-center pt-8">
                             <Button variant="outline" icon={ChevronLeft}>Previous</Button>
                             <Button icon={ChevronRight}>Mark Complete & Next</Button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#5E5E5E]">
                        <PlayCircle className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a lesson from the sidebar to begin.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
