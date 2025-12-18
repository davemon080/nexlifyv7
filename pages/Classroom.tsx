
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCompletedLessons, saveCompletedLesson } from '../services/mockData';
import { Course, Module, Lesson } from '../types';
import { Button, Card, Badge } from '../components/UI';
// Added ChevronDown to the imports from lucide-react
import { PlayCircle, CheckCircle, Lock, Menu, FileText, Video, X, ChevronRight, ChevronLeft, ChevronDown, HelpCircle, Download, ExternalLink, Loader2 } from 'lucide-react';

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
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<Module | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const isEnrolled = localStorage.getItem(`enrolled_${id}`) === 'true';
    const user = localStorage.getItem('currentUser');
    if (!isEnrolled && !(user && JSON.parse(user).enrolledCourses?.includes(id)) && !(user && JSON.parse(user).role === 'admin')) {
      navigate(`/training/${id}`);
      return;
    }

    const load = async () => {
      if (id) {
        try {
            const c = await getCourseById(id);
            if (c && c.modules.length > 0) {
              setCourse(c);
              const completed = getCompletedLessons(id);
              setCompletedIds(completed);

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
              if(!found) {
                setActiveModule(c.modules[0]);
                setActiveLesson(c.modules[0].lessons[0]);
              }
            }
        } catch (e) {
            console.error("Course load failed");
        }
      }
    };
    load();
    const handleResize = () => {
        if (window.innerWidth < 1024) setSidebarOpen(false);
        else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, navigate]);

  useEffect(() => { 
      setQuizAnswers({}); 
      setQuizSubmitted(false); 
      setQuizScore(0); 
      // Scroll content area to top on lesson change
      const contentArea = document.getElementById('classroom-content');
      if (contentArea) contentArea.scrollTo(0, 0);
  }, [activeLesson]);

  const handleMarkComplete = () => {
      if(!course || !activeLesson) return;
      if (activeLesson.type === 'quiz' && (!quizSubmitted || quizScore < 50)) {
          alert("Score at least 50% to pass this quiz."); return;
      }
      saveCompletedLesson(course.id, activeLesson.id);
      if(!completedIds.includes(activeLesson.id)) setCompletedIds([...completedIds, activeLesson.id]);
      handleNext();
  };

  const handleNext = () => {
      if(!course || !activeLesson || !activeModule) return;
      const lIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
      if (lIdx < activeModule.lessons.length - 1) { 
          setActiveLesson(activeModule.lessons[lIdx + 1]); 
      } 
      else {
          const mIdx = course.modules.findIndex(m => m.id === activeModule.id);
          if (mIdx < course.modules.length - 1) {
              setActiveModule(course.modules[mIdx + 1]);
              setActiveLesson(course.modules[mIdx + 1].lessons[0]);
          } else { 
              alert("Congratulations! You've completed the curriculum."); 
              navigate('/profile');
          }
      }
  };

  const handlePrevious = () => {
    if(!course || !activeLesson || !activeModule) return;
    const lIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
    if (lIdx > 0) {
        setActiveLesson(activeModule.lessons[lIdx - 1]);
    } else {
        const mIdx = course.modules.findIndex(m => m.id === activeModule.id);
        if (mIdx > 0) {
            const prevModule = course.modules[mIdx - 1];
            setActiveModule(prevModule);
            setActiveLesson(prevModule.lessons[prevModule.lessons.length - 1]);
        }
    }
  };

  const submitQuiz = () => {
      if (!activeLesson?.questions) return;
      let correct = 0;
      activeLesson.questions.forEach(q => { if (quizAnswers[q.id] === q.correctAnswer) correct++; });
      setQuizScore((correct / activeLesson.questions.length) * 100);
      setQuizSubmitted(true);
  };

  if (!course || !activeModule || !activeLesson) return <div className="h-screen bg-[#131314] flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative bg-[#0E0E0E] flex-col md:flex-row">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/90 z-[90] lg:hidden animate-in fade-in duration-300" 
            onClick={() => setSidebarOpen(false)} 
          />
      )}
      
      {/* Sidebar Navigation */}
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
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase opacity-60">Module {mIdx + 1}</span>
                            <span className="text-xs font-bold">{m.title}</span>
                        </div>
                        {m.isLocked ? <Lock className="w-3 h-3 opacity-50" /> : activeModule.id === m.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                    </div>
                    {activeModule.id === m.id && (
                        <div className="bg-[#131314]/80">
                            {m.lessons.map((l, lIdx) => (
                                <div 
                                    key={l.id} 
                                    className={`pl-10 pr-6 py-4 cursor-pointer flex items-center gap-4 text-xs transition-all border-l-2 ${activeLesson.id === l.id ? 'text-[#A8C7FA] bg-[#A8C7FA]/10 border-[#A8C7FA]' : 'text-[#8E918F] border-transparent hover:text-[#C4C7C5]'}`} 
                                    onClick={() => {
                                        setActiveLesson(l);
                                        if (window.innerWidth < 1024) setSidebarOpen(false);
                                    }}
                                >
                                    <div className="flex-shrink-0">
                                        {completedIds.includes(l.id) ? (
                                            <CheckCircle className="w-4 h-4 text-[#6DD58C]" />
                                        ) : l.type === 'video' ? (
                                            <Video className="w-4 h-4" />
                                        ) : l.type === 'quiz' ? (
                                            <HelpCircle className="w-4 h-4" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="truncate flex-1 font-medium">{lIdx + 1}. {l.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full relative h-full">
        {/* Top bar */}
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#444746] bg-[#131314]/95 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-3 md:gap-6 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#C4C7C5] hover:bg-[#1E1F20] rounded-xl lg:hidden">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="truncate">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[9px] md:text-[10px] text-[#A8C7FA] uppercase font-black tracking-widest truncate">{activeModule.title}</p>
                        {completedIds.includes(activeLesson.id) && <Badge color="green" className="text-[8px] py-0 px-1.5 uppercase font-black">Passed</Badge>}
                    </div>
                    <h3 className="text-sm font-bold text-[#E3E3E3] truncate">{activeLesson.title}</h3>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <Button size="sm" variant="outline" className="hidden sm:flex" onClick={() => navigate('/training')}>Exit</Button>
                <button onClick={() => navigate('/training')} className="sm:hidden p-2 text-[#C4C7C5]">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div id="classroom-content" className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-32">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
                {activeLesson.type === 'video' ? (
                    <div className="aspect-video bg-black rounded-2xl md:rounded-[40px] overflow-hidden shadow-2xl border border-[#444746]">
                        <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(activeLesson.content)} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                ) : activeLesson.type === 'quiz' ? (
                    <Card className="p-6 md:p-12 border-[#444746] rounded-3xl md:rounded-[48px] bg-gradient-to-br from-[#1E1F20] to-[#131314]">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-xl md:text-3xl font-black text-[#E3E3E3] uppercase mb-4 tracking-tight">{activeLesson.title}</h2>
                            {quizSubmitted && (
                                <div className="animate-in zoom-in duration-300">
                                    <Badge color={quizScore >= 50 ? 'green' : 'red'} className="text-sm py-2 px-6">
                                        Performance: {quizScore.toFixed(0)}%
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <div className="space-y-10">
                            {activeLesson.questions?.map((q, idx) => (
                                <div key={q.id} className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#131314] flex items-center justify-center text-xs font-black border border-[#444746] text-[#A8C7FA] shrink-0">{idx + 1}</div>
                                        <p className="text-[#E3E3E3] font-bold text-sm md:text-base pt-1">{q.question}</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-12">
                                        {q.options.map((opt, oIdx) => (
                                            <button 
                                                key={oIdx} 
                                                onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                                                className={`p-4 rounded-2xl text-left text-sm transition-all border-2 ${quizSubmitted ? (oIdx === q.correctAnswer ? 'border-[#6DD58C] bg-[#0F5223]/10 text-[#6DD58C]' : quizAnswers[q.id] === oIdx ? 'border-[#CF6679] bg-[#CF6679]/10 text-[#CF6679]' : 'border-transparent opacity-20') : (quizAnswers[q.id] === oIdx ? 'border-[#A8C7FA] bg-[#A8C7FA]/10 text-[#A8C7FA] shadow-[0_0_15px_rgba(168,199,250,0.15)]' : 'border-[#444746] hover:border-[#8E918F] text-[#C4C7C5] bg-[#1E1F20]/50')}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black uppercase ${quizAnswers[q.id] === oIdx ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#131314] text-[#8E918F]'}`}>{String.fromCharCode(65 + oIdx)}</span>
                                                    {opt}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="pt-6 md:pt-10 flex flex-col gap-4">
                                {!quizSubmitted ? (
                                    <Button 
                                        className="w-full py-5 text-xs font-black uppercase tracking-widest" 
                                        onClick={submitQuiz} 
                                        disabled={Object.keys(quizAnswers).length < (activeLesson.questions?.length || 0)}
                                    >
                                        Process My Responses
                                    </Button>
                                ) : (
                                    quizScore < 50 ? (
                                        <Button variant="outline" className="w-full py-5 text-xs font-black uppercase tracking-widest" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>
                                            Try Again
                                        </Button>
                                    ) : (
                                        <div className="text-center p-6 bg-[#0F5223]/20 rounded-3xl border border-[#6DD58C]/20">
                                            <p className="text-[#6DD58C] text-sm font-bold">Passing score achieved! You can now proceed to the next lesson.</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-6 md:p-12 border-[#444746] rounded-3xl md:rounded-[48px] bg-[#1E1F20]/50">
                        <h2 className="text-2xl md:text-4xl font-black text-[#E3E3E3] uppercase mb-8 md:mb-12 tracking-tight leading-tight">{activeLesson.title}</h2>
                        <div className="prose prose-invert max-w-none text-[#C4C7C5] leading-loose text-sm md:text-lg whitespace-pre-wrap font-light">
                            {activeLesson.content}
                        </div>
                    </Card>
                )}

                {activeLesson.fileUrl && (
                    <div className="p-6 md:p-10 bg-[#131314] rounded-3xl border border-[#444746] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA] shrink-0"><FileText className="w-8 h-8" /></div>
                            <div>
                                <h4 className="font-bold text-[#E3E3E3] text-base md:text-lg">Supplementary Material</h4>
                                <p className="text-xs text-[#8E918F] mt-1 uppercase tracking-widest font-black">Downloadable Resource (PDF/DOC)</p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <a href={activeLesson.fileUrl} target="_blank" className="flex-1 sm:flex-none p-4 bg-[#1E1F20] rounded-2xl hover:text-[#A8C7FA] transition-all flex justify-center border border-[#444746]"><ExternalLink className="w-5 h-5" /></a>
                            <a href={activeLesson.fileUrl} download className="flex-1 sm:flex-none p-4 bg-[#A8C7FA] text-[#062E6F] rounded-2xl hover:scale-105 transition-all flex justify-center"><Download className="w-5 h-5" /></a>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bottom Navigation (Fixed on mobile) */}
        <div className="px-4 md:px-8 py-6 border-t border-[#444746] bg-[#131314] flex flex-row justify-between items-center gap-4 fixed md:relative bottom-0 left-0 right-0 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:shadow-none">
            <button 
                onClick={handlePrevious} 
                className="flex items-center justify-center p-3 md:px-6 md:py-3 rounded-2xl border border-[#444746] text-[#C4C7C5] hover:bg-[#1E1F20] transition-all"
            >
                <ChevronLeft className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline font-bold text-xs uppercase tracking-widest">Back</span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
                <button 
                    onClick={handleNext}
                    className="hidden sm:flex text-xs font-bold text-[#8E918F] hover:text-[#E3E3E3] uppercase tracking-widest mr-4"
                >
                    Skip
                </button>
                <Button 
                    className="bg-[#6DD58C] text-[#0F5223] px-6 md:px-12 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest flex-1 sm:flex-none shadow-[0_4px_20px_rgba(109,213,140,0.2)]" 
                    onClick={handleMarkComplete}
                >
                    Complete <span className="hidden sm:inline">& Continue</span> <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
