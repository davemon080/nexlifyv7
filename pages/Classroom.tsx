import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../services/mockData';
import { Course, Module, Lesson } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { PlayCircle, CheckCircle, Lock, Menu, FileText, Video, X, ChevronRight } from 'lucide-react';

export const Classroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<Module | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
  // Default to true on desktop, false on mobile. Handled by initial check or effect.
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    // Basic check for "enrollment"
    const isEnrolled = localStorage.getItem(`enrolled_${id}`) === 'true';
    if (!isEnrolled) {
      navigate(`/training/${id}`);
      return;
    }

    const load = async () => {
      if (id) {
        const c = await getCourseById(id);
        if (c) {
          setCourse(c);
          setActiveModule(c.modules[0]);
          setActiveLesson(c.modules[0].lessons[0]);
        }
      }
    };
    load();

    const handleResize = () => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        } else {
            setSidebarOpen(false);
        }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [id, navigate]);

  if (!course || !activeModule || !activeLesson) return <div className="min-h-screen bg-[#131314]"></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-50 h-full w-80 bg-[#1E1F20] border-r border-[#444746] 
        transform transition-transform duration-300 ease-in-out md:relative md:transform-none 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-[#444746] flex justify-between items-center h-16">
          <div>
            <h2 className="font-bold text-[#E3E3E3] text-sm uppercase tracking-wide truncate max-w-[200px]">{course.title}</h2>
            <div className="text-xs text-[#8E918F]">Week {course.modules.findIndex(m => m.id === activeModule.id) + 1} of 12</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#C4C7C5]">
             <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100%-64px)] pb-20">
          {course.modules.map((module) => (
            <div key={module.id} className="border-b border-[#444746]/50">
              <div 
                className={`p-4 cursor-pointer hover:bg-[#2D2E30] transition-colors ${activeModule.id === module.id ? 'bg-[#2D2E30]' : ''}`}
                onClick={() => setActiveModule(module)}
              >
                <div className="flex justify-between items-center">
                    <h3 className={`text-sm font-medium leading-tight ${activeModule.id === module.id ? 'text-[#A8C7FA]' : 'text-[#C4C7C5]'}`}>
                        {module.title}
                    </h3>
                    {module.isLocked ? <Lock className="w-3 h-3 text-[#5E5E5E]" /> : null}
                </div>
              </div>
              
              {/* Lessons expansion */}
              {activeModule.id === module.id && (
                <div className="bg-[#131314]">
                  {module.lessons.map(lesson => (
                    <div 
                      key={lesson.id} 
                      className={`pl-8 pr-4 py-3 flex items-start gap-3 cursor-pointer text-xs ${activeLesson.id === lesson.id ? 'text-[#6DD58C] bg-[#6DD58C]/10' : 'text-[#8E918F] hover:text-[#E3E3E3]'}`}
                      onClick={() => {
                          setActiveLesson(lesson);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                    >
                      <div className="mt-0.5">{lesson.type === 'video' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}</div>
                      <span className="leading-snug">{lesson.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#131314] overflow-y-auto w-full relative">
        <div className="px-4 py-3 flex items-center border-b border-[#444746] bg-[#1E1F20]/50 backdrop-blur sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3 text-[#C4C7C5] hover:text-[#E3E3E3]">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center text-sm overflow-hidden whitespace-nowrap">
            <span className="text-[#8E918F] truncate max-w-[100px] sm:max-w-xs">{activeModule.title}</span>
            <ChevronRight className="w-4 h-4 mx-1 text-[#444746] flex-shrink-0" />
            <span className="text-[#E3E3E3] font-medium truncate">{activeLesson.title}</span>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
            {activeLesson.type === 'video' ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-[#444746] mb-6 md:mb-8">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={activeLesson.content} 
                        title="Video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <Card className="p-6 md:p-8 mb-6 md:mb-8 min-h-[300px]">
                    <h2 className="text-xl md:text-2xl font-bold text-[#E3E3E3] mb-4 md:mb-6">{activeLesson.title}</h2>
                    <div className="prose prose-invert max-w-none text-[#C4C7C5] text-sm md:text-base">
                        <p>{activeLesson.content}</p>
                        <p className="mt-4">Detailed reading material would appear here...</p>
                    </div>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pb-12">
                <Button variant="outline" className="w-full sm:w-auto" disabled>Previous Lesson</Button>
                <Button variant="primary" className="w-full sm:w-auto">Mark as Complete & Next</Button>
            </div>
        </div>
      </div>
    </div>
  );
};