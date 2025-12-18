
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
import { api } from '../services/api';
import { getCurrentUser } from '../services/mockData';
import { Course, TutorQuestion, User, Module, Lesson, QuizQuestion } from '../types';
import { Card, Button, Badge, Input, Textarea } from '../components/UI';
import { 
    Loader2, BookOpen, Users, Wallet, Edit, Save, X, Plus, Trash2, Send, 
    Clock, ChevronRight, Check, Paperclip, Upload
} from 'lucide-react';

export const TutorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useFeedback();
    const [user, setUser] = useState<User | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalEarnings: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'courses' | 'questions'>('courses');
    
    // Curriculum Editor
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingFileFor, setUploadingFileFor] = useState<{ mIdx: number, lIdx: number } | null>(null);

    useEffect(() => {
        const u = getCurrentUser();
        if (!u || (u.role !== 'tutor' && u.role !== 'admin')) {
            navigate('/login');
            return;
        }
        setUser(u);
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [c] = await Promise.all([api.getCourses()]);
            // Filter courses where user is instructor
            const tutorCourses = c.filter(course => course.tutorId === user?.id || user?.role === 'admin');
            setCourses(tutorCourses);
            // Stats logic can be expanded here
            setStats({ totalStudents: 0, totalEarnings: 0 }); 
        } catch (e) {
            showToast("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!editingCourse) return;
        setIsSaving(true);
        try {
            await api.updateCourse(editingCourse);
            setCourses(courses.map(c => c.id === editingCourse.id ? editingCourse : c));
            setEditingCourse(null);
            showToast("Curriculum updated successfully", "success");
        } catch (err) {
            showToast("Failed to update course", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mIdx: number, lIdx: number) => {
        const file = e.target.files?.[0];
        if (!file || !editingCourse) return;

        // Validation
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            showToast("Only PDF and DOC files are allowed", "error");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast("File size must be under 2MB", "error");
            return;
        }

        setUploadingFileFor({ mIdx, lIdx });
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result as string;
                const fileId = `mat-${Date.now()}`;
                await api.uploadMaterial({
                    id: fileId,
                    courseId: editingCourse.id,
                    lessonId: editingCourse.modules[mIdx].lessons[lIdx].id,
                    fileName: file.name,
                    mimeType: file.type,
                    fileData: base64
                });

                // Update course local state with the new internal material link
                const mods = [...editingCourse.modules];
                mods[mIdx].lessons[lIdx].fileUrl = `internal://${fileId}`;
                setEditingCourse({ ...editingCourse, modules: mods });
                showToast("File uploaded successfully", "success");
            } catch (err) {
                showToast("Upload failed", "error");
            } finally {
                setUploadingFileFor(null);
            }
        };
        reader.readAsDataURL(file);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

    return (
        <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <Badge color="purple" className="mb-2">Instructor Portal</Badge>
                    <h1 className="text-4xl font-bold text-[#E3E3E3]">Welcome, {user?.name}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {courses.map(course => (
                    <Card key={course.id} className="p-0 overflow-hidden group border-[#444746] hover:border-[#A8C7FA]/50 transition-all">
                        <div className="h-48 relative">
                            <img src={course.thumbnail} className="w-full h-full object-cover" alt={course.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#131314] to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-xl font-bold text-white">{course.title}</h3>
                            </div>
                        </div>
                        <div className="p-6">
                            <Button variant="outline" className="w-full" icon={Edit} onClick={() => setEditingCourse(course)}>Update Curriculum</Button>
                        </div>
                    </Card>
                ))}
            </div>

            {editingCourse && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-4">
                    <Card className="w-full max-w-5xl h-[90vh] bg-[#1E1F20] border-[#444746] flex flex-col p-0">
                        <div className="p-6 bg-[#131314] border-b border-[#444746] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#E3E3E3]">Curriculum Editor</h2>
                            <button onClick={() => setEditingCourse(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                            <div className="space-y-10 pb-20">
                                {editingCourse.modules.map((m, mIdx) => (
                                    <div key={m.id} className="space-y-6">
                                        <h3 className="text-lg font-bold border-b border-[#444746] pb-2">Module: {m.title}</h3>
                                        <div className="pl-6 space-y-6">
                                            {m.lessons.map((l, lIdx) => (
                                                <Card key={l.id} className="p-6 bg-[#131314] border-[#444746]">
                                                    <h4 className="font-bold mb-4">{l.title}</h4>
                                                    <div className="space-y-4">
                                                        <Input 
                                                            label="Material URL (Optional)" 
                                                            placeholder="External link..." 
                                                            value={l.fileUrl?.startsWith('internal://') ? 'Nexlify Hosted Material' : l.fileUrl || ''} 
                                                            disabled={l.fileUrl?.startsWith('internal://')}
                                                            onChange={e => {
                                                                const mods = [...editingCourse.modules];
                                                                mods[mIdx].lessons[lIdx].fileUrl = e.target.value;
                                                                setEditingCourse({...editingCourse, modules: mods});
                                                            }}
                                                        />
                                                        
                                                        <div className="flex flex-col gap-2">
                                                            <p className="text-[10px] font-black uppercase text-[#8E918F] tracking-widest">Device Upload (PDF/DOC)</p>
                                                            <div className="flex items-center gap-4">
                                                                <input 
                                                                    type="file" 
                                                                    id={`file-${mIdx}-${lIdx}`} 
                                                                    className="hidden" 
                                                                    accept=".pdf,.doc,.docx" 
                                                                    onChange={(e) => handleFileUpload(e, mIdx, lIdx)}
                                                                />
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="outline" 
                                                                    icon={uploadingFileFor?.mIdx === mIdx && uploadingFileFor?.lIdx === lIdx ? Loader2 : Upload} 
                                                                    className={l.fileUrl?.startsWith('internal://') ? 'border-[#6DD58C] text-[#6DD58C]' : ''}
                                                                    onClick={() => document.getElementById(`file-${mIdx}-${lIdx}`)?.click()}
                                                                    isLoading={uploadingFileFor?.mIdx === mIdx && uploadingFileFor?.lIdx === lIdx}
                                                                >
                                                                    {l.fileUrl?.startsWith('internal://') ? 'Replace Material' : 'Upload from Device'}
                                                                </Button>
                                                                {l.fileUrl?.startsWith('internal://') && (
                                                                    <button 
                                                                        onClick={() => {
                                                                            const mods = [...editingCourse.modules];
                                                                            mods[mIdx].lessons[lIdx].fileUrl = '';
                                                                            setEditingCourse({...editingCourse, modules: mods});
                                                                        }}
                                                                        className="text-[10px] text-[#CF6679] font-bold uppercase hover:underline"
                                                                    >
                                                                        Remove File
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-[#131314] border-t border-[#444746] flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setEditingCourse(null)}>Cancel</Button>
                            <Button className="flex-1" icon={Save} isLoading={isSaving} onClick={handleSaveCourse}>Save Changes</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
