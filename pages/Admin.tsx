import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProducts, getInquiries, addProduct, deleteProduct, updateProduct, 
  getCourses, getAllUsers, updateUser, deleteUser, getUserActivity, 
  addCourse, updateCourse, deleteCourse, adminEnrollUser, getAppSettings, 
  updateAppSettings, getAdminStats, deleteInquiry, adminRevokeAccess, 
  sendNotification, uploadHostedFile
} from '../services/mockData';
import { 
  Product, Inquiry, ProductCategory, Course, User, ActivityLog, 
  Module, Lesson, QuizQuestion, AppSettings, PageSeoConfig 
} from '../types';
import { Button, Input, Card, Badge, Textarea } from '../components/UI';
import { 
  Plus, Trash2, GraduationCap, Loader2, Users, 
  Wallet, Search, MoreVertical, X, Check, 
  Upload, FileText, Download, Edit, Video, 
  GripVertical, Settings, Save, Globe, Eye, BookOpen, Bell, Send, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'inquiries' | 'training' | 'users' | 'settings' | 'seo' | 'notifications'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ platformName: 'Nexlify' });
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // User Management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedCourseToGrant, setSelectedCourseToGrant] = useState('');

  // Course Editor State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState<'basics' | 'curriculum'>('basics');
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({
      title: '', description: '', thumbnail: '', level: 'Beginner', duration: '', price: 0, instructor: '', modules: []
  });
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(0);
  const [editingLesson, setEditingLesson] = useState<{ mIdx: number, lIdx: number } | null>(null);

  // Notification State
  const [notifForm, setNotifForm] = useState({ userId: 'all', title: '', message: '', type: 'info' as any });

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/login');
    } else {
      loadData();
    }
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, iData, cData, uData, settings, stats] = await Promise.all([
        getProducts(), getInquiries(), getCourses(), getAllUsers(), getAppSettings(), getAdminStats()
      ]);
      setProducts(pData);
      setInquiries(iData);
      setCourses(cData);
      setUsers(uData);
      setAppSettings(settings);
      setTotalRevenue(stats.totalRevenue);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- COURSE CURRICULUM HELPERS ---
  const handleAddModule = () => {
      const newModule: Module = { id: `m-${Date.now()}`, title: 'New Module', description: '', lessons: [] };
      const updatedModules = [...(currentCourse.modules || []), newModule];
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
      setExpandedModuleIdx(updatedModules.length - 1);
  };

  const handleAddLesson = (mIdx: number) => {
      const newLesson: Lesson = { id: `l-${Date.now()}`, title: 'New Lesson', type: 'text', content: '', duration: '10 mins' };
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[mIdx].lessons.push(newLesson);
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
      setEditingLesson({ mIdx, lIdx: updatedModules[mIdx].lessons.length - 1 });
  };

  const updateLessonData = (mIdx: number, lIdx: number, field: keyof Lesson, value: any) => {
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[mIdx].lessons[lIdx] = { ...updatedModules[mIdx].lessons[lIdx], [field]: value };
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleAddQuizQuestion = (mIdx: number, lIdx: number) => {
      const updatedModules = [...(currentCourse.modules || [])];
      const lesson = updatedModules[mIdx].lessons[lIdx];
      const newQ: QuizQuestion = { id: `q-${Date.now()}`, question: 'New Question', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 };
      lesson.questions = [...(lesson.questions || []), newQ];
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mIdx: number, lIdx: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          const content = reader.result as string;
          const hosted = await uploadHostedFile(file.name, file.type, content);
          const url = `${window.location.origin}/#/template-view/${hosted.id}`;
          updateLessonData(mIdx, lIdx, 'fileUrl', url);
      };
      reader.readAsDataURL(file);
  };

  const handleSaveCourse = async () => {
      if(!currentCourse.title) return;
      setLoading(true);
      if(isEditingCourse && currentCourse.id) {
          await updateCourse(currentCourse as Course);
      } else {
          await addCourse({ ...currentCourse as Course, id: `c-${Date.now()}` });
      }
      setShowCourseModal(false);
      await loadData();
  };

  const handleUserClick = async (user: User) => {
      setSelectedUser(users.find(u => u.id === user.id) || user);
  };

  if (loading && !showCourseModal) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <Badge color="blue">Nexlify Administrator</Badge>
            <h1 className="text-3xl font-bold text-[#E3E3E3] mt-2">Dashboard</h1>
          </div>
          <div className="flex gap-2 bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] overflow-x-auto no-scrollbar">
            {['products', 'users', 'training', 'inquiries', 'notifications', 'seo', 'settings'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
              >
                {tab === 'training' ? 'Academy' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- TRAINING / ACADEMY TAB --- */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1E1F20] p-6 rounded-3xl border border-[#444746]">
                <div>
                    <h2 className="text-xl font-bold text-[#E3E3E3]">Course Library</h2>
                    <p className="text-sm text-[#8E918F]">Manage curriculum, lessons, and enrollment.</p>
                </div>
                <Button onClick={() => { setIsEditingCourse(false); setCurrentCourse({ modules: [] }); setShowCourseModal(true); }} icon={Plus}>Create Course</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <Card key={course.id} className="p-0 overflow-hidden flex flex-col group">
                        <div className="relative aspect-video bg-[#131314]">
                            <img src={course.thumbnail} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute top-3 right-3"><Badge color="blue">₦{course.price.toLocaleString()}</Badge></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="font-bold text-[#E3E3E3] mb-2">{course.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-[#8E918F] mb-4">
                                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.modules.length} Modules</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.level}</span>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <Button className="flex-1" variant="outline" size="sm" onClick={() => { setIsEditingCourse(true); setCurrentCourse(course); setShowCourseModal(true); }}>Edit Course</Button>
                                <button onClick={() => deleteCourse(course.id).then(loadData)} className="p-2 bg-[#CF6679]/10 text-[#CF6679] rounded-xl hover:bg-[#CF6679]/20"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
          </div>
        )}

        {/* --- USER MANAGEMENT --- */}
        {activeTab === 'users' && (
            <div className="space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E918F]" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full bg-[#1E1F20] border border-[#444746] rounded-2xl py-3 pl-12 pr-4 text-[#E3E3E3] outline-none" 
                        value={userSearch} 
                        onChange={e => setUserSearch(e.target.value)} 
                    />
                </div>
                <div className="bg-[#1E1F20] rounded-3xl border border-[#444746] overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-[#131314] text-xs uppercase text-[#8E918F]">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#444746]">
                            {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                                <tr key={u.id} className="hover:bg-[#2D2E30] transition-colors cursor-pointer" onClick={() => handleUserClick(u)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#A8C7FA]/20 flex items-center justify-center text-[#A8C7FA] text-xs font-bold">{u.name.charAt(0)}</div>
                                            <div>
                                                <div className="text-sm font-bold text-[#E3E3E3]">{u.name}</div>
                                                <div className="text-xs text-[#8E918F]">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge></td>
                                    <td className="px-6 py-4 text-sm font-mono text-[#6DD58C]">₦{u.balance.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right"><MoreVertical className="w-4 h-4 ml-auto text-[#5E5E5E]" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- PRODUCTS & OTHER TABS --- */}
        {activeTab === 'products' && (
            <div className="space-y-6">
                <div className="flex justify-end"><Button onClick={() => navigate('/admin/products')} icon={Plus}>Add Product</Button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(p => (
                        <Card key={p.id} className="p-4 flex gap-4 items-center">
                            <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                            <div className="flex-1 truncate">
                                <h4 className="font-bold text-sm text-[#E3E3E3] truncate">{p.title}</h4>
                                <p className="text-xs text-[#8E918F]">₦{p.price.toLocaleString()}</p>
                            </div>
                            <button onClick={() => deleteProduct(p.id).then(loadData)} className="p-2 text-[#CF6679]"><Trash2 className="w-4 h-4" /></button>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* --- COURSE EDITOR MODAL --- */}
        {showCourseModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                <div className="bg-[#1E1F20] w-full max-w-6xl h-[90vh] rounded-[40px] border border-[#444746] flex flex-col overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-[#444746] flex justify-between items-center bg-[#131314]">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl"><GraduationCap className="text-[#A8C7FA]" /></div>
                            <div>
                                <h2 className="text-xl font-bold text-[#E3E3E3]">{isEditingCourse ? 'Edit Curriculum' : 'Create New Academy Course'}</h2>
                                <p className="text-xs text-[#8E918F]">Modules: {currentCourse.modules?.length || 0}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 bg-[#131314] p-1 rounded-full border border-[#444746]">
                            <button onClick={() => setCourseModalTab('basics')} className={`px-5 py-2 rounded-full text-xs font-bold ${courseModalTab === 'basics' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Basics</button>
                            <button onClick={() => setCourseModalTab('curriculum')} className={`px-5 py-2 rounded-full text-xs font-bold ${courseModalTab === 'curriculum' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Curriculum Builder</button>
                        </div>
                        <button onClick={() => setShowCourseModal(false)} className="p-2 hover:bg-[#2D2E30] rounded-full transition-colors"><X className="w-6 h-6 text-[#C4C7C5]" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        {courseModalTab === 'basics' ? (
                            <div className="max-w-3xl mx-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <Input label="Course Title" placeholder="e.g., Master Graphics Design" value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} />
                                        <Textarea label="Brief Description" rows={4} placeholder="What is this course about?" value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input label="Price (₦)" type="number" value={currentCourse.price} onChange={e => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})} />
                                            <Input label="Instructor" placeholder="Name" value={currentCourse.instructor} onChange={e => setCurrentCourse({...currentCourse, instructor: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-[#131314] aspect-video rounded-3xl border border-[#444746] overflow-hidden flex items-center justify-center relative group">
                                            {currentCourse.thumbnail ? (
                                                <img src={currentCourse.thumbnail} className="w-full h-full object-cover" />
                                            ) : (
                                                <p className="text-[#5E5E5E] text-xs">No Thumbnail</p>
                                            )}
                                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <Upload className="w-8 h-8 text-white mb-2" />
                                                <input type="file" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if(file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setCurrentCourse({...currentCourse, thumbnail: reader.result as string});
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <select className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-3 text-sm text-[#E3E3E3]" value={currentCourse.level} onChange={e => setCurrentCourse({...currentCourse, level: e.target.value as any})}>
                                                <option value="Beginner">Beginner</option>
                                                <option value="Intermediate">Intermediate</option>
                                                <option value="Advanced">Advanced</option>
                                            </select>
                                            <Input placeholder="e.g., 12 Weeks" value={currentCourse.duration} onChange={e => setCurrentCourse({...currentCourse, duration: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto flex gap-8">
                                {/* Left Side: Module List */}
                                <div className="w-1/3 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-[#A8C7FA] uppercase tracking-widest">Structure</h3>
                                        <button onClick={handleAddModule} className="p-1.5 bg-[#A8C7FA] text-[#062E6F] rounded-lg hover:scale-105 transition-all"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <div className="space-y-2">
                                        {currentCourse.modules?.map((m, idx) => (
                                            <div 
                                                key={m.id} 
                                                onClick={() => setExpandedModuleIdx(idx)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${expandedModuleIdx === idx ? 'bg-[#A8C7FA]/10 border-[#A8C7FA]/30 text-[#A8C7FA]' : 'bg-[#131314] border-[#444746] text-[#C4C7C5] hover:border-[#8E918F]'}`}
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    <GripVertical className="w-4 h-4 opacity-20" />
                                                    <span className="text-sm font-bold truncate">{m.title}</span>
                                                </div>
                                                <div className="text-[10px] opacity-60 bg-[#1E1F20] px-2 py-0.5 rounded-full">{m.lessons.length} L</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Module Editor */}
                                <div className="flex-1">
                                    {expandedModuleIdx !== null && currentCourse.modules && currentCourse.modules[expandedModuleIdx] ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center justify-between bg-[#131314] p-4 rounded-3xl border border-[#444746]">
                                                <input 
                                                    className="bg-transparent border-none text-xl font-bold text-[#E3E3E3] focus:ring-0 w-full" 
                                                    value={currentCourse.modules[expandedModuleIdx].title}
                                                    onChange={e => {
                                                        const mods = [...currentCourse.modules!];
                                                        mods[expandedModuleIdx].title = e.target.value;
                                                        setCurrentCourse({...currentCourse, modules: mods});
                                                    }}
                                                />
                                                <button onClick={() => {
                                                    const mods = [...currentCourse.modules!];
                                                    mods.splice(expandedModuleIdx, 1);
                                                    setCurrentCourse({...currentCourse, modules: mods});
                                                    setExpandedModuleIdx(null);
                                                }} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-bold text-[#8E918F] uppercase">Lessons</h4>
                                                    <Button size="sm" variant="outline" icon={Plus} onClick={() => handleAddLesson(expandedModuleIdx)}>Add Lesson</Button>
                                                </div>
                                                
                                                {currentCourse.modules[expandedModuleIdx].lessons.map((lesson, lIdx) => (
                                                    <div key={lesson.id} className="bg-[#131314] rounded-2xl border border-[#444746] overflow-hidden">
                                                        <div 
                                                            className={`p-4 flex items-center justify-between cursor-pointer hover:bg-[#1E1F20] transition-colors ${editingLesson?.lIdx === lIdx && editingLesson?.mIdx === expandedModuleIdx ? 'bg-[#1E1F20]' : ''}`}
                                                            onClick={() => setEditingLesson(editingLesson?.lIdx === lIdx ? null : { mIdx: expandedModuleIdx, lIdx })}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                {lesson.type === 'video' ? <Video className="w-4 h-4 text-[#CF6679]" /> : lesson.type === 'quiz' ? <HelpCircle className="w-4 h-4 text-[#FFD97D]" /> : <FileText className="w-4 h-4 text-[#A8C7FA]" />}
                                                                <span className="text-sm font-medium text-[#E3E3E3]">{lesson.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] text-[#5E5E5E] uppercase font-bold">{lesson.type}</span>
                                                                {editingLesson?.lIdx === lIdx ? <ChevronUp className="w-4 h-4 text-[#5E5E5E]" /> : <ChevronDown className="w-4 h-4 text-[#5E5E5E]" />}
                                                            </div>
                                                        </div>

                                                        {editingLesson?.lIdx === lIdx && editingLesson?.mIdx === expandedModuleIdx && (
                                                            <div className="p-6 border-t border-[#444746] bg-[#1E1F20]/50 space-y-6 animate-in slide-in-from-top-2">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <Input label="Lesson Title" value={lesson.title} onChange={e => updateLessonData(expandedModuleIdx, lIdx, 'title', e.target.value)} />
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-[#C4C7C5] mb-2">Lesson Type</label>
                                                                        <select 
                                                                            className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-3 text-sm text-[#E3E3E3]"
                                                                            value={lesson.type}
                                                                            onChange={e => updateLessonData(expandedModuleIdx, lIdx, 'type', e.target.value)}
                                                                        >
                                                                            <option value="text">Read Material (Text)</option>
                                                                            <option value="video">Watch Video (YouTube/Vimeo)</option>
                                                                            <option value="quiz">Interactive Quiz</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {/* TYPE SPECIFIC EDITORS */}
                                                                {lesson.type === 'text' && (
                                                                    <Textarea label="Lesson Content" rows={6} placeholder="Enter the full lesson content here..." value={lesson.content} onChange={e => updateLessonData(expandedModuleIdx, lIdx, 'content', e.target.value)} />
                                                                )}

                                                                {lesson.type === 'video' && (
                                                                    <div className="space-y-4">
                                                                        <Input label="Video URL" placeholder="YouTube or Vimeo Link" value={lesson.content} onChange={e => updateLessonData(expandedModuleIdx, lIdx, 'content', e.target.value)} />
                                                                        {lesson.content && (
                                                                            <div className="p-3 bg-[#131314] rounded-xl border border-[#444746] flex items-center gap-2 text-xs text-[#8E918F]">
                                                                                <LinkIcon className="w-3 h-3" /> System will auto-embed from: {lesson.content}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {lesson.type === 'quiz' && (
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <h5 className="text-xs font-bold text-[#A8C7FA]">Quiz Questions</h5>
                                                                            <button onClick={() => handleAddQuizQuestion(expandedModuleIdx, lIdx)} className="text-[10px] bg-[#A8C7FA] text-[#062E6F] px-3 py-1 rounded-full font-bold">+ New Question</button>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            {lesson.questions?.map((q, qIdx) => (
                                                                                <div key={q.id} className="p-4 bg-[#131314] rounded-2xl border border-[#444746] space-y-3">
                                                                                    <div className="flex gap-2">
                                                                                        <input className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-[#E3E3E3] focus:ring-0" value={q.question} onChange={e => {
                                                                                            const mods = [...currentCourse.modules!];
                                                                                            mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].question = e.target.value;
                                                                                            setCurrentCourse({...currentCourse, modules: mods});
                                                                                        }} />
                                                                                        <button onClick={() => {
                                                                                            const mods = [...currentCourse.modules!];
                                                                                            mods[expandedModuleIdx].lessons[lIdx].questions!.splice(qIdx, 1);
                                                                                            setCurrentCourse({...currentCourse, modules: mods});
                                                                                        }} className="text-[#CF6679]"><Trash2 className="w-4 h-4" /></button>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        {q.options.map((opt, optIdx) => (
                                                                                            <div key={optIdx} className="flex items-center gap-2 bg-[#1E1F20] px-2 py-1 rounded-lg border border-[#444746]">
                                                                                                <input type="radio" checked={q.correctAnswer === optIdx} onChange={() => {
                                                                                                    const mods = [...currentCourse.modules!];
                                                                                                    mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].correctAnswer = optIdx;
                                                                                                    setCurrentCourse({...currentCourse, modules: mods});
                                                                                                }} />
                                                                                                <input className="bg-transparent border-none p-1 text-xs text-[#C4C7C5] focus:ring-0 w-full" value={opt} onChange={e => {
                                                                                                    const mods = [...currentCourse.modules!];
                                                                                                    mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].options[optIdx] = e.target.value;
                                                                                                    setCurrentCourse({...currentCourse, modules: mods});
                                                                                                }} />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Common Attachment Option */}
                                                                <div className="pt-4 border-t border-[#444746]/50">
                                                                    <label className="block text-xs font-bold text-[#8E918F] mb-3">Attach PDF or DOC Resource</label>
                                                                    <div className="flex items-center gap-4">
                                                                        <label className="flex-1 bg-[#131314] border border-dashed border-[#444746] p-4 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-[#131314]/50 transition-colors">
                                                                            <Upload className="w-5 h-5 text-[#5E5E5E]" />
                                                                            <span className="text-xs text-[#8E918F]">
                                                                                {lesson.fileUrl ? 'File Attached (Click to Change)' : 'Click to Upload Document'}
                                                                            </span>
                                                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, expandedModuleIdx, lIdx)} />
                                                                        </label>
                                                                        {lesson.fileUrl && (
                                                                            <button onClick={() => updateLessonData(expandedModuleIdx, lIdx, 'fileUrl', '')} className="p-4 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-2xl border border-[#CF6679]/30"><Trash2 className="w-5 h-5" /></button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="flex justify-end pt-2">
                                                                    <button onClick={() => {
                                                                        const mods = [...currentCourse.modules!];
                                                                        mods[expandedModuleIdx].lessons.splice(lIdx, 1);
                                                                        setCurrentCourse({...currentCourse, modules: mods});
                                                                        setEditingLesson(null);
                                                                    }} className="text-[10px] text-[#CF6679] hover:underline">Remove Lesson Entirely</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10">
                                            <div className="w-20 h-20 bg-[#131314] rounded-full flex items-center justify-center mb-6"><GraduationCap className="w-10 h-10" /></div>
                                            <h3 className="text-xl font-bold">Select a Module</h3>
                                            <p className="max-w-xs text-sm">Choose a module from the list on the left or create a new one to start building your lesson plan.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-6 border-t border-[#444746] bg-[#131314] flex justify-between items-center">
                        <p className="text-xs text-[#5E5E5E]">All changes are saved to memory. Press Save to push to Database.</p>
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setShowCourseModal(false)}>Discard</Button>
                            <Button onClick={handleSaveCourse} icon={Save}>Save Course & Curriculum</Button>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};