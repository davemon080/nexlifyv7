
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
import { getTutorCourses, getTutorStats, getQuestionsByCourse, replyToQuestion, updateCourse, getCurrentUser } from '../services/mockData';
import { Course, TutorQuestion, User, Lesson, Module } from '../types';
import { Card, Button, Badge, Input, Textarea } from '../components/UI';
import { Loader2, BookOpen, Users, Wallet, MessageSquare, Edit, Save, X, Plus, Trash2, Send, Clock, GraduationCap, Video, FileText, HelpCircle, ChevronRight } from 'lucide-react';

export const TutorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useFeedback();
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'courses' | 'questions'>('courses');
    const [questions, setQuestions] = useState<TutorQuestion[]>([]);
    
    // Editor State
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [replyText, setReplyText] = useState<{[key: string]: string}>({});

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
            const [c, s] = await Promise.all([getTutorCourses(tutorId), getTutorStats(tutorId)]);
            setCourses(c);
            setStats(s);
            
            if (c.length > 0) {
                const qPromises = c.map(course => getQuestionsByCourse(course.id));
                const allQ = await Promise.all(qPromises);
                setQuestions(allQ.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            }
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
            showToast("Curriculum updated.", "success");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendReply = async (qId: string) => {
        const text = replyText[qId];
        if (!text?.trim()) return;
        
        try {
            await replyToQuestion(qId, text);
            setReplyText({...replyText, [qId]: ''});
            showToast("Reply sent to student.", "success");
            if (user) loadData(user.id);
        } catch (e) {
            showToast("Failed to send reply.", "error");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

    return (
        <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <Badge color="purple" className="mb-2">Instructor Hub</Badge>
                    <h1 className="text-4xl font-bold text-[#E3E3E3]">Welcome, {user?.name}</h1>
                    <p className="text-[#8E918F] mt-1">Manage your assigned courses and student inquiries.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-4 w-full sm:w-auto">
                    <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1">
                        <div className="p-2 bg-[#0F5223] rounded-lg text-[#6DD58C]"><Wallet className="w-5 h-5" /></div>
                        <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Earnings</p><p className="font-bold text-[#E3E3E3]">₦{stats.totalEarnings.toLocaleString()}</p></div>
                    </Card>
                    <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1">
                        <div className="p-2 bg-[#0842A0] rounded-lg text-[#A8C7FA]"><Users className="w-5 h-5" /></div>
                        <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Students</p><p className="font-bold text-[#E3E3E3]">{stats.totalStudents}</p></div>
                    </Card>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] mb-10 max-w-sm">
                <button 
                  onClick={() => setActiveTab('courses')} 
                  className={`flex-1 px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'courses' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
                >
                  Courses
                </button>
                <button 
                  onClick={() => setActiveTab('questions')} 
                  className={`flex-1 px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all relative ${activeTab === 'questions' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
                >
                  Support
                  {questions.filter(q => !q.reply).length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#CF6679] text-[#370007] rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#1E1F20]">{questions.filter(q => !q.reply).length}</span>}
                </button>
            </div>

            {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {courses.map(course => (
                        <Card key={course.id} className="p-0 overflow-hidden group border-[#444746] hover:border-[#A8C7FA]/50 transition-all">
                            <div className="h-48 relative">
                                <img src={course.thumbnail} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#131314] to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <Badge color="blue" className="mb-2">₦{course.price.toLocaleString()}</Badge>
                                    <h3 className="text-xl font-bold text-white">{course.title}</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-6 mb-8 text-xs text-[#8E918F] font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><Users className="w-4 h-4" /> 12 Students</div>
                                    <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> {course.modules.length} Modules</div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" icon={Edit} onClick={() => setEditingCourse(course)}>Manage Content</Button>
                                    <Button className="flex-1" icon={ChevronRight} onClick={() => navigate(`/classroom/${course.id}`)}>Preview</Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {courses.length === 0 && (
                        <div className="md:col-span-2 py-40 text-center bg-[#1E1F20]/30 rounded-[48px] border-2 border-dashed border-[#444746]">
                            <GraduationCap className="w-16 h-16 text-[#5E5E5E] mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-[#E3E3E3]">No Assigned Courses</h3>
                            <p className="text-[#8E918F] max-w-xs mx-auto mt-2">Contact the administrator to be assigned as an instructor for an Academy program.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-6">
                    {questions.map(q => (
                        <Card key={q.id} className={`p-8 border-l-4 ${q.reply ? 'border-l-[#444746]' : 'border-l-[#A8C7FA] shadow-lg shadow-[#A8C7FA]/5'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#131314] flex items-center justify-center border border-[#444746] overflow-hidden">
                                        {q.studentPhoto ? <img src={q.studentPhoto} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-[#5E5E5E]" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#E3E3E3]">{q.studentName}</h4>
                                        <p className="text-xs text-[#8E918F]">{courses.find(c => c.id === q.courseId)?.title} • {new Date(q.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {!q.reply && <Badge color="blue" className="animate-pulse">Action Required</Badge>}
                            </div>
                            
                            <div className="bg-[#131314] p-5 rounded-2xl mb-6">
                                <p className="text-[#C4C7C5] leading-relaxed italic">"{q.question}"</p>
                            </div>

                            {q.reply ? (
                                <div className="p-5 bg-[#0F5223]/10 border border-[#6DD58C]/20 rounded-2xl flex gap-4">
                                    <div className="p-2 bg-[#6DD58C]/10 rounded-lg h-fit"><Send className="w-4 h-4 text-[#6DD58C]" /></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-[#6DD58C] font-black uppercase mb-1">Your Response</p>
                                        <p className="text-sm text-[#C4C7C5]">{q.reply}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Textarea 
                                        placeholder="Type your reply here..." 
                                        rows={3} 
                                        value={replyText[q.id] || ''}
                                        onChange={(e: any) => setReplyText({...replyText, [q.id]: e.target.value})}
                                    />
                                    <div className="flex justify-end">
                                        <Button icon={Send} onClick={() => handleSendReply(q.id)}>Dispatch Reply</Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                    {questions.length === 0 && (
                        <div className="py-40 text-center bg-[#1E1F20]/30 rounded-[48px] border-2 border-dashed border-[#444746]">
                            <MessageSquare className="w-16 h-16 text-[#5E5E5E] mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-[#E3E3E3]">Inbox Clear</h3>
                            <p className="text-[#8E918F]">No student questions have been received yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Curriculum Editor Modal */}
            {editingCourse && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
                    <Card className="w-full max-w-5xl h-[90vh] bg-[#1E1F20] border-[#444746] flex flex-col p-0">
                        <div className="p-6 bg-[#131314] border-b border-[#444746] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#E3E3E3]">Editing Curriculum: {editingCourse.title}</h2>
                            <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-10 pb-20">
                                {editingCourse.modules.map((m, mIdx) => (
                                    <div key={m.id} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-[#A8C7FA]/10 flex items-center justify-center text-[10px] font-black text-[#A8C7FA] border border-[#A8C7FA]/20">{mIdx + 1}</div>
                                            <Input 
                                              value={m.title} 
                                              onChange={e => {
                                                  const mods = [...editingCourse.modules];
                                                  mods[mIdx].title = e.target.value;
                                                  setEditingCourse({...editingCourse, modules: mods});
                                              }}
                                              className="bg-transparent border-b border-t-0 border-x-0 rounded-none focus:ring-0 px-0 text-lg font-bold"
                                            />
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            {m.lessons.map((l, lIdx) => (
                                                <div key={l.id} className="p-4 bg-[#131314] rounded-2xl border border-[#444746] space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <Badge color="blue" className="text-[9px] uppercase font-black">{l.type}</Badge>
                                                        <button onClick={() => {
                                                            const mods = [...editingCourse.modules];
                                                            mods[mIdx].lessons = mods[mIdx].lessons.filter(item => item.id !== l.id);
                                                            setEditingCourse({...editingCourse, modules: mods});
                                                        }} className="text-[#CF6679] hover:bg-[#CF6679]/10 p-1 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <Input 
                                                      label="Lesson Title" 
                                                      value={l.title} 
                                                      onChange={e => {
                                                        const mods = [...editingCourse.modules];
                                                        mods[mIdx].lessons[lIdx].title = e.target.value;
                                                        setEditingCourse({...editingCourse, modules: mods});
                                                      }}
                                                    />
                                                    <Input 
                                                      label={l.type === 'video' ? 'YouTube/Vimeo URL' : 'Content Text'} 
                                                      value={l.content}
                                                      onChange={e => {
                                                        const mods = [...editingCourse.modules];
                                                        mods[mIdx].lessons[lIdx].content = e.target.value;
                                                        setEditingCourse({...editingCourse, modules: mods});
                                                      }}
                                                    />
                                                </div>
                                            ))}
                                            <button 
                                              onClick={() => {
                                                const mods = [...editingCourse.modules];
                                                mods[mIdx].lessons.push({ id: `l-${Date.now()}`, title: 'New Lesson', type: 'video', content: '', duration: '15m' });
                                                setEditingCourse({...editingCourse, modules: mods});
                                              }}
                                              className="w-full py-4 border-2 border-dashed border-[#444746] rounded-2xl text-[10px] font-black uppercase text-[#8E918F] hover:text-[#E3E3E3] hover:border-[#8E918F] transition-all flex items-center justify-center gap-2"
                                            >
                                              <Plus className="w-3 h-3" /> Add Lesson to Module
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <Button 
                                  variant="outline" 
                                  className="w-full py-6 text-xs font-black uppercase tracking-widest"
                                  onClick={() => {
                                      const newMod = { id: `m-${Date.now()}`, title: 'New Module', description: '', lessons: [] };
                                      setEditingCourse({...editingCourse, modules: [...editingCourse.modules, newMod]});
                                  }}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add New Module
                                </Button>
                            </div>
                        </div>
                        <div className="p-6 bg-[#131314] border-t border-[#444746] flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingCourse(null)}>Discard Changes</Button>
                            <Button className="flex-1" icon={Save} isLoading={isSaving} onClick={handleSaveCourse}>Save Curriculum</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
