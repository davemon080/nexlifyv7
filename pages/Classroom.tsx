import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCompletedLessons, saveCompletedLesson } from '../services/mockData';
import { Course, Module, Lesson } from '../types';
import { Button, Card, Badge } from '../components/UI';
// Added Loader2 to the lucide-react imports
import { PlayCircle, CheckCircle, Lock, Menu, FileText, Video, X, ChevronRight, ChevronLeft, HelpCircle, Download, ExternalLink, Loader2 } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  
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
      }
    };
    load();
    const handleResize = () => setSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [id, navigate]);

  useEffect(() => { setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0); }, [activeLesson]);

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
      if (lIdx < activeModule.lessons.length - 1) { setActiveLesson(activeModule.lessons[lIdx + 1]); } 
      else {
          const mIdx = course.modules.findIndex(m => m.id === activeModule.id);
          if (mIdx < course.modules.length - 1) {
              setActiveModule(course.modules[mIdx + 1]);
              setActiveLesson(course.modules[mIdx + 1].lessons[0]);
          } else { alert("Course Completed!"); }
      }
  };

  const submitQuiz = () => {
      if (!activeLesson?.questions) return;
      let correct = 0;
      activeLesson.questions.forEach(q => { if (quizAnswers[q.id] === q.correctAnswer) correct++; });
      setQuizScore((correct / activeLesson.questions.length) * 100);
      setQuizSubmitted(true);
  };

  if (!course || !activeModule || !activeLesson) return <div className="min-h-screen bg-[#131314] flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative bg-[#0E0E0E]">
      {sidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-[#1E1F20] border-r border-[#444746] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:translate-x-0'}`}>
        <div className="p-6 border-b border-[#444746] flex items-center justify-between">
            <h2 className="font-bold text-[#E3E3E3] truncate text-sm uppercase tracking-widest">{course.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#C4C7C5]"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-74px)] custom-scrollbar">
            {course.modules.map((m, mIdx) => (
                <div key={m.id} className="border-b border-[#444746]/50">
                    <div className={`p-5 cursor-pointer flex justify-between items-center ${activeModule.id === m.id ? 'bg-[#A8C7FA]/5 text-[#A8C7FA]' : 'text-[#8E918F]'}`} onClick={() => setActiveModule(m)}>
                        <span className="text-xs font-black uppercase tracking-widest">Week {mIdx + 1}: {m.title}</span>
                        {m.isLocked ? <Lock className="w-3 h-3" /> : null}
                    </div>
                    {activeModule.id === m.id && (
                        <div className="bg-[#131314]/50">
                            {m.lessons.map(l => (
                                <div key={l.id} className={`pl-10 pr-6 py-3 cursor-pointer flex items-center gap-3 text-xs transition-colors ${activeLesson.id === l.id ? 'text-[#A8C7FA] bg-[#A8C7FA]/10' : 'text-[#5E5E5E] hover:text-[#C4C7C5]'}`} onClick={() => setActiveLesson(l)}>
                                    {completedIds.includes(l.id) ? <CheckCircle className="w-4 h-4 text-[#6DD58C]" /> : l.type === 'video' ? <Video className="w-4 h-4" /> : l.type === 'quiz' ? <HelpCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                    <span className="truncate">{l.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col w-full">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#444746] bg-[#131314]/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[#C4C7C5] hover:bg-[#1E1F20] rounded-xl"><Menu /></button>
                <div className="hidden sm:block">
                    <p className="text-[10px] text-[#5E5E5E] uppercase font-black">{activeModule.title}</p>
                    <h3 className="text-sm font-bold text-[#E3E3E3]">{activeLesson.title}</h3>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {completedIds.includes(activeLesson.id) && <Badge color="green">Lesson Completed</Badge>}
                <Button size="sm" variant="outline" onClick={() => navigate('/training')}>Exit Classroom</Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
                {activeLesson.type === 'video' ? (
                    <div className="aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl border border-[#444746]">
                        <iframe width="100%" height="100%" src={getYouTubeEmbedUrl(activeLesson.content)} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                ) : activeLesson.type === 'quiz' ? (
                    <Card className="p-10 border-[#444746] rounded-[40px]">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-black text-[#E3E3E3] uppercase mb-4">{activeLesson.title}</h2>
                            {quizSubmitted && <Badge color={quizScore >= 50 ? 'green' : 'red'}>Final Score: {quizScore.toFixed(0)}%</Badge>}
                        </div>
                        <div className="space-y-8">
                            {activeLesson.questions?.map((q, idx) => (
                                <div key={q.id} className="space-y-4">
                                    <p className="text-[#E3E3E3] font-bold">Question {idx + 1}: {q.question}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.options.map((opt, oIdx) => (
                                            <button 
                                                key={oIdx} 
                                                onClick={() => !quizSubmitted && setQuizAnswers({...quizAnswers, [q.id]: oIdx})}
                                                className={`p-4 rounded-2xl text-left text-sm transition-all border-2 ${quizSubmitted ? (oIdx === q.correctAnswer ? 'border-[#6DD58C] bg-[#0F5223]/10 text-[#6DD58C]' : quizAnswers[q.id] === oIdx ? 'border-[#CF6679] bg-[#CF6679]/10 text-[#CF6679]' : 'border-transparent opacity-30') : (quizAnswers[q.id] === oIdx ? 'border-[#A8C7FA] bg-[#A8C7FA]/10 text-[#A8C7FA]' : 'border-[#444746] hover:border-[#8E918F] text-[#C4C7C5]')}`}
                                            >{opt}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {!quizSubmitted ? <Button className="w-full mt-10" onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < (activeLesson.questions?.length || 0)}>Submit Quiz Responses</Button> : quizScore < 50 && <Button variant="outline" className="w-full" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>Retry Quiz</Button>}
                        </div>
                    </Card>
                ) : (
                    <Card className="p-10 border-[#444746] rounded-[40px]">
                        <h2 className="text-2xl font-black text-[#E3E3E3] uppercase mb-8">{activeLesson.title}</h2>
                        <div className="prose prose-invert max-w-none text-[#C4C7C5] leading-relaxed whitespace-pre-wrap">{activeLesson.content}</div>
                    </Card>
                )}

                {activeLesson.fileUrl && (
                    <div className="p-8 bg-[#1E1F20] rounded-[32px] border border-[#444746] flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA]"><FileText className="w-8 h-8" /></div>
                            <div>
                                <h4 className="font-bold text-[#E3E3E3]">Downloadable Resource</h4>
                                <p className="text-xs text-[#8E918F]">PDF/Doc Supplement for this lesson</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={activeLesson.fileUrl} target="_blank" className="p-4 bg-[#131314] rounded-2xl hover:text-[#A8C7FA] transition-all"><ExternalLink className="w-6 h-6" /></a>
                            <a href={activeLesson.fileUrl} download className="p-4 bg-[#A8C7FA] text-[#062E6F] rounded-2xl hover:scale-105 transition-all"><Download className="w-6 h-6" /></a>
                        </div>
                    </div>
                )}

                <div className="pt-10 border-t border-[#444746] flex justify-between gap-4 pb-20">
                    <Button variant="outline" onClick={() => {}} icon={ChevronLeft}>Previous Lesson</Button>
                    <div className="flex gap-4 flex-1 justify-end">
                        <Button variant="outline" onClick={handleNext}>Skip</Button>
                        <Button className="bg-[#6DD58C] text-[#0F5223] px-10" onClick={handleMarkComplete}>Complete & Continue <ChevronRight className="ml-2" /></Button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};