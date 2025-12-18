
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, getCompletedLessons, saveCompletedLesson, getCurrentUser, postStudentQuestion, getQuestionsByLesson } from '../services/mockData';
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
  const { showToast, showDialog, celebrate } = useFeedback();
  const [course, setCourse] = useState<Course | undefined>(undefined);
  const [activeModule, setActiveModule] = useState<Module | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(undefined);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState<'content' | 'support'>('content');
  
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const [studentQuestion, setStudentQuestion] = useState('');
  const [lessonQuestions, setLessonQuestions] = useState<TutorQuestion[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const isEnrolled = localStorage.getItem(`enrolled_${id}`) === 'true';
    const user = localStorage.getItem('currentUser');
    const uRole = user ? JSON.parse(user).role : null;
    if (!isEnrolled && !(user && JSON.parse(user).enrolledCourses?.includes(id)) && uRole !== 'admin' && uRole !== 'tutor') {
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
        } catch (e) { console.error(e); }
      }
    };
    load();
  }, [id, navigate]);

  useEffect(() => { 
      setQuizAnswers({}); 
      setQuizSubmitted(false); 
      setQuizScore(0); 
      loadLessonQuestions();
      const contentArea = document.getElementById('classroom-content');
      if (contentArea) contentArea.scrollTo(0, 0);
  }, [activeLesson]);

  const loadLessonQuestions = async () => {
    if (!activeLesson) return;
    try {
        const qs = await getQuestionsByLesson(activeLesson.id);
        setLessonQuestions(qs);
    } catch(e) {}
  };

  const handlePostQuestion = async () => {
    if (!studentQuestion.trim() || !course || !activeLesson) return;
    const user = getCurrentUser();
    if (!user) return;
    setIsPosting(true);
    try {
        await postStudentQuestion({ courseId: course.id, lessonId: activeLesson.id, studentId: user.id, studentName: user.name, question: studentQuestion });
        setStudentQuestion('');
        showToast("Sent to tutor", 'success');
        loadLessonQuestions();
    } catch(e) { showToast("Failed to send", 'error'); } finally { setIsPosting(false); }
  };

  const handleMarkComplete = () => {
      if(!course || !activeLesson) return;
      if (activeLesson.type === 'quiz' && (!quizSubmitted || quizScore < 50)) {
          showDialog({ title: 'Quiz Required', message: 'Score at least 50% to pass.', onConfirm: () => {} });
          return;
      }
      saveCompletedLesson(course.id, activeLesson.id);
      if(!completedIds.includes(activeLesson.id)) setCompletedIds([...completedIds, activeLesson.id]);
      showToast("Lesson finished!", 'success');
      handleNext();
  };

  const handleNext = () => {
      if(!course || !activeLesson || !activeModule) return;
      const lIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
      if (lIdx < activeModule.lessons.length - 1) setActiveLesson(activeModule.lessons[lIdx + 1]); 
      else {
          const mIdx = course.modules.findIndex(m => m.id === activeModule.id);
          if (mIdx < course.modules.length - 1) {
              setActiveModule(course.modules[mIdx + 1]);
              setActiveLesson(course.modules[mIdx + 1].lessons[0]);
          } else { 
              celebrate();
              showDialog({ title: 'Completed! 🎉', message: "Curriculum finished.", onConfirm: () => navigate('/profile') });
          }
      }
  };

  if (!course || !activeModule || !activeLesson) return <div className="h-screen bg-[#131314] flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden relative bg-[#0E0E0E] flex-col lg:flex-row">
      {sidebarOpen && <div className="fixed inset-0 bg-black/90 z-[90] lg:hidden animate-in fade-in" onClick={() => setSidebarOpen(false)} />}
      
      <div className={`fixed lg:relative inset-y-0 left-0 z-[100] w-full sm:w-80 bg-[#1E1F20] border-r border-[#444746] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#444746] flex items-center justify-between sticky top-0 bg-[#1E1F20] z-10">
            <h2 className="font-black text-[#E3E3E3] truncate text-[10px] uppercase tracking-[0.2em]">{course.title}</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-[#C4C7C5]"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-74px)] custom-scrollbar pb-20">
            {course.modules.map((m, mIdx) => (
                <div key={m.id} className="border-b border-[#444746]/30">
                    <div className={`p-5 cursor-pointer flex justify-between items-center transition-colors ${activeModule.id === m.id ? 'bg-[#A8C7FA]/5 text-[#A8C7FA]' : 'text-[#8E918F] hover:bg-[#131314]'}`} onClick={() => setActiveModule(m)}>
                        <div className="flex flex-col gap-1"><span className="text-[9px] font-black uppercase opacity-60">Module {mIdx + 1}</span><span className="text-xs font-bold">{m.title}</span></div>
                        {activeModule.id === m.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                    </div>
                    {activeModule.id === m.id && (
                        <div className="bg-[#131314]/80">
                            {m.lessons.map((l, lIdx) => (
                                <div key={l.id} className={`pl-10 pr-6 py-4 cursor-pointer flex items-center gap-4 text-xs transition-all border-l-2 ${activeLesson.id === l.id ? 'text-[#A8C7FA] bg-[#A8C7FA]/10 border-[#A8C7FA]' : 'text-[#8E918F] border-transparent hover:text-[#C4C7C5]'}`} onClick={() => { setActiveLesson(l); if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                                    <div className="flex-shrink-0">{completedIds.includes(l.id) ? <CheckCircle className="w-4 h-4 text-[#6DD58C]" /> : <PlayCircle className="w-4 h-4" />}</div>
                                    <span className="truncate flex-1 font-medium">{lIdx + 1}. {l.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative h-full">
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#444746] bg-[#131314]/95 backdrop-blur-xl sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-[#C4C7C5] lg:hidden"><Menu className="w-6 h-6" /></button>
                <div className="truncate">
                    <p className="text-[9px] text-[#A8C7FA] uppercase font-black tracking-widest truncate">{activeModule.title}</p>
                    <h3 className="text-sm font-bold text-[#E3E3E3] truncate">{activeLesson.title}</h3>
                </div>
            </div>
            
            <div className="flex gap-2 bg-[#1E1F20] p-1 rounded-full border border-[#444746] scale-90 sm:scale-100">
                <button onClick={() => setActiveTab('content')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'content' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F] hover:text-[#E3E3E3]'}`}>Lesson</button>
                <button onClick={() => setActiveTab('support')} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase transition-all ${activeTab === 'support' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F] hover:text-[#E3E3E3]'}`}>Support</button>
            </div>
            <button onClick={() => navigate('/training')} className="p-2 text-[#C4C7C5]"><X className="w-5 h-5" /></button>
        </div>

        <div id="classroom-content" className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {activeTab === 'content' ? (
                    <>
                        {activeLesson.type === 'video' ? (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#444746]"><iframe width="100%" height="100%" src={getYouTubeEmbedUrl(activeLesson.content)} frameBorder="0" allowFullScreen></iframe></div>
                        ) : (
                            <Card className="p-8 md:p-12 border-[#444746] rounded-3xl bg-[#1E1F20]/50"><h2 className="text-2xl md:text-4xl font-black text-[#E3E3E3] uppercase mb-8">{activeLesson.title}</h2><div className="prose prose-invert max-w-none text-[#C4C7C5] leading-loose text-sm md:text-lg whitespace-pre-wrap">{activeLesson.content}</div></Card>
                        )}
                    </>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        <div className="text-center mb-4"><h2 className="text-2xl font-bold text-[#E3E3E3]">Tutor Support</h2><p className="text-[#8E918F] text-xs">Direct contact with your instructor.</p></div>
                        <Card className="p-6 bg-[#131314] border-[#444746]"><Textarea placeholder="Describe your question..." value={studentQuestion} onChange={(e: any) => setStudentQuestion(e.target.value)} rows={4} className="mb-4" /><div className="flex justify-end"><Button size="sm" icon={Send} onClick={handlePostQuestion} isLoading={isPosting}>Send Question</Button></div></Card>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A8C7FA]">Previous Inquiries</h3>
                            {lessonQuestions.map((q) => (
                                <Card key={q.id} className="p-5 border-[#444746]">
                                    <div className="flex items-start gap-3 mb-4"><div className="w-8 h-8 rounded-full bg-[#1E1F20] flex items-center justify-center shrink-0 border border-[#444746]"><User className="w-4 h-4 text-[#8E918F]" /></div><div className="flex-1 min-w-0"><div className="flex justify-between items-center"><span className="font-bold text-sm text-[#E3E3E3]">{q.studentName}</span><span className="text-[9px] text-[#5E5E5E] font-bold">{new Date(q.createdAt).toLocaleDateString()}</span></div><p className="text-xs text-[#C4C7C5] leading-relaxed italic">"{q.question}"</p></div></div>
                                    {q.reply && <div className="mt-4 pl-6 border-l-2 border-[#A8C7FA]/30 py-2"><Badge color="blue" className="text-[8px] mb-2">Instructor Response</Badge><p className="text-xs text-[#A8C7FA] font-medium leading-relaxed">{q.reply}</p></div>}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="px-4 md:px-8 py-6 border-t border-[#444746] bg-[#131314] flex justify-between items-center fixed md:relative bottom-0 left-0 right-0 z-30 shadow-2xl">
            <button onClick={() => navigate('/training')} className="flex items-center p-3 rounded-2xl border border-[#444746] text-[#C4C7C5]"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 flex-1 justify-end">
                <Button className="bg-[#6DD58C] text-[#0F5223] px-10 py-4 text-[10px] font-black uppercase tracking-widest" onClick={handleMarkComplete}>Finish Lesson <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </div>
        </div>
      </div>
    </div>
  );
};
