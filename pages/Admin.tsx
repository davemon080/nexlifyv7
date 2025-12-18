
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
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
  GripVertical, Settings, Save, Globe, Eye, BookOpen, Bell, Send, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon, DownloadCloud,
  Sparkles, Image as ImageIcon, DollarSign, Tag, Info, MessageSquare, Mail, Calendar, ExternalLink, UserCheck, Settings2
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showDialog } = useFeedback();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'training' | 'inquiries' | 'notifications' | 'seo' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ platformName: 'Nexlify' });
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [courseGrantSearch, setCourseGrantSearch] = useState('');
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ 
    title: '', description: '', price: 0, category: ProductCategory.TEMPLATE,
    imageUrl: '', previewUrl: '', downloadUrl: ''
  });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({ title: '', modules: [] });

  // Notifications State
  const [notifForm, setNotifForm] = useState({ userId: 'all', title: '', message: '', type: 'info' as any });

  // SEO State
  const [seoPage, setSeoPage] = useState('/');
  const [seoForm, setSeoForm] = useState<PageSeoConfig>({ path: '/', title: '', description: '', keywords: '' });

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) navigate('/login');
    else loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [p, i, c, u, s, st] = await Promise.all([
        getProducts(), getInquiries(), getCourses(), getAllUsers(), getAppSettings(), getAdminStats()
      ]);
      setProducts(p);
      setInquiries(i);
      setCourses(c);
      setUsers(u);
      setAppSettings(s);
      setTotalRevenue(st.totalRevenue);
      
      // Update SEO form with current page settings if exists
      if (s.seoDefinitions?.[seoPage]) {
          setSeoForm(s.seoDefinitions[seoPage]);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAssignTutor = async (courseId: string, tutorId: string) => {
    const course = courses.find(c => c.id === courseId);
    const tutor = users.find(u => u.id === tutorId);
    if (!course || !tutor) return;

    try {
      const updatedCourse = { ...course, tutorId: tutor.id, instructor: tutor.name };
      const updatedUser = { ...tutor, role: 'tutor' as any };
      
      await updateCourse(updatedCourse);
      await updateUser(updatedUser);
      
      showToast(`${tutor.name} assigned to ${course.title}`, 'success');
      loadData();
    } catch (e) {
      showToast("Failed to assign tutor", 'error');
    }
  };

  const handleUpdateUserStatus = async (user: User, status: any) => {
      const updated = { ...user, status };
      await updateUser(updated);
      setUsers(users.map(u => u.id === user.id ? updated : u));
      setSelectedUser(updated);
      showToast(`User ${status} successful!`, 'success');
  };

  const handleGrantAccess = async (courseId: string) => {
      if (!selectedUser) return;
      const updated = await adminEnrollUser(selectedUser.id, courseId);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(updated);
      showToast("Course access granted.", 'success');
  };

  const handleRevokeAccess = async (courseId: string) => {
      if (!selectedUser) return;
      const updated = await adminRevokeAccess(selectedUser.id, courseId);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(updated);
      showToast("Access revoked.", 'info');
  };

  const handleAdjustBalance = (amount: number) => {
      showDialog({
        title: amount > 0 ? 'Top Up Wallet' : 'Deduct from Wallet',
        message: `Enter the amount to ${amount > 0 ? 'add to' : 'deduct from'} ${selectedUser?.name}'s balance.`,
        type: 'prompt',
        onConfirm: async (val) => {
          if (!selectedUser || !val) return;
          const numVal = parseFloat(val);
          if (isNaN(numVal)) { showToast("Invalid amount", 'error'); return; }
          const finalAmount = amount > 0 ? numVal : -numVal;
          const updated = { ...selectedUser, balance: selectedUser.balance + finalAmount };
          await updateUser(updated);
          setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
          setSelectedUser(updated);
          showToast("Balance updated.", 'success');
        }
      });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      if (isEditingProduct) await updateProduct(currentProduct as Product);
      else await addProduct({ ...currentProduct as Product, id: `p-${Date.now()}`, createdAt: new Date().toISOString() } as Product);
      setShowProductModal(false);
      showToast("Marketplace updated.", 'success');
      await loadData();
  };

  const handleSaveCourse = async () => {
      setLoading(true);
      if (isEditingCourse) await updateCourse(currentCourse as Course);
      else await addCourse({ ...currentCourse as Course, id: `c-${Date.now()}` } as Course);
      setShowCourseModal(false);
      showToast("Academy curriculum saved.", 'success');
      await loadData();
  };

  const handleSendNotif = async (e: React.FormEvent) => {
      e.preventDefault();
      await sendNotification({ ...notifForm, isBroadcast: notifForm.userId === 'all' });
      showToast("Notification broadcasted successfully.", 'success');
      setNotifForm({ userId: 'all', title: '', message: '', type: 'info' });
  };

  const handleSaveSeo = async () => {
      const updatedSettings = { 
          ...appSettings, 
          seoDefinitions: { 
              ...(appSettings.seoDefinitions || {}), 
              [seoPage]: seoForm 
          } 
      };
      await updateAppSettings(updatedSettings);
      setAppSettings(updatedSettings);
      showToast("SEO configurations saved.", 'success');
  };

  const handleSaveSettings = async () => {
      await updateAppSettings(appSettings);
      showToast("Platform settings updated.", 'success');
  };

  if (loading && !showCourseModal && !showProductModal) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Badge color="blue" className="mb-2">Admin Control Center</Badge>
          <h1 className="text-4xl font-bold text-[#E3E3E3]">Management</h1>
        </div>
        <div className="flex gap-4">
            <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746]">
                <div className="p-2 bg-[#0F5223] rounded-lg text-[#6DD58C]"><Wallet className="w-5 h-5" /></div>
                <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Revenue</p><p className="font-bold text-[#E3E3E3]">₦{totalRevenue.toLocaleString()}</p></div>
            </Card>
            <Card className="px-6 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746]">
                <div className="p-2 bg-[#0842A0] rounded-lg text-[#A8C7FA]"><Users className="w-5 h-5" /></div>
                <div><p className="text-[10px] text-[#8E918F] font-bold uppercase">Total Users</p><p className="font-bold text-[#E3E3E3]">{users.length}</p></div>
            </Card>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] mb-10">
        {['products', 'users', 'training', 'inquiries', 'notifications', 'seo', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#A8C7FA] text-[#062E6F] shadow-lg shadow-[#A8C7FA]/10' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                {tab === 'training' ? 'Academy' : tab === 'seo' ? 'SEO' : tab}
            </button>
        ))}
      </div>

      {activeTab === 'training' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1E1F20] p-6 rounded-3xl border border-[#444746]">
                <div>
                  <h3 className="text-xl font-bold text-[#E3E3E3]">Academy Courses</h3>
                  <p className="text-sm text-[#8E918F]">Assign instructors and build curriculums.</p>
                </div>
                <Button icon={Plus} onClick={() => { setIsEditingCourse(false); setCurrentCourse({ title: '', modules: [], price: 0 }); setShowCourseModal(true); }}>Create Course</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map(c => (
                    <Card key={c.id} className="p-6 border-[#444746] flex flex-col h-full">
                        <div className="flex gap-4 mb-6">
                            <img src={c.thumbnail} className="w-24 h-24 rounded-2xl object-cover bg-[#131314]" alt={c.title} />
                            <div className="flex-1">
                                <h4 className="font-bold text-[#E3E3E3] text-lg mb-1">{c.title}</h4>
                                <Badge color="blue" className="text-[10px] uppercase font-bold mb-2">{c.level}</Badge>
                                <div className="text-sm font-bold text-[#6DD58C]">₦{c.price.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-[#131314] rounded-2xl border border-[#444746]">
                            <label className="block text-[10px] font-black uppercase text-[#8E918F] mb-3">Course Instructor</label>
                            <div className="flex gap-3">
                                <select 
                                    className="flex-1 bg-[#1E1F20] border border-[#444746] rounded-xl px-4 py-2 text-xs text-[#E3E3E3] focus:border-[#A8C7FA] outline-none"
                                    value={c.tutorId || ''}
                                    onChange={(e) => handleAssignTutor(c.id, e.target.value)}
                                >
                                    <option value="">None Assigned</option>
                                    {users.filter(u => u.role !== 'admin').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                                <div className="p-2 bg-[#A8C7FA]/10 rounded-xl">
                                    <UserCheck className="w-5 h-5 text-[#A8C7FA]" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" icon={Edit} onClick={() => { setIsEditingCourse(true); setCurrentCourse(c); setShowCourseModal(true); }}>Curriculum</Button>
                            <button onClick={() => {
                                showDialog({
                                  title: 'Delete Course',
                                  message: 'Are you sure you want to delete this course permanently?',
                                  type: 'confirm',
                                  onConfirm: () => deleteCourse(c.id).then(loadData)
                                });
                            }} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1E1F20] p-6 rounded-3xl border border-[#444746]">
                  <div>
                    <h3 className="text-xl font-bold text-[#E3E3E3]">Service Inquiries</h3>
                    <p className="text-sm text-[#8E918F]">New project requests from users.</p>
                  </div>
                  <Badge color="purple">{inquiries.length} Total</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inquiries.map(inq => (
                      <Card key={inq.id} className="p-6 border-[#444746] relative overflow-hidden group">
                          <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-[#A8C7FA]/10 flex items-center justify-center text-[#A8C7FA]">
                                      <MessageSquare className="w-6 h-6" />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-[#E3E3E3]">{inq.name}</h4>
                                      <div className="flex items-center gap-2 text-xs text-[#8E918F]">
                                          <Mail className="w-3 h-3" /> {inq.email}
                                      </div>
                                  </div>
                              </div>
                              <button onClick={() => deleteInquiry(inq.id).then(loadData)} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-xl">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                          <div className="bg-[#131314] rounded-2xl p-4 mb-6">
                              <Badge color="purple" className="mb-3 uppercase font-bold text-[10px]">{inq.serviceType}</Badge>
                              <p className="text-sm text-[#C4C7C5] leading-relaxed">"{inq.message}"</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#5E5E5E] uppercase tracking-widest">
                              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(inq.createdAt).toLocaleDateString()}</div>
                              <a href={`mailto:${inq.email}`} className="text-[#A8C7FA] hover:underline flex items-center gap-1">Reply via Email <ExternalLink className="w-3 h-3" /></a>
                          </div>
                      </Card>
                  ))}
                  {inquiries.length === 0 && <div className="md:col-span-2 py-20 text-center text-[#8E918F]">No inquiries found.</div>}
              </div>
          </div>
      )}

      {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto">
              <Card className="p-10 border-[#444746] bg-[#1E1F20]/50 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl"><Bell className="w-8 h-8 text-[#A8C7FA]" /></div>
                      <div>
                          <h3 className="text-2xl font-bold text-[#E3E3E3]">Activity Hub Broadcast</h3>
                          <p className="text-[#8E918F] text-sm">Send a notification to all users or a specific individual.</p>
                      </div>
                  </div>
                  
                  <form onSubmit={handleSendNotif} className="space-y-6">
                      <div>
                          <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Target Audience</label>
                          <select 
                            className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-4 text-sm text-[#E3E3E3] outline-none focus:border-[#A8C7FA]"
                            value={notifForm.userId}
                            onChange={(e) => setNotifForm({...notifForm, userId: e.target.value})}
                          >
                              <option value="all">Global (All Active Users)</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                          </select>
                      </div>
                      
                      <Input label="Headline / Title" value={notifForm.title} onChange={(e) => setNotifForm({...notifForm, title: e.target.value})} required />
                      
                      <Textarea label="Message Content" rows={4} value={notifForm.message} onChange={(e: any) => setNotifForm({...notifForm, message: e.target.value})} required />
                      
                      <div>
                          <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Notification Priority</label>
                          <div className="grid grid-cols-4 gap-3">
                              {['info', 'success', 'warning', 'danger'].map(type => (
                                  <button 
                                    key={type} 
                                    type="button" 
                                    onClick={() => setNotifForm({...notifForm, type})}
                                    className={`py-3 rounded-xl text-xs font-bold uppercase transition-all ${notifForm.type === type ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#131314] text-[#C4C7C5] border border-[#444746]'}`}
                                  >
                                      {type}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest" icon={Send}>Broadcast Message</Button>
                  </form>
              </Card>
          </div>
      )}

      {activeTab === 'seo' && (
          <div className="max-w-4xl mx-auto space-y-10">
              <Card className="p-8 border-[#444746]">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-[#9B72CB]/10 rounded-2xl"><Globe className="w-8 h-8 text-[#9B72CB]" /></div>
                      <div>
                          <h3 className="text-2xl font-bold text-[#E3E3E3]">Page SEO Configuration</h3>
                          <p className="text-[#8E918F] text-sm">Optimize your platform's visibility for search engines.</p>
                      </div>
                  </div>

                  <div className="grid md:grid-cols-12 gap-10">
                      <div className="md:col-span-4 border-r border-[#444746] pr-6">
                          <label className="block text-[10px] font-black uppercase text-[#8E918F] mb-4">Target Page</label>
                          <div className="space-y-2">
                              {['/', '/training', '/market', '/ai-tools', '/hire', '/earn'].map(path => (
                                  <button 
                                    key={path} 
                                    onClick={() => {
                                        setSeoPage(path);
                                        const config = appSettings.seoDefinitions?.[path] || { path, title: '', description: '', keywords: '' };
                                        setSeoForm(config);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${seoPage === path ? 'bg-[#A8C7FA]/10 text-[#A8C7FA] border border-[#A8C7FA]/20' : 'text-[#C4C7C5] hover:bg-[#131314]'}`}
                                  >
                                      {path === '/' ? 'Home' : path.substring(1).charAt(0).toUpperCase() + path.slice(2)}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="md:col-span-8 space-y-6">
                          <Input label="Meta Title" value={seoForm.title} onChange={(e) => setSeoForm({...seoForm, title: e.target.value})} />
                          <Textarea label="Meta Description" rows={3} value={seoForm.description} onChange={(e: any) => setSeoForm({...seoForm, description: e.target.value})} />
                          <Input label="Keywords (Comma separated)" value={seoForm.keywords} onChange={(e) => setSeoForm({...seoForm, keywords: e.target.value})} />
                          <Input label="OG Image URL" value={seoForm.ogImage} onChange={(e) => setSeoForm({...seoForm, ogImage: e.target.value})} />
                          <Button className="w-full" icon={Save} onClick={handleSaveSeo}>Update SEO for {seoPage}</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
              <Card className="p-10 border-[#444746]">
                  <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-[#D96570]/10 rounded-2xl"><Settings2 className="w-8 h-8 text-[#D96570]" /></div>
                      <div>
                          <h3 className="text-2xl font-bold text-[#E3E3E3]">Platform Configuration</h3>
                          <p className="text-[#8E918F] text-sm">Global branding and administrative settings.</p>
                      </div>
                  </div>
                  
                  <div className="space-y-8">
                      <Input 
                        label="Platform Identity (Brand Name)" 
                        value={appSettings.platformName} 
                        onChange={(e) => setAppSettings({...appSettings, platformName: e.target.value})} 
                      />
                      
                      <Input 
                        label="Platform Logo URL" 
                        value={appSettings.logoUrl} 
                        onChange={(e) => setAppSettings({...appSettings, logoUrl: e.target.value})} 
                      />
                      
                      <div className="pt-4 border-t border-[#444746]">
                          <Button className="w-full py-4" icon={Save} onClick={handleSaveSettings}>Save Platform Settings</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* Course Curriculum Builder Modal */}
      {showCourseModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4">
              <div className="bg-[#1E1F20] w-full max-w-7xl h-full rounded-[48px] border border-[#444746] flex flex-col overflow-hidden shadow-2xl">
                  <div className="px-10 py-6 border-b border-[#444746] bg-[#131314] flex justify-between items-center">
                      <div className="flex items-center gap-6">
                          <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl"><GraduationCap className="text-[#A8C7FA]" /></div>
                          <div><h2 className="text-xl font-bold text-[#E3E3E3]">{isEditingCourse ? 'Edit Curriculum' : 'New Academy Course'}</h2></div>
                      </div>
                      <button onClick={() => setShowCourseModal(false)} className="p-3 hover:bg-[#1E1F20] rounded-full"><X className="w-8 h-8 text-[#5E5E5E]" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                      <div className="max-w-3xl mx-auto space-y-6">
                          <Input label="Course Title" value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} />
                          <Textarea label="Description" rows={5} value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <Input label="Price (₦)" type="number" value={currentCourse.price} onChange={e => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})} />
                              <Input label="Duration" value={currentCourse.duration} onChange={e => setCurrentCourse({...currentCourse, duration: e.target.value})} />
                          </div>
                          <Input label="Thumbnail URL" value={currentCourse.thumbnail} onChange={e => setCurrentCourse({...currentCourse, thumbnail: e.target.value})} />
                          <Button icon={Save} className="w-full" onClick={handleSaveCourse}>Save Course</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* User Manager Modal */}
      {selectedUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <Card className="max-w-4xl w-full h-[85vh] overflow-y-auto p-10 flex flex-col no-scrollbar bg-[#1E1F20]">
                  <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-full bg-[#A8C7FA] flex items-center justify-center text-3xl font-bold text-[#062E6F]">{selectedUser.name.charAt(0)}</div>
                          <div>
                              <h2 className="text-3xl font-bold text-[#E3E3E3]">{selectedUser.name}</h2>
                              <p className="text-[#8E918F]">{selectedUser.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-[#1E1F20] rounded-full transition-colors"><X className="w-8 h-8 text-[#5E5E5E]" /></button>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-8 flex-1">
                      <div className="md:col-span-2 space-y-8">
                          <div className="bg-[#131314] p-8 rounded-3xl border border-[#444746]">
                              <h4 className="text-xs font-black text-[#8E918F] uppercase mb-6 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Curriculum Access</h4>
                              <div className="flex gap-4 mb-6">
                                  <select className="flex-1 bg-[#1E1F20] border border-[#444746] rounded-2xl p-3 text-sm text-[#E3E3E3]" value={courseGrantSearch} onChange={e => setCourseGrantSearch(e.target.value)}>
                                      <option value="">Choose Course to Grant...</option>
                                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                  </select>
                                  <Button onClick={() => handleGrantAccess(courseGrantSearch)} disabled={!courseGrantSearch}>Grant</Button>
                              </div>
                              <div className="space-y-3">
                                  {(selectedUser.enrolledCourses || []).map(cid => (
                                      <div key={cid} className="p-4 bg-[#1E1F20] rounded-2xl flex justify-between items-center">
                                          <span className="text-sm font-bold text-[#E3E3E3]">{courses.find(c => c.id === cid)?.title || cid}</span>
                                          <button onClick={() => handleRevokeAccess(cid)} className="text-[10px] text-[#CF6679] font-black uppercase hover:underline">Revoke Access</button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                      <div className="space-y-6">
                          <div className="bg-[#131314] p-8 rounded-3xl border border-[#444746]">
                              <p className="text-[10px] font-black text-[#8E918F] uppercase mb-2">Wallet Balance</p>
                              <p className="text-3xl font-bold text-[#6DD58C] mb-6">₦{selectedUser.balance.toLocaleString()}</p>
                              <div className="grid grid-cols-2 gap-3">
                                  <Button size="sm" variant="outline" onClick={() => handleAdjustBalance(1)}>+ Topup</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleAdjustBalance(-1)}>- Deduct</Button>
                              </div>
                          </div>
                          <div className="bg-[#131314] p-8 rounded-3xl border border-[#444746] space-y-4">
                              <p className="text-[10px] font-black text-[#8E918F] uppercase mb-4">Account Control</p>
                              <Button variant={selectedUser.status === 'active' ? 'danger' : 'primary'} className="w-full" onClick={() => handleUpdateUserStatus(selectedUser, selectedUser.status === 'active' ? 'suspended' : 'active')}>{selectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}</Button>
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
