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
  GripVertical, Settings, Save, Globe, Eye, BookOpen, Bell, Send, HelpCircle, ChevronDown, ChevronUp, Link as LinkIcon, DownloadCloud,
  Sparkles, Image as ImageIcon, DollarSign, Tag, Info
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'training' | 'inquiries' | 'notifications' | 'seo' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ platformName: 'Nexlify' });
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Modals & Selection
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [courseGrantSearch, setCourseGrantSearch] = useState('');
  
  // Product Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ 
    title: '', 
    description: '', 
    price: 0, 
    category: ProductCategory.TEMPLATE,
    imageUrl: '',
    previewUrl: '',
    downloadUrl: ''
  });

  // Course Editor
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState<'basics' | 'curriculum'>('basics');
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({ title: '', modules: [] });
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(0);
  const [editingLesson, setEditingLesson] = useState<{ mIdx: number, lIdx: number } | null>(null);

  // Notifications & SEO
  const [notifForm, setNotifForm] = useState({ userId: 'all', title: '', message: '', type: 'info' as any });
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- DATABASE TOOLS ---
  const handleExportDB = () => {
      const data = { users, courses, products, appSettings, timestamp: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexlify_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
  };

  // --- USER ACTIONS ---
  const handleUpdateUserStatus = async (user: User, status: any) => {
      const updated = { ...user, status };
      await updateUser(updated);
      setUsers(users.map(u => u.id === user.id ? updated : u));
      setSelectedUser(updated);
  };

  const handleGrantAccess = async (courseId: string) => {
      if (!selectedUser) return;
      const updated = await adminEnrollUser(selectedUser.id, courseId);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(updated);
  };

  const handleRevokeAccess = async (courseId: string) => {
      if (!selectedUser) return;
      const updated = await adminRevokeAccess(selectedUser.id, courseId);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(updated);
  };

  const handleAdjustBalance = async (amount: number) => {
      if (!selectedUser) return;
      const updated = { ...selectedUser, balance: selectedUser.balance + amount };
      await updateUser(updated);
      setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
      setSelectedUser(updated);
  };

  // --- PRODUCT CRUD ---
  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      if (isEditingProduct) await updateProduct(currentProduct as Product);
      else await addProduct({ ...currentProduct as Product, id: `p-${Date.now()}`, createdAt: new Date().toISOString() } as Product);
      setShowProductModal(false);
      await loadData();
  };

  // --- COURSE CRUD & CURRICULUM ---
  const handleAddModule = () => {
      const newM: Module = { id: `m-${Date.now()}`, title: 'New Module', description: '', lessons: [] };
      setCurrentCourse({ ...currentCourse, modules: [...(currentCourse.modules || []), newM] });
      setExpandedModuleIdx((currentCourse.modules || []).length);
  };

  const handleAddLesson = (mIdx: number) => {
      const newL: Lesson = { id: `l-${Date.now()}`, title: 'New Lesson', type: 'text', content: '', duration: '15 mins' };
      const mods = [...currentCourse.modules!];
      mods[mIdx].lessons.push(newL);
      setCurrentCourse({ ...currentCourse, modules: mods });
      setEditingLesson({ mIdx, lIdx: mods[mIdx].lessons.length - 1 });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mIdx: number, lIdx: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = async () => {
          const hosted = await uploadHostedFile(file.name, file.type, reader.result as string);
          const mods = [...currentCourse.modules!];
          mods[mIdx].lessons[lIdx].fileUrl = `${window.location.origin}/#/template-view/${hosted.id}`;
          setCurrentCourse({ ...currentCourse, modules: mods });
      };
      reader.readAsDataURL(file);
  };

  const handleSaveCourse = async () => {
      setLoading(true);
      if (isEditingCourse) await updateCourse(currentCourse as Course);
      else await addCourse({ ...currentCourse as Course, id: `c-${Date.now()}` } as Course);
      setShowCourseModal(false);
      await loadData();
  };

  // --- SEO & SETTINGS ---
  const handleSaveSeo = async () => {
      const updatedSettings = { ...appSettings, seoDefinitions: { ...(appSettings.seoDefinitions || {}), [seoPage]: seoForm } };
      await updateAppSettings(updatedSettings);
      setAppSettings(updatedSettings);
      alert("SEO settings saved for " + seoPage);
  };

  const handleSendNotif = async (e: React.FormEvent) => {
      e.preventDefault();
      await sendNotification({ ...notifForm, isBroadcast: notifForm.userId === 'all' });
      alert("Notification dispatched!");
      setNotifForm({ userId: 'all', title: '', message: '', type: 'info' });
  };

  if (loading && !showCourseModal && !showProductModal) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto">
      
      {/* HEADER & STATS */}
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

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] mb-10">
        {['products', 'users', 'training', 'inquiries', 'notifications', 'seo', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#A8C7FA] text-[#062E6F] shadow-lg shadow-[#A8C7FA]/10' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                {tab === 'training' ? 'Academy' : tab === 'seo' ? 'SEO' : tab}
            </button>
        ))}
      </div>

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1E1F20] p-6 rounded-3xl border border-[#444746]">
                <div>
                  <h3 className="text-xl font-bold text-[#E3E3E3]">Digital Marketplace</h3>
                  <p className="text-sm text-[#8E918F]">Manage assets, templates, and ebooks.</p>
                </div>
                <Button icon={Plus} onClick={() => { setIsEditingProduct(false); setCurrentProduct({ title: '', price: 0, category: ProductCategory.TEMPLATE, description: '', imageUrl: '', previewUrl: '', downloadUrl: '' }); setShowProductModal(true); }}>Add Product</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                    <Card key={p.id} className="p-4 group relative flex flex-col h-full hover:border-[#A8C7FA]/50 transition-all duration-300">
                        <img src={p.imageUrl || 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop'} className="w-full h-40 object-cover rounded-xl mb-4 bg-[#131314]" />
                        <div className="flex justify-between items-start mb-2">
                           <Badge color="blue" className="text-[10px] uppercase font-bold">{p.category}</Badge>
                           <p className="text-sm font-bold text-[#6DD58C]">₦{p.price.toLocaleString()}</p>
                        </div>
                        <h4 className="font-bold text-[#E3E3E3] truncate mb-2">{p.title}</h4>
                        <p className="text-[10px] text-[#8E918F] line-clamp-2 mb-4 flex-grow">{p.description}</p>
                        <div className="flex gap-2 pt-3 border-t border-[#444746]">
                            <Button size="sm" variant="outline" className="flex-1" icon={Edit} onClick={() => { setIsEditingProduct(true); setCurrentProduct(p); setShowProductModal(true); }}>Edit</Button>
                            <button onClick={() => deleteProduct(p.id).then(loadData)} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
          <div className="space-y-6">
              <div className="flex gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E918F]" />
                      <input type="text" placeholder="Search by name or email..." className="w-full bg-[#1E1F20] border border-[#444746] rounded-2xl py-3.5 pl-12 pr-4 text-[#E3E3E3]" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                  <Button variant="outline" icon={DownloadCloud} onClick={handleExportDB}>Export Backup</Button>
              </div>
              <div className="bg-[#1E1F20] rounded-3xl border border-[#444746] overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-[#131314] text-[10px] font-black uppercase text-[#8E918F]">
                          <tr>
                              <th className="px-6 py-4">User Details</th>
                              <th className="px-6 py-4">Access Status</th>
                              <th className="px-6 py-4">Wallet</th>
                              <th className="px-6 py-4 text-right">Manage</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-[#444746]">
                          {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                              <tr key={u.id} className="hover:bg-[#2D2E30] transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-[#A8C7FA]/10 flex items-center justify-center text-[#A8C7FA] font-bold text-sm">{u.name.charAt(0)}</div>
                                          <div>
                                              <p className="text-sm font-bold text-[#E3E3E3]">{u.name}</p>
                                              <p className="text-[10px] text-[#8E918F]">{u.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4"><Badge color={u.status === 'active' ? 'green' : 'red'}>{u.status}</Badge></td>
                                  <td className="px-6 py-4 text-sm font-mono text-[#6DD58C]">₦{u.balance.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right"><MoreVertical className="w-5 h-5 ml-auto text-[#5E5E5E]" /></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- ACADEMY TAB --- */}
      {activeTab === 'training' && (
          <div className="space-y-6">
              <div className="bg-[#1E1F20] p-8 rounded-3xl border border-[#444746] flex justify-between items-center">
                  <div><h3 className="text-xl font-bold text-[#E3E3E3]">Nexlify Academy</h3><p className="text-sm text-[#8E918F]">Manage training bootcamps and curriculum content.</p></div>
                  <Button icon={Plus} onClick={() => { setIsEditingCourse(false); setCurrentCourse({ modules: [] }); setShowCourseModal(true); }}>New Course</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(c => (
                      <Card key={c.id} className="p-0 overflow-hidden group">
                          <img src={c.thumbnail} className="w-full h-44 object-cover opacity-80" />
                          <div className="p-6">
                              <h4 className="font-bold text-[#E3E3E3] mb-4">{c.title}</h4>
                              <div className="flex gap-2">
                                  <Button className="flex-1" variant="outline" size="sm" onClick={() => { setIsEditingCourse(true); setCurrentCourse(c); setShowCourseModal(true); }}>Edit Content</Button>
                                  <button onClick={() => deleteCourse(c.id).then(loadData)} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* --- BROADCAST TAB --- */}
      {activeTab === 'notifications' && (
          <Card className="max-w-xl mx-auto p-10">
              <h2 className="text-2xl font-bold text-[#E3E3E3] mb-8 flex items-center gap-3"><Bell className="text-[#A8C7FA]" /> Send Broadcast</h2>
              <form onSubmit={handleSendNotif} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#8E918F] uppercase mb-2">Recipient</label>
                    <select className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-4 text-[#E3E3E3]" value={notifForm.userId} onChange={e => setNotifForm({...notifForm, userId: e.target.value})}>
                        <option value="all">Broadcast to All Users</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                  </div>
                  <Input label="Title" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} />
                  <Textarea label="Message Body" value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} />
                  <div className="flex gap-4">
                      {['info', 'success', 'warning', 'danger'].map(type => (
                          <button key={type} type="button" onClick={() => setNotifForm({...notifForm, type: type as any})} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${notifForm.type === type ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#131314] text-[#8E918F]'}`}>{type}</button>
                      ))}
                  </div>
                  <Button type="submit" className="w-full" icon={Send}>Send Notification</Button>
              </form>
          </Card>
      )}

      {/* --- SEO TAB --- */}
      {activeTab === 'seo' && (
          <Card className="max-w-4xl mx-auto p-10">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-[#E3E3E3] flex items-center gap-3"><Globe className="text-[#A8C7FA]" /> SEO Manager</h2>
                  <select className="bg-[#131314] border border-[#444746] rounded-xl p-2 text-xs text-[#A8C7FA]" value={seoPage} onChange={e => setSeoPage(e.target.value)}>
                      {['/', '/market', '/training', '/hire', '/earn', '/ai-tools'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <Input label="Meta Title" value={seoForm.title} onChange={e => setSeoForm({...seoForm, title: e.target.value})} />
                      <Textarea label="Meta Description" value={seoForm.description} onChange={e => setSeoForm({...seoForm, description: e.target.value})} />
                      <Input label="Keywords" value={seoForm.keywords} onChange={e => setSeoForm({...seoForm, keywords: e.target.value})} />
                      <Button icon={Save} onClick={handleSaveSeo}>Save SEO Data</Button>
                  </div>
                  <div className="bg-[#131314] p-6 rounded-3xl border border-[#444746]">
                      <h4 className="text-[10px] font-black text-[#5E5E5E] uppercase mb-4">Google Preview</h4>
                      <div className="bg-white p-4 rounded-lg text-gray-800 text-sm">
                          <div className="text-blue-700 font-medium truncate">{seoForm.title || 'Page Title'}</div>
                          <div className="text-green-700 text-xs truncate">nexlify.com.ng{seoPage}</div>
                          <div className="text-gray-500 text-xs line-clamp-2">{seoForm.description || 'Add a description to see how it looks on Google.'}</div>
                      </div>
                  </div>
              </div>
          </Card>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
          <Card className="max-w-xl mx-auto p-10">
              <h2 className="text-2xl font-bold text-[#E3E3E3] mb-8 flex items-center gap-3"><Settings className="text-[#A8C7FA]" /> Global Config</h2>
              <div className="space-y-8">
                  <Input label="Platform Display Name" value={appSettings.platformName} onChange={e => setAppSettings({...appSettings, platformName: e.target.value})} />
                  <div className="space-y-4">
                      <label className="text-xs font-bold text-[#8E918F] uppercase">System Logo</label>
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-[#131314] border border-[#444746] flex items-center justify-center overflow-hidden">
                              {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-full h-full object-cover" /> : <Sparkles className="text-[#5E5E5E]" />}
                          </div>
                          <label className="bg-[#1E1F20] border border-[#444746] px-5 py-2 rounded-xl text-xs font-bold uppercase text-[#E3E3E3] cursor-pointer hover:bg-[#2D2E30] transition-all">
                              Upload New Logo
                              <input type="file" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if(file) {
                                      const r = new FileReader();
                                      r.onloadend = () => setAppSettings({...appSettings, logoUrl: r.result as string});
                                      r.readAsDataURL(file);
                                  }
                              }} />
                          </label>
                      </div>
                  </div>
                  <Button icon={Save} className="w-full" onClick={() => updateAppSettings(appSettings).then(() => alert("Saved!"))}>Update Platform Identity</Button>
              </div>
          </Card>
      )}

      {/* --- MODALS --- */}

      {/* User Manager Modal */}
      {selectedUser && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
              <Card className="max-w-4xl w-full h-[85vh] overflow-y-auto p-10 flex flex-col no-scrollbar">
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
                                  <Button size="sm" variant="outline" onClick={() => { const a = prompt("Amount to add:"); if(a) handleAdjustBalance(parseFloat(a)); }}>+ Topup</Button>
                                  <Button size="sm" variant="outline" onClick={() => { const a = prompt("Amount to deduct:"); if(a) handleAdjustBalance(-parseFloat(a)); }}>- Deduct</Button>
                              </div>
                          </div>
                          <div className="bg-[#131314] p-8 rounded-3xl border border-[#444746] space-y-4">
                              <p className="text-[10px] font-black text-[#8E918F] uppercase mb-4">Account Control</p>
                              <Button variant={selectedUser.status === 'active' ? 'danger' : 'primary'} className="w-full" onClick={() => handleUpdateUserStatus(selectedUser, selectedUser.status === 'active' ? 'suspended' : 'active')}>{selectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}</Button>
                              <button onClick={() => deleteUser(selectedUser.id).then(loadData)} className="w-full py-3 text-xs text-[#CF6679] font-bold hover:underline">Delete Permanently</button>
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* Product Editor Modal - REFINED VERSION */}
      {showProductModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
              <Card className="max-w-4xl w-full p-0 overflow-hidden bg-[#1E1F20] border-[#444746] shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center px-8 py-6 bg-[#131314] border-b border-[#444746]">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA]"><ImageIcon className="w-6 h-6" /></div>
                          <div>
                            <h2 className="text-xl font-bold text-[#E3E3E3]">{isEditingProduct ? 'Update Digital Asset' : 'New Digital Asset'}</h2>
                            <p className="text-xs text-[#8E918F] uppercase font-bold tracking-widest mt-1">Catalog Management</p>
                          </div>
                      </div>
                      <button onClick={() => setShowProductModal(false)} className="p-2.5 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] transition-all">
                        <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveProduct} className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                          {/* Left Column: Basic Info */}
                          <div className="md:col-span-7 space-y-6">
                              <div className="space-y-4">
                                  <h4 className="text-xs font-black text-[#A8C7FA] uppercase flex items-center gap-2"><Info className="w-3.5 h-3.5" /> General Details</h4>
                                  <Input 
                                      label="Asset Title" 
                                      placeholder="e.g. Modern Landing Page Template" 
                                      value={currentProduct.title} 
                                      onChange={e => setCurrentProduct({...currentProduct, title: e.target.value})} 
                                      required
                                  />
                                  <Textarea 
                                      label="Pitch Description" 
                                      placeholder="Tell customers why they should buy this resource..." 
                                      rows={4}
                                      value={currentProduct.description} 
                                      onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} 
                                      required
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-black text-[#A8C7FA] uppercase flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Pricing</h4>
                                      <Input 
                                          label="Price (₦)" 
                                          type="number" 
                                          placeholder="0 for free"
                                          value={currentProduct.price} 
                                          onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} 
                                          required
                                      />
                                  </div>
                                  <div className="space-y-4">
                                      <h4 className="text-xs font-black text-[#A8C7FA] uppercase flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Classification</h4>
                                      <div>
                                          <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Category</label>
                                          <select 
                                              className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-3.5 text-sm text-[#E3E3E3] outline-none focus:border-[#A8C7FA] transition-all" 
                                              value={currentProduct.category} 
                                              onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as ProductCategory})}
                                          >
                                              {Object.values(ProductCategory).map(v => <option key={v} value={v}>{v}</option>)}
                                          </select>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="space-y-4">
                                  <h4 className="text-xs font-black text-[#A8C7FA] uppercase flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5" /> Resource Links</h4>
                                  <Input 
                                      label="Live Preview URL" 
                                      placeholder="https://..." 
                                      value={currentProduct.previewUrl} 
                                      onChange={e => setCurrentProduct({...currentProduct, previewUrl: e.target.value})} 
                                  />
                                  <Input 
                                      label="Download Source (Zip/PDF)" 
                                      placeholder="Direct link to file" 
                                      value={currentProduct.downloadUrl} 
                                      onChange={e => setCurrentProduct({...currentProduct, downloadUrl: e.target.value})} 
                                      required
                                  />
                              </div>
                          </div>

                          {/* Right Column: Visuals */}
                          <div className="md:col-span-5 space-y-6">
                              <div className="space-y-4">
                                  <h4 className="text-xs font-black text-[#A8C7FA] uppercase flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5" /> Cover Media</h4>
                                  <div className="aspect-[4/3] bg-[#131314] border-2 border-dashed border-[#444746] rounded-3xl flex flex-col items-center justify-center overflow-hidden relative group">
                                      {currentProduct.imageUrl ? (
                                          <>
                                              <img src={currentProduct.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                  <Button size="sm" variant="danger" icon={X} onClick={() => setCurrentProduct({...currentProduct, imageUrl: ''})}>Remove</Button>
                                              </div>
                                          </>
                                      ) : (
                                          <div className="text-center p-6">
                                              <ImageIcon className="w-10 h-10 text-[#444746] mx-auto mb-3" />
                                              <p className="text-xs text-[#8E918F]">Thumbnail will appear here once URL is provided</p>
                                          </div>
                                      )}
                                  </div>
                                  <Input 
                                      label="Image URL" 
                                      placeholder="https://images.unsplash.com/..." 
                                      value={currentProduct.imageUrl} 
                                      onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} 
                                      required
                                  />
                                  <p className="text-[10px] text-[#8E918F] leading-relaxed italic">
                                      Tip: Use high-quality JPG/PNG images. Unsplash or Cloudinary links work best.
                                  </p>
                              </div>
                          </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-[#444746] mt-8">
                          <Button variant="outline" className="sm:flex-1 py-4 order-2 sm:order-1" onClick={() => setShowProductModal(false)}>Discard Changes</Button>
                          <Button type="submit" className="sm:flex-1 py-4 order-1 sm:order-2" icon={Save}>
                              {isEditingProduct ? 'Update Asset' : 'Publish to Marketplace'}
                          </Button>
                      </div>
                  </form>
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
                      <div className="flex gap-2 bg-[#131314] p-1.5 rounded-full border border-[#444746]">
                          <button onClick={() => setCourseModalTab('basics')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${courseModalTab === 'basics' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Basics</button>
                          <button onClick={() => setCourseModalTab('curriculum')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${courseModalTab === 'curriculum' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Curriculum</button>
                      </div>
                      <button onClick={() => setShowCourseModal(false)} className="p-3 hover:bg-[#1E1F20] rounded-full"><X className="w-8 h-8 text-[#5E5E5E]" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                      {courseModalTab === 'basics' ? (
                          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-6">
                                  <Input label="Title" value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} />
                                  <Textarea label="Short Pitch" rows={5} value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} />
                                  <div className="grid grid-cols-2 gap-4">
                                      <Input label="Price (₦)" type="number" value={currentCourse.price} onChange={e => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})} />
                                      <Input label="Instructor" value={currentCourse.instructor} onChange={e => setCurrentCourse({...currentCourse, instructor: e.target.value})} />
                                  </div>
                              </div>
                              <div className="space-y-6">
                                  <div className="aspect-video bg-[#131314] border-2 border-dashed border-[#444746] rounded-3xl flex items-center justify-center overflow-hidden relative group">
                                      {currentCourse.thumbnail ? <img src={currentCourse.thumbnail} className="w-full h-full object-cover" /> : <p className="text-[#5E5E5E] text-xs">Drop Thumbnail</p>}
                                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                          <Upload className="text-white" />
                                          <input type="file" className="hidden" onChange={e => {
                                              const f = e.target.files?.[0];
                                              if(f) { const r = new FileReader(); r.onloadend = () => setCurrentCourse({...currentCourse, thumbnail: r.result as string}); r.readAsDataURL(f); }
                                          }} />
                                      </label>
                                  </div>
                                  <select className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-4 text-[#E3E3E3]" value={currentCourse.level} onChange={e => setCurrentCourse({...currentCourse, level: e.target.value as any})}>
                                      <option value="Beginner">Beginner</option>
                                      <option value="Intermediate">Intermediate</option>
                                      <option value="Advanced">Advanced</option>
                                  </select>
                                  <Input label="Course Duration" placeholder="e.g., 12 Weeks" value={currentCourse.duration} onChange={e => setCurrentCourse({...currentCourse, duration: e.target.value})} />
                              </div>
                          </div>
                      ) : (
                          <div className="max-w-6xl mx-auto flex gap-10">
                              <div className="w-80 space-y-4">
                                  <div className="flex justify-between items-center mb-4"><h4 className="text-[10px] font-black uppercase text-[#A8C7FA]">Module List</h4><button onClick={handleAddModule} className="p-1 bg-[#A8C7FA] text-[#062E6F] rounded-lg"><Plus className="w-4 h-4" /></button></div>
                                  {(currentCourse.modules || []).map((m, idx) => (
                                      <div key={m.id} onClick={() => setExpandedModuleIdx(idx)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${expandedModuleIdx === idx ? 'bg-[#A8C7FA]/10 border-[#A8C7FA]/40 text-[#A8C7FA]' : 'bg-[#131314] border-[#444746] text-[#8E918F]'}`}>
                                          <GripVertical className="w-4 h-4 opacity-20" /><span className="text-sm font-bold truncate">{m.title}</span>
                                      </div>
                                  ))}
                              </div>
                              <div className="flex-1 space-y-6">
                                  {expandedModuleIdx !== null && currentCourse.modules && currentCourse.modules[expandedModuleIdx] ? (
                                      <div className="bg-[#131314] p-10 rounded-[40px] border border-[#444746] animate-in slide-in-from-right duration-300">
                                          <div className="flex justify-between gap-4 mb-10">
                                              <input className="bg-transparent border-none text-2xl font-bold text-[#E3E3E3] w-full focus:ring-0" value={currentCourse.modules[expandedModuleIdx].title} onChange={e => {
                                                  const mods = [...currentCourse.modules!];
                                                  mods[expandedModuleIdx].title = e.target.value;
                                                  setCurrentCourse({...currentCourse, modules: mods});
                                              }} />
                                              <button onClick={() => { const mods = [...currentCourse.modules!]; mods.splice(expandedModuleIdx, 1); setCurrentCourse({...currentCourse, modules: mods}); setExpandedModuleIdx(null); }} className="text-[#CF6679]"><Trash2 /></button>
                                          </div>
                                          <div className="space-y-4">
                                              <div className="flex justify-between items-center mb-6"><h5 className="text-[10px] font-black text-[#5E5E5E] uppercase tracking-widest">Lesson Editor</h5><Button size="sm" variant="outline" icon={Plus} onClick={() => handleAddLesson(expandedModuleIdx)}>New Lesson</Button></div>
                                              {currentCourse.modules[expandedModuleIdx].lessons.map((lesson, lIdx) => (
                                                  <div key={lesson.id} className="bg-[#1E1F20] rounded-3xl border border-[#444746] overflow-hidden">
                                                      <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#2D2E30]" onClick={() => setEditingLesson(editingLesson?.lIdx === lIdx ? null : { mIdx: expandedModuleIdx, lIdx })}>
                                                          <div className="flex items-center gap-4">
                                                              {lesson.type === 'video' ? <Video className="w-4 h-4 text-[#CF6679]" /> : lesson.type === 'quiz' ? <HelpCircle className="w-4 h-4 text-[#FFD97D]" /> : <FileText className="w-4 h-4 text-[#A8C7FA]" />}
                                                              <span className="text-sm font-bold text-[#E3E3E3]">{lesson.title}</span>
                                                          </div>
                                                          {editingLesson?.lIdx === lIdx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                      </div>
                                                      {editingLesson?.lIdx === lIdx && (
                                                          <div className="p-8 border-t border-[#444746] space-y-6">
                                                              <div className="grid grid-cols-2 gap-4">
                                                                  <Input label="Title" value={lesson.title} onChange={e => {
                                                                      const mods = [...currentCourse.modules!];
                                                                      mods[expandedModuleIdx].lessons[lIdx].title = e.target.value;
                                                                      setCurrentCourse({...currentCourse, modules: mods});
                                                                  }} />
                                                                  <select className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-3 text-sm text-[#E3E3E3]" value={lesson.type} onChange={e => {
                                                                      const mods = [...currentCourse.modules!];
                                                                      mods[expandedModuleIdx].lessons[lIdx].type = e.target.value as any;
                                                                      setCurrentCourse({...currentCourse, modules: mods});
                                                                  }}>
                                                                      <option value="text">Read (Text)</option>
                                                                      <option value="video">Watch (YouTube)</option>
                                                                      <option value="quiz">Quiz</option>
                                                                  </select>
                                                              </div>
                                                              {lesson.type === 'video' && <Input label="YouTube URL" placeholder="https://..." value={lesson.content} onChange={e => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].content = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} />}
                                                              {lesson.type === 'text' && <Textarea label="Content" rows={6} value={lesson.content} onChange={e => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].content = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} />}
                                                              {lesson.type === 'quiz' && (
                                                                  <div className="space-y-4">
                                                                      <div className="flex justify-between items-center"><h6 className="text-xs font-bold text-[#A8C7FA]">Quiz Builder</h6><button className="text-[10px] bg-[#A8C7FA] text-[#062E6F] px-3 py-1 rounded-lg" onClick={() => {
                                                                          const mods = [...currentCourse.modules!];
                                                                          const q: QuizQuestion = { id: `q-${Date.now()}`, question: 'Question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0 };
                                                                          mods[expandedModuleIdx].lessons[lIdx].questions = [...(mods[expandedModuleIdx].lessons[lIdx].questions || []), q];
                                                                          setCurrentCourse({...currentCourse, modules: mods});
                                                                      }}>+ Add Question</button></div>
                                                                      {(lesson.questions || []).map((q, qIdx) => (
                                                                          <div key={q.id} className="p-4 bg-[#131314] rounded-2xl border border-[#444746] space-y-4">
                                                                              <div className="flex gap-4"><input className="flex-1 bg-transparent border-none text-sm font-bold text-[#E3E3E3] focus:ring-0" value={q.question} onChange={e => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].question = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} /><button onClick={() => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].questions!.splice(qIdx, 1); setCurrentCourse({...currentCourse, modules: mods}); }} className="text-[#CF6679]"><Trash2 className="w-4 h-4" /></button></div>
                                                                              <div className="grid grid-cols-2 gap-2">
                                                                                  {q.options.map((opt, oIdx) => (
                                                                                      <div key={oIdx} className="flex items-center gap-2 bg-[#1E1F20] px-3 py-1.5 rounded-xl border border-[#444746]">
                                                                                          <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].correctAnswer = oIdx; setCurrentCourse({...currentCourse, modules: mods}); }} />
                                                                                          <input className="bg-transparent border-none text-xs text-[#8E918F] w-full" value={opt} onChange={e => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].questions![qIdx].options[oIdx] = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} />
                                                                                      </div>
                                                                                  ))}
                                                                              </div>
                                                                          </div>
                                                                      ))}
                                                                  </div>
                                                              )}
                                                              <div className="pt-4 border-t border-[#444746]">
                                                                  <label className="block text-[10px] font-black text-[#5E5E5E] uppercase mb-4">Lesson Attachment (PDF/DOC)</label>
                                                                  <div className="flex gap-4">
                                                                      <label className="flex-1 bg-[#131314] border-2 border-dashed border-[#444746] rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:bg-[#131314]/50">
                                                                          <Upload className="w-5 h-5 text-[#5E5E5E]" />
                                                                          <span className="text-xs text-[#8E918F]">{lesson.fileUrl ? 'File Selected' : 'Choose Supplement File'}</span>
                                                                          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, expandedModuleIdx, lIdx)} />
                                                                      </label>
                                                                      {lesson.fileUrl && <button onClick={() => { const mods = [...currentCourse.modules!]; mods[expandedModuleIdx].lessons[lIdx].fileUrl = ''; setCurrentCourse({...currentCourse, modules: mods}); }} className="p-4 border border-[#CF6679]/30 text-[#CF6679] rounded-2xl"><Trash2 /></button>}
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ) : <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-20"><div className="w-20 h-20 bg-[#131314] rounded-full flex items-center justify-center mb-6"><GraduationCap className="w-10 h-10" /></div><h4 className="font-bold">Structure Needed</h4><p className="text-sm">Select or create a module to start building lessons.</p></div>}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="px-10 py-8 border-t border-[#444746] bg-[#131314] flex justify-between items-center">
                      <p className="text-xs text-[#5E5E5E]">Drafts are temporarily stored. Click Save to persist to database.</p>
                      <div className="flex gap-4"><Button variant="outline" onClick={() => setShowCourseModal(false)}>Discard</Button><Button icon={Save} onClick={handleSaveCourse}>Commit Curriculum</Button></div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};