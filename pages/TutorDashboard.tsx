
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
import { 
    getTutorCourses, getTutorStats, getQuestionsByTutor, replyToQuestion, updateCourse, getCurrentUser 
} from '../services/mockData';
import { Course, TutorQuestion, User, Module, Lesson, QuizQuestion } from '../types';
import { Card, Button, Badge, Input, Textarea } from '../components/UI';
import { 
    Loader2, BookOpen, Users, Wallet, MessageCircle, Edit, Save, X, Plus, Trash2, Send, 
    Clock, GraduationCap, Video, FileText, ChevronRight, HelpCircle, Check, Paperclip
} from 'lucide-react';

export const TutorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useFeedback();
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'courses' | 'questions'>('courses');
    const [questions, setQuestions] = useState<TutorQuestion[]>([]);
    
    // Curriculum Editor
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [replies, setReplies] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const u = getCurrentUser();
        if (!u || (u.role !== 'tutor' && u.role !== 'admin')) {
            navigate('/login');
            return;
        }
        setUser(u);
        loadData(u.id);
    }, [navigate]);

    const loadData = async (tutorId: string) => {
        try {
            setLoading(true);
            const [c, s, q] = await Promise.all([
                getTutorCourses(tutorId), 
                getTutorStats(tutorId),
                getQuestionsByTutor(tutorId)
            ]);
            setCourses(c);
            setStats(s);
            setQuestions(q);
        } catch (e) {
            console.error("Dashboard failed to load");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!editingCourse) return;
        setIsSaving(true);
        try {
            await updateCourse(editingCourse);
            setCourses(courses.map(c => c.id === editingCourse.id ? editingCourse : c));
            setEditingCourse(null);
            showToast("Curriculum updated successfully", "success");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReply = async (qId: string) => {
        const replyText = replies[qId];
        if (!replyText?.trim()) return;
        
        try {
            await replyToQuestion(qId, replyText);
            showToast("Reply sent to student", "success");
            if (user) loadData(user.id);
        } catch(e) {
            showToast("Failed to send reply", "error");
        }
    };

    // Helper to add a question to a quiz lesson
    const addQuizQuestion = (mIdx: number, lIdx: number) => {
        if (!editingCourse) return;
        const mods = [...editingCourse.modules];
        const lesson = mods[mIdx].lessons[lIdx];
        const newQuestion: QuizQuestion = {
            id: `q-${Date.now()}`,
            question: 'New Question',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0
        };
        lesson.questions = [...(lesson.questions || []), newQuestion];
        setEditingCourse({...editingCourse, modules: mods});
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

    return (
        <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <Badge color="purple" className="mb-2">Instructor Portal</Badge>
                    <h1 className="text-4xl font-bold text-[#E3E3E3]">Welcome, {user?.name}</h1>
                    <p className="text-[#8E918F] mt-1">Monitor your programs and guide your students.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-4 w-full sm:w-auto">
                    <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1">
                        <div className="p-2 bg-[#0F5223] rounded-lg text-[#6DD58C]"><Wallet className="w-5 h-5" /></div>
                        <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Total Earnings</p><p className="font-bold text-[#E3E3E3]">₦{stats.totalEarnings.toLocaleString()}</p></div>
                    </Card>
                    <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1">
                        <div className="p-2 bg-[#0842A0] rounded-lg text-[#A8C7FA]"><Users className="w-5 h-5" /></div>
                        <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Enrolled Students</p><p className="font-bold text-[#E3E3E3]">{stats.totalStudents}</p></div>
                    </Card>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] mb-10 max-w-sm">
                <button 
                  onClick={() => setActiveTab('courses')} 
                  className={`flex-1 px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'courses' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
                >
                  My Courses
                </button>
                <button 
                  onClick={() => setActiveTab('questions')} 
                  className={`flex-1 px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all relative ${activeTab === 'questions' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
                >
                  Student Hub
                  {questions.filter(q => !q.reply).length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#CF6679] text-[#370007] rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#1E1F20]">{questions.filter(q => !q.reply).length}</span>}
                </button>
            </div>

            {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {courses.map(course => (
                        <Card key={course.id} className="p-0 overflow-hidden group border-[#444746] hover:border-[#A8C7FA]/50 transition-all">
                            <div className="h-48 relative">
                                <img src={course.thumbnail} className="w-full h-full object-cover" alt={course.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#131314] to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <Badge color="blue" className="mb-2">Commission: 10%</Badge>
                                    <h3 className="text-xl font-bold text-white">{course.title}</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-6 mb-8 text-[10px] text-[#8E918F] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {course.modules.length} Modules</div>
                                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {course.duration}</div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" icon={Edit} onClick={() => setEditingCourse(course)}>Update Content</Button>
                                    <Button className="flex-1" icon={ChevronRight} onClick={() => navigate(`/classroom/${course.id}`)}>Preview</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-6">
                    {questions.map(q => (
                        <Card key={q.id} className={`p-8 border-l-4 ${q.reply ? 'border-l-[#444746]' : 'border-l-[#A8C7FA]'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-bold text-[#E3E3E3] text-lg">{q.studentName}</h4>
                                    <p className="text-xs text-[#8E918F] mt-1">{courses.find(c => c.id === q.courseId)?.title} • {new Date(q.createdAt).toLocaleDateString()}</p>
                                </div>
                                {!q.reply && <Badge color="blue" className="animate-pulse">New Question</Badge>}
                            </div>
                            
                            <div className="bg-[#131314] p-5 rounded-2xl mb-6">
                                <p className="text-[#C4C7C5] leading-relaxed italic">"{q.question}"</p>
                            </div>

                            {q.reply ? (
                                <div className="p-5 bg-[#0F5223]/10 border border-[#6DD58C]/20 rounded-2xl">
                                    <p className="text-xs text-[#6DD58C] font-black uppercase mb-1">Your Reply</p>
                                    <p className="text-sm text-[#C4C7C5]">{q.reply}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Textarea 
                                        placeholder="Enter your response..." 
                                        rows={3} 
                                        value={replies[q.id] || ''}
                                        onChange={(e: any) => setReplies({...replies, [q.id]: e.target.value})}
                                    />
                                    <div className="flex justify-end">
                                        <Button icon={Send} onClick={() => handleReply(q.id)}>Send Reply</Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Curriculum Editor Modal */}
            {editingCourse && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
                    <Card className="w-full max-w-5xl h-[90vh] bg-[#1E1F20] border-[#444746] flex flex-col p-0">
                        <div className="p-6 bg-[#131314] border-b border-[#444746] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#E3E3E3]">Curriculum Editor: {editingCourse.title}</h2>
                            <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                            <div className="max-w-4xl mx-auto space-y-10 pb-20">
                                {editingCourse.modules.map((m, mIdx) => (
                                    <div key={m.id} className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-[#444746] pb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#A8C7FA]/10 flex items-center justify-center text-xs font-black text-[#A8C7FA] border border-[#A8C7FA]/20">{mIdx + 1}</div>
                                                <Input 
                                                  value={m.title} 
                                                  onChange={e => {
                                                      const mods = [...editingCourse.modules];
                                                      mods[mIdx].title = e.target.value;
                                                      setEditingCourse({...editingCourse, modules: mods});
                                                  }}
                                                  className="bg-transparent border-none rounded-none focus:ring-0 px-0 text-xl font-bold"
                                                />
                                            </div>
                                            <button onClick={() => {
                                                const mods = editingCourse.modules.filter((_, i) => i !== mIdx);
                                                setEditingCourse({...editingCourse, modules: mods});
                                            }} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                        
                                        <div className="pl-6 md:pl-14 space-y-6">
                                            {m.lessons.map((l, lIdx) => (
                                                <Card key={l.id} className="p-6 bg-[#131314] border-[#444746] space-y-6">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex gap-2">
                                                            <select 
                                                                value={l.type} 
                                                                onChange={e => {
                                                                    const mods = [...editingCourse.modules];
                                                                    mods[mIdx].lessons[lIdx].type = e.target.value as any;
                                                                    if (e.target.value === 'quiz' && !mods[mIdx].lessons[lIdx].questions) {
                                                                        mods[mIdx].lessons[lIdx].questions = [];
                                                                    }
                                                                    setEditingCourse({...editingCourse, modules: mods});
                                                                }}
                                                                className="bg-[#1E1F20] text-[#A8C7FA] text-[10px] font-black uppercase tracking-widest border border-[#444746] rounded-full px-3 py-1 outline-none"
                                                            >
                                                                <option value="video">Video</option>
                                                                <option value="text">Reading</option>
                                                                <option value="quiz">Quiz</option>
                                                            </select>
                                                            {l.fileUrl && <Badge color="green" className="text-[10px] py-0 px-1.5"><Paperclip className="w-2.5 h-2.5 mr-1" /> Material Attached</Badge>}
                                                        </div>
                                                        <button onClick={() => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons = mods[mIdx].lessons.filter(item => item.id !== l.id);
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} className="text-[#CF6679] hover:bg-[#CF6679]/10 p-2 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <Input label="Lesson Name" value={l.title} onChange={e => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons[lIdx].title = e.target.value;
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} />
                                                        <Input label="Duration (e.g. 15m)" value={l.duration} onChange={e => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons[lIdx].duration = e.target.value;
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} />
                                                    </div>

                                                    {l.type === 'video' && (
                                                        <Input label="YouTube/Vimeo URL" placeholder="https://..." value={l.content} onChange={e => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons[lIdx].content = e.target.value;
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} />
                                                    )}

                                                    {l.type === 'text' && (
                                                        <Textarea label="Reading Content" rows={6} value={l.content} onChange={(e: any) => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons[lIdx].content = e.target.value;
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} />
                                                    )}

                                                    {l.type === 'quiz' && (
                                                        <div className="space-y-6 pt-4 border-t border-[#444746]/50">
                                                            <div className="flex justify-between items-center">
                                                                <h5 className="text-[10px] font-black uppercase text-[#8E918F] tracking-widest">Quiz Questions ({l.questions?.length || 0})</h5>
                                                                <button onClick={() => addQuizQuestion(mIdx, lIdx)} className="text-[10px] text-[#A8C7FA] font-black uppercase flex items-center gap-1 hover:underline">
                                                                    <Plus className="w-3 h-3" /> Add Question
                                                                </button>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {l.questions?.map((q, qIdx) => (
                                                                    <div key={q.id} className="p-5 bg-[#1E1F20] rounded-2xl border border-[#444746] relative">
                                                                        <button onClick={() => {
                                                                            const mods = [...editingCourse.modules];
                                                                            mods[mIdx].lessons[lIdx].questions = mods[mIdx].lessons[lIdx].questions?.filter((_, i) => i !== qIdx);
                                                                            setEditingCourse({...editingCourse, modules: mods});
                                                                        }} className="absolute top-4 right-4 text-[#CF6679]"><X className="w-4 h-4" /></button>
                                                                        
                                                                        <div className="mb-4 pr-10">
                                                                            <Input label={`Question ${qIdx + 1}`} value={q.question} onChange={e => {
                                                                                const mods = [...editingCourse.modules];
                                                                                mods[mIdx].lessons[lIdx].questions![qIdx].question = e.target.value;
                                                                                setEditingCourse({...editingCourse, modules: mods});
                                                                            }} />
                                                                        </div>
                                                                        
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {q.options.map((opt, oIdx) => (
                                                                                <div key={oIdx} className="flex gap-2">
                                                                                    <div className="flex-1 relative">
                                                                                        <Input 
                                                                                            value={opt} 
                                                                                            className={q.correctAnswer === oIdx ? 'border-[#6DD58C] pr-10' : 'pr-10'}
                                                                                            onChange={e => {
                                                                                                const mods = [...editingCourse.modules];
                                                                                                mods[mIdx].lessons[lIdx].questions![qIdx].options[oIdx] = e.target.value;
                                                                                                setEditingCourse({...editingCourse, modules: mods});
                                                                                            }} 
                                                                                        />
                                                                                        <button 
                                                                                          onClick={() => {
                                                                                              const mods = [...editingCourse.modules];
                                                                                              mods[mIdx].lessons[lIdx].questions![qIdx].correctAnswer = oIdx;
                                                                                              setEditingCourse({...editingCourse, modules: mods});
                                                                                          }}
                                                                                          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${q.correctAnswer === oIdx ? 'bg-[#6DD58C] text-[#0F5223]' : 'text-[#5E5E5E] hover:text-[#E3E3E3]'}`}
                                                                                        >
                                                                                            <Check className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="pt-4 border-t border-[#444746]/50">
                                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                                            <div className="flex-1 w-full">
                                                                <Input 
                                                                  label="Material Attachment URL (PDF/DOC/ZIP)" 
                                                                  placeholder="https://cloud.nexlify.com.ng/..." 
                                                                  value={l.fileUrl || ''} 
                                                                  onChange={e => {
                                                                    const mods = [...editingCourse.modules];
                                                                    mods[mIdx].lessons[lIdx].fileUrl = e.target.value;
                                                                    setEditingCourse({...editingCourse, modules: mods});
                                                                  }}
                                                                />
                                                            </div>
                                                            <p className="text-[10px] text-[#8E918F] pb-3 hidden md:block">Host files via <span className="text-[#A8C7FA] cursor-pointer" onClick={() => navigate('/admin/hosting')}>File Manager</span></p>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                            <button 
                                              onClick={() => {
                                                const mods = [...editingCourse.modules];
                                                mods[mIdx].lessons.push({ id: `l-${Date.now()}`, title: 'New Lesson', type: 'video', content: '', duration: '10m' });
                                                setEditingCourse({...editingCourse, modules: mods});
                                              }}
                                              className="w-full py-4 border-2 border-dashed border-[#444746] rounded-2xl text-[10px] font-black uppercase text-[#8E918F] hover:text-[#E3E3E3] hover:border-[#A8C7FA] transition-all flex items-center justify-center gap-2"
                                            >
                                              <Plus className="w-3 h-3" /> Add Lesson to Module
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                  variant="outline" 
                                  className="w-full py-6 text-xs font-black uppercase tracking-widest bg-[#A8C7FA]/5 border-[#A8C7FA]/20"
                                  onClick={() => {
                                      const newMod: Module = { id: `m-${Date.now()}`, title: 'New Module', description: '', lessons: [] };
                                      setEditingCourse({...editingCourse, modules: [...editingCourse.modules, newMod]});
                                  }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add New Program Module
                                </Button>
                            </div>
                        </div>
                        <div className="p-6 bg-[#131314] border-t border-[#444746] flex gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingCourse(null)}>Discard Changes</Button>
                            <Button className="flex-1" icon={Save} isLoading={isSaving} onClick={handleSaveCourse}>Publish Curriculum</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
