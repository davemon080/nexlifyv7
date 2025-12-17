import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCompletedLessons, saveCompletedLesson } from '../services/mockData';
import { Course, Module, Lesson } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { PlayCircle, CheckCircle, Lock, Menu, FileText, Video, X, ChevronRight, ChevronLeft } from 'lucide-react';

export const Classroom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<Module | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    // Basic check for "enrollment"
    const isEnrolled = localStorage.getItem(`enrolled_${id}`) === 'true';
    if (!isEnrolled) {
      // Allow if admin or specific user override, otherwise redirect
      const user = localStorage.getItem('currentUser');
      if(user && JSON.parse(user).enrolledCourses?.includes(id)) {
          // OK
      } else {
        navigate(`/training/${id}`);
        return;
      }
    }

    const load = async () => {
      if (id) {
        const c = await getCourseById(id);
        if (c && c.modules.length > 0) {
          setCourse(c);
          
          // Load progress
          const completed = getCompletedLessons(id);
          setCompletedLessonIds(completed);

          // Attempt to find first unfinished lesson
          let found = false;
          for(const m of c.modules) {
              for(const l of m.lessons) {
                  if(!completed.includes(l.id)) {
                      setActiveModule(m);
                      setActiveLesson(l);
                      found = true;
                      break;
                  }
              }
              if(found) break;
          }

          // If all completed or none found, default to first
          if(!found) {
            setActiveModule(c.modules[0]);
            setActiveLesson(c.modules[0].lessons[0]);
          }
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

  const handleMarkComplete = () => {
      if(!course || !activeLesson || !activeModule) return;
      
      // 1. Save Progress
      saveCompletedLesson(course.id, activeLesson.id);
      if(!completedLessonIds.includes(activeLesson.id)) {
          setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
      }

      // 2. Navigate Next
      handleNext();
  };

  const handleNext = () => {
      if(!course || !activeLesson || !activeModule) return;

      const currentLessonIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
      
      // Next lesson in current module
      if (currentLessonIdx < activeModule.lessons.length - 1) {
          setActiveLesson(activeModule.lessons[currentLessonIdx + 1]);
      } 
      // Next module
      else {
          const currentModuleIdx = course.modules.findIndex(m => m.id === activeModule.id);
          if (currentModuleIdx < course.modules.length - 1) {
              const nextModule = course.modules[currentModuleIdx + 1];
              setActiveModule(nextModule);
              if(nextModule.lessons.length > 0) {
                  setActiveLesson(nextModule.lessons[0]);
              }
          } else {
              alert("Congratulations! You have completed the course.");
          }
      }
  };

  const handlePrev = () => {
      if(!course || !activeLesson || !activeModule) return;

      const currentLessonIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
      
      // Prev lesson in current module
      if (currentLessonIdx > 0) {
          setActiveLesson(activeModule.lessons[currentLessonIdx - 1]);
      } 
      // Prev module
      else {
          const currentModuleIdx = course.modules.findIndex(m => m.id === activeModule.id);
          if (currentModuleIdx > 0) {
              const prevModule = course.modules[currentModuleIdx - 1];
              setActiveModule(prevModule);
              if(prevModule.lessons.length > 0) {
                  setActiveLesson(prevModule.lessons[prevModule.lessons.length - 1]);
              }
          }
      }
  };

  const isCompleted = (lessonId: string) => completedLessonIds.includes(lessonId);

  if (!course || !activeModule || !activeLesson) return <div className="min-h-screen bg-[#131314] flex items-center justify-center text-[#E3E3E3]">Loading Classroom...</div>;

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
            <div className="text-xs text-[#8E918F]">Week {course.modules.findIndex(m => m.id === activeModule.id) + 1} of {course.modules.length}</div>
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
                      className={`pl-8 pr-4 py-3 flex items-start gap-3 cursor-pointer text-xs group ${activeLesson.id === lesson.id ? 'bg-[#A8C7FA]/10' : 'hover:bg-[#1E1F20]'}`}
                      onClick={() => {
                          setActiveLesson(lesson);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                          {isCompleted(lesson.id) ? (
                              <CheckCircle className="w-4 h-4 text-[#6DD58C]" />
                          ) : (
                              lesson.type === 'video' ? <Video className={`w-4 h-4 ${activeLesson.id === lesson.id ? 'text-[#A8C7FA]' : 'text-[#5E5E5E]'}`} /> : <FileText className={`w-4 h-4 ${activeLesson.id === lesson.id ? 'text-[#A8C7FA]' : 'text-[#5E5E5E]'}`} />
                          )}
                      </div>
                      <span className={`leading-snug ${activeLesson.id === lesson.id ? 'text-[#A8C7FA] font-medium' : isCompleted(lesson.id) ? 'text-[#C4C7C5] line-through decoration-[#5E5E5E]' : 'text-[#8E918F]'}`}>
                          {lesson.title}
                      </span>
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
          <div className="ml-auto flex items-center gap-2">
               {isCompleted(activeLesson.id) && <Badge color="green">Completed</Badge>}
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
                        <p className="mt-4 p-4 bg-[#1E1F20] border border-[#444746] rounded-lg">
                           Review the material above before proceeding to the next lesson.
                        </p>
                    </div>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 pb-12 border-t border-[#444746] pt-8">
                <Button variant="outline" className="w-full sm:w-auto" onClick={handlePrev} icon={ChevronLeft}>
                    Previous
                </Button>
                <div className="flex gap-4 w-full sm:w-auto">
                    {!isCompleted(activeLesson.id) && (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                            saveCompletedLesson(course.id, activeLesson.id);
                            setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
                        }}>
                            Mark Complete
                        </Button>
                    )}
                    <Button variant="primary" className="w-full sm:w-auto bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]" onClick={handleMarkComplete}>
                        {isCompleted(activeLesson.id) ? 'Next Lesson' : 'Complete & Next'} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};