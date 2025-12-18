import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getProducts, getInquiries, addProduct, deleteProduct, updateProduct, 
  getCourses, getAllUsers, updateUser, deleteUser, getUserActivity, 
  addCourse, updateCourse, deleteCourse, adminEnrollUser, getAppSettings, 
  updateAppSettings, getAdminStats, deleteInquiry, adminRevokeAccess, 
  sendNotification 
} from '../services/mockData';
import { 
  Product, Inquiry, ProductCategory, Course, User, ActivityLog, 
  Module, Lesson, QuizQuestion, AppSettings, PageSeoConfig 
} from '../types';
import { Button, Input, Card, Badge, Textarea } from '../components/UI';
import { 
  Plus, Trash2, Mail, LayoutGrid, GraduationCap, Loader2, Users, 
  Wallet, Search, MoreVertical, Shield, Clock, X, Check, 
  AlertTriangle, Upload, FileText, Download, Edit, Video, 
  GripVertical, Gift, Settings, Save, BarChart3, TrendingUp, 
  Globe, Eye, BookOpen, Cloud, Bell, Send 
} from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'inquiries' | 'training' | 'users' | 'settings' | 'seo' | 'notifications'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ platformName: 'Nexlify' });
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // User Management State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<ActivityLog[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [selectedCourseToGrant, setSelectedCourseToGrant] = useState('');

  // Product Management State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    title: '', description: '', price: 0, category: ProductCategory.EBOOK, imageUrl: '', previewUrl: '', downloadUrl: ''
  });

  // Course Management State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState<'basics' | 'curriculum'>('basics');
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({
      title: '', description: '', thumbnail: '', level: 'Beginner', duration: '', price: 0, instructor: '', modules: []
  });

  // SEO Management State
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>('/');
  const [seoForm, setSeoForm] = useState<PageSeoConfig>({
      path: '/', title: '', description: '', keywords: '', ogImage: ''
  });

  // Notification State
  const [notifForm, setNotifForm] = useState({ userId: 'all', title: '', message: '', type: 'info' as any });
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  
  const knownRoutes = [
      { path: '/', name: 'Home Page' },
      { path: '/market', name: 'Marketplace' },
      { path: '/training', name: 'Training Academy' },
      { path: '/hire', name: 'Hire Us / Services' },
      { path: '/earn', name: 'Earn / Freelance' },
      { path: '/ai-tools', name: 'AI Tools Hub' },
      { path: '/login', name: 'Login Page' },
      { path: '/register', name: 'Register Page' }
  ];

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
        getProducts(),
        getInquiries(),
        getCourses(),
        getAllUsers(),
        getAppSettings(),
        getAdminStats()
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

  // --- DATABASE EXPORT LOGIC ---
  const handleExportDatabase = () => {
      const dbData = { timestamp: new Date().toISOString(), users, products, inquiries, courses, appSettings };
      const dataStr = JSON.stringify(dbData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexlify_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- NOTIFICATION HANDLERS ---
  const handleSendNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!notifForm.title || !notifForm.message) return;
      setIsSendingNotif(true);
      try {
          await sendNotification({
              userId: notifForm.userId,
              title: notifForm.title,
              message: notifForm.message,
              type: notifForm.type,
              isBroadcast: notifForm.userId === 'all'
          });
          alert("Notification sent successfully!");
          setNotifForm({ userId: 'all', title: '', message: '', type: 'info' });
      } catch (e) {
          alert("Failed to send notification.");
      } finally {
          setIsSendingNotif(false);
      }
  };

  // --- SETTINGS HANDLERS ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setAppSettings({ ...appSettings, logoUrl: reader.result as string });
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = () => {
      updateAppSettings(appSettings);
      alert("Settings saved successfully!");
  };

  // --- SEO HANDLERS ---
  const handleSeoPageChange = (path: string) => {
      setSelectedSeoPage(path);
      const existing = appSettings.seoDefinitions?.[path];
      if (existing) setSeoForm(existing);
      else setSeoForm({ path, title: '', description: '', keywords: '', ogImage: '' });
  };

  const handleSaveSeo = () => {
      const updatedSeoDefs = { ...(appSettings.seoDefinitions || {}) };
      updatedSeoDefs[seoForm.path] = seoForm;
      const updatedSettings = { ...appSettings, seoDefinitions: updatedSeoDefs };
      setAppSettings(updatedSettings);
      updateAppSettings(updatedSettings);
      alert(`SEO settings for ${seoForm.path} saved!`);
  };

  // --- USER HANDLERS ---
  const handleUserClick = async (user: User) => {
      const freshUser = users.find(u => u.id === user.id) || user;
      setSelectedUser(freshUser);
      const logs = await getUserActivity(user.id);
      setUserActivity(logs);
      setSelectedCourseToGrant('');
  };

  const handleUpdateUser = async (updatedUser: User) => {
      setIsUpdatingUser(true);
      await updateUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser); 
      setIsUpdatingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
      if(window.confirm('Permanently delete this user?')) {
          setIsUpdatingUser(true);
          await deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
          setSelectedUser(null);
          setIsUpdatingUser(false);
      }
  };

  const handleGrantAccess = async () => {
      if (!selectedUser || !selectedCourseToGrant) return;
      setIsUpdatingUser(true);
      const updatedUser = await adminEnrollUser(selectedUser.id, selectedCourseToGrant);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setIsUpdatingUser(false);
      alert(`Access granted.`);
      setSelectedCourseToGrant('');
  };

  const handleRevokeAccess = async (courseId: string) => {
      if (!selectedUser || !window.confirm("Revoke access to this course?")) return;
      setIsUpdatingUser(true);
      try {
          const updatedUser = await adminRevokeAccess(selectedUser.id, courseId);
          setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
          setSelectedUser(updatedUser);
      } catch (e) { alert("Failed"); } finally { setIsUpdatingUser(false); }
  };

  // --- INQUIRIES HANDLERS ---
  const handleDeleteInquiry = async (id: string) => {
      if(window.confirm("Delete inquiry?")) {
          await deleteInquiry(id);
          setInquiries(prev => prev.filter(i => i.id !== id));
      }
  };

  // --- PRODUCT HANDLERS ---
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Delete product?')) {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const openAddProductModal = () => {
      setIsEditingProduct(false);
      setNewProduct({ title: '', description: '', price: 0, category: ProductCategory.EBOOK, imageUrl: '', previewUrl: '', downloadUrl: '' });
      setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
      setIsEditingProduct(true);
      setNewProduct({ ...product });
      setShowProductModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProduct({ ...newProduct, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newProduct.title && newProduct.description && newProduct.imageUrl) {
        if (isEditingProduct && newProduct.id) {
            const updatedProduct = newProduct as Product;
            await updateProduct(updatedProduct);
            setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        } else {
            const productToAdd: Product = {
                id: Math.random().toString(36).substring(2, 9),
                title: newProduct.title!,
                description: newProduct.description!,
                price: Number(newProduct.price) || 0,
                category: newProduct.category as ProductCategory,
                imageUrl: newProduct.imageUrl!,
                previewUrl: newProduct.previewUrl || '',
                downloadUrl: newProduct.downloadUrl || '',
                createdAt: new Date().toISOString()
            };
            await addProduct(productToAdd);
            setProducts(prev => [productToAdd, ...prev]);
        }
      setShowProductModal(false);
    }
  };

  // --- COURSE HANDLERS ---
  const handleCourseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentCourse({ ...currentCourse, thumbnail: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleAddModule = () => {
      const newModule: Module = { id: `m-${Date.now()}`, title: 'New Module', description: '', lessons: [] };
      setCurrentCourse({ ...currentCourse, modules: [...(currentCourse.modules || []), newModule] });
  };

  const handleAddLesson = (mIdx: number) => {
      const newLesson: Lesson = { id: `l-${Date.now()}`, title: 'New Lesson', type: 'text', content: '', duration: '10 mins' };
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[mIdx].lessons.push(newLesson);
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleSaveCourse = async () => {
      if(!currentCourse.title) return;
      if(isEditingCourse && currentCourse.id) {
          await updateCourse(currentCourse as Course);
          setCourses(prev => prev.map(c => c.id === currentCourse.id ? currentCourse as Course : c));
      } else {
          const newCourse: Course = { ...currentCourse as Course, id: `c-${Date.now()}`, modules: currentCourse.modules || [] };
          await addCourse(newCourse);
          setCourses(prev => [newCourse, ...prev]);
      }
      setShowCourseModal(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0F5223] rounded-xl border border-[#6DD58C]/30 text-[#6DD58C]"><Wallet className="w-6 h-6" /></div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Revenue</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">₦{totalRevenue.toLocaleString()}</h2>
                </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0842A0] rounded-xl border border-[#A8C7FA]/30 text-[#A8C7FA]"><Users className="w-6 h-6" /></div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Users</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">{users.length}</h2>
                </div>
            </Card>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <Badge color="blue">Administrator</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-[#E3E3E3] mt-2">Dashboard</h1>
          </div>
          <div className="w-full lg:w-auto overflow-x-auto pb-2">
            <div className="flex gap-2 bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] min-w-max">
                <button onClick={() => setActiveTab('products')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'products' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Products</button>
                <button onClick={() => setActiveTab('users')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'users' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Users</button>
                <button onClick={() => setActiveTab('training')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'training' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Academy</button>
                <button onClick={() => setActiveTab('inquiries')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'inquiries' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Inquiries</button>
                <button onClick={() => setActiveTab('notifications')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'notifications' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Broadcast</button>
                <button onClick={() => setActiveTab('seo')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'seo' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>SEO</button>
                <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all ${activeTab === 'settings' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Settings</button>
                <button onClick={() => navigate('/admin/hosting')} className="px-5 py-2 rounded-full text-xs font-bold uppercase text-[#C4C7C5] hover:bg-[#444746] flex items-center gap-2"><Cloud className="w-3 h-3" /> Hosting</button>
            </div>
          </div>
        </div>

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-6"><Button onClick={openAddProductModal} icon={Plus}>Add Product</Button></div>
            <div className="bg-[#1E1F20] rounded-[24px] border border-[#444746] overflow-hidden">
                <table className="min-w-full divide-y divide-[#444746]">
                  <thead className="bg-[#131314]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#C4C7C5] uppercase">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#C4C7C5] uppercase">Category</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#C4C7C5] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#444746]">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-[#2D2E30]">
                        <td className="px-6 py-4 flex items-center gap-4">
                            <img src={p.imageUrl} className="w-10 h-10 rounded object-cover" />
                            <div className="text-sm font-bold text-[#E3E3E3]">{p.title}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#8E918F]">{p.category}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => openEditProductModal(p)} className="p-2 text-[#A8C7FA]"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-[#CF6679]"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8E918F]" />
                    <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-3 bg-[#1E1F20] border border-[#444746] rounded-2xl text-[#E3E3E3] outline-none" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                 </div>
                 <Button onClick={handleExportDatabase} variant="outline" icon={Download}>Export DB</Button>
             </div>
             <div className="bg-[#1E1F20] rounded-[24px] border border-[#444746] overflow-hidden">
                <table className="min-w-full divide-y divide-[#444746]">
                    <thead className="bg-[#131314]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#C4C7C5] uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[#C4C7C5] uppercase">Balance</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-[#C4C7C5] uppercase">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#444746]">
                        {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                            <tr key={u.id} className="hover:bg-[#2D2E30] cursor-pointer" onClick={() => handleUserClick(u)}>
                                <td className="px-6 py-4 text-sm">
                                    <div className="font-bold text-[#E3E3E3]">{u.name}</div>
                                    <div className="text-xs text-[#8E918F]">{u.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-[#6DD58C]">₦{u.balance.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right"><MoreVertical className="w-4 h-4 ml-auto text-[#5E5E5E]" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
        )}

        {/* --- TRAINING ACADEMY TAB --- */}
        {activeTab === 'training' && (
            <div className="space-y-6">
                <div className="bg-[#1E1F20] border border-dashed border-[#444746] rounded-2xl p-10 text-center">
                    <Button icon={Plus} onClick={() => { setIsEditingCourse(false); setCurrentCourse({ modules: [] }); setShowCourseModal(true); }}>Create New Course</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {courses.map(c => (
                        <Card key={c.id} className="p-6 flex items-center gap-4">
                            <img src={c.thumbnail} className="w-16 h-16 rounded object-cover" />
                            <div className="flex-1">
                                <h4 className="font-bold text-[#E3E3E3]">{c.title}</h4>
                                <div className="mt-2 flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => { setIsEditingCourse(true); setCurrentCourse(c); setShowCourseModal(true); }}>Edit</Button>
                                    <button onClick={() => deleteCourse(c.id).then(loadData)} className="p-2 text-[#CF6679]"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* --- INQUIRIES TAB --- */}
        {activeTab === 'inquiries' && (
            <div className="space-y-4">
                {inquiries.map(i => (
                    <Card key={i.id} className="p-6">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-[#E3E3E3]">{i.serviceType} from {i.name}</h3>
                            <button onClick={() => handleDeleteInquiry(i.id)} className="text-[#CF6679]"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="bg-[#131314] p-4 rounded text-sm text-[#C4C7C5]">{i.message}</div>
                        <div className="mt-4"><Button size="sm" onClick={() => window.location.href=`mailto:${i.email}`}>Reply Email</Button></div>
                    </Card>
                ))}
            </div>
        )}

        {/* --- BROADCAST TAB --- */}
        {activeTab === 'notifications' && (
            <Card className="max-w-2xl mx-auto p-8">
                <h2 className="text-xl font-bold text-[#E3E3E3] mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-[#A8C7FA]" /> Notification Center</h2>
                <form onSubmit={handleSendNotification} className="space-y-6">
                    <select className="w-full rounded-2xl bg-[#131314] border border-[#444746] px-5 py-3 text-[#E3E3E3] outline-none" value={notifForm.userId} onChange={e => setNotifForm({...notifForm, userId: e.target.value})}>
                        <option value="all">Broadcast to All Users</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                    </select>
                    <Input label="Title" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} required />
                    <Textarea label="Message" value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} required />
                    <div className="flex gap-4">
                        {['info', 'success', 'warning', 'danger'].map(t => (
                            <button key={t} type="button" onClick={() => setNotifForm({...notifForm, type: t})} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border-2 transition-all ${notifForm.type === t ? 'border-[#A8C7FA] bg-[#A8C7FA]/10 text-[#A8C7FA]' : 'border-[#444746] text-[#8E918F]'}`}>{t}</button>
                        ))}
                    </div>
                    <Button type="submit" className="w-full" icon={Send} isLoading={isSendingNotif}>Send Notification</Button>
                </form>
            </Card>
        )}

        {/* --- SEO TAB --- */}
        {activeTab === 'seo' && (
            <Card className="max-w-4xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-[#E3E3E3] flex items-center gap-2"><Globe className="w-5 h-5 text-[#A8C7FA]" /> SEO Manager</h2>
                    <select className="rounded-xl bg-[#131314] border border-[#444746] px-4 py-2 text-[#E3E3E3] outline-none" value={selectedSeoPage} onChange={e => handleSeoPageChange(e.target.value)}>
                        {knownRoutes.map(r => <option key={r.path} value={r.path}>{r.name}</option>)}
                    </select>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Input label="Page Title" value={seoForm.title} onChange={e => setSeoForm({...seoForm, title: e.target.value})} />
                        <Textarea label="Description" rows={3} value={seoForm.description} onChange={e => setSeoForm({...seoForm, description: e.target.value})} />
                        <Input label="Keywords" value={seoForm.keywords} onChange={e => setSeoForm({...seoForm, keywords: e.target.value})} />
                        <Button onClick={handleSaveSeo} icon={Save}>Save Settings</Button>
                    </div>
                    <div className="bg-[#131314] p-4 rounded-xl border border-[#444746]">
                        <h4 className="text-xs font-bold text-[#8E918F] mb-4 uppercase">Google Preview</h4>
                        <div className="bg-white p-3 rounded text-sm text-gray-800">
                            <div className="text-blue-700 truncate">{seoForm.title || 'Page Title'}</div>
                            <div className="text-green-700 text-xs truncate">nexlify.com.ng{selectedSeoPage}</div>
                            <div className="text-gray-500 text-xs line-clamp-2">{seoForm.description || 'Add a description...'}</div>
                        </div>
                    </div>
                </div>
            </Card>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
            <Card className="max-w-2xl mx-auto p-8">
                <h2 className="text-xl font-bold text-[#E3E3E3] mb-6 flex items-center gap-2"><Settings className="w-5 h-5" /> App Config</h2>
                <div className="space-y-6">
                    <Input label="Platform Name" value={appSettings.platformName} onChange={e => setAppSettings({...appSettings, platformName: e.target.value})} />
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-[#131314] border border-[#444746] flex items-center justify-center overflow-hidden">
                            {appSettings.logoUrl ? <img src={appSettings.logoUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-[#5E5E5E]">No Logo</span>}
                        </div>
                        <label className="cursor-pointer bg-[#1E1F20] px-4 py-2 rounded-full border border-[#444746] text-xs font-bold uppercase text-[#E3E3E3]">
                            Upload New Logo
                            <input type="file" className="hidden" onChange={handleLogoUpload} />
                        </label>
                    </div>
                    <Button onClick={handleSaveSettings} icon={Save}>Save Platform Changes</Button>
                </div>
            </Card>
        )}

        {/* --- MODALS --- */}

        {/* User Modal */}
        {selectedUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
                    <div className="flex justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#4285F4] flex items-center justify-center text-2xl font-bold">{selectedUser.name.charAt(0)}</div>
                            <div>
                                <h2 className="text-2xl font-bold text-[#E3E3E3]">{selectedUser.name}</h2>
                                <p className="text-[#8E918F]">{selectedUser.email}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-[#131314] p-6 rounded-2xl border border-[#444746]">
                                <h3 className="font-bold text-[#E3E3E3] mb-4">Enrollment</h3>
                                <div className="flex gap-2 mb-4">
                                    <select className="flex-1 rounded-xl bg-[#1E1F20] border border-[#444746] px-4 py-2 text-[#E3E3E3]" value={selectedCourseToGrant} onChange={e => setSelectedCourseToGrant(e.target.value)}>
                                        <option value="">Grant Access to...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                    <Button onClick={handleGrantAccess}>Grant</Button>
                                </div>
                                <div className="space-y-2">
                                    {selectedUser.enrolledCourses?.map(cid => (
                                        <div key={cid} className="flex justify-between text-xs bg-[#1E1F20] p-2 rounded">
                                            <span className="text-[#E3E3E3]">{courses.find(c => c.id === cid)?.title || cid}</span>
                                            <button onClick={() => handleRevokeAccess(cid)} className="text-[#CF6679]">Revoke</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-[#131314] p-6 rounded-2xl border border-[#444746]">
                                <h3 className="font-bold text-[#E3E3E3] mb-4">Account Status</h3>
                                <div className="flex gap-3">
                                    <Button variant={selectedUser.status === 'active' ? 'danger' : 'primary'} className="flex-1" onClick={() => handleUpdateUser({...selectedUser, status: selectedUser.status === 'active' ? 'suspended' : 'active'})}>{selectedUser.status === 'active' ? 'Suspend' : 'Activate'}</Button>
                                    <button onClick={() => handleDeleteUser(selectedUser.id)} className="text-[#CF6679] text-xs hover:underline">Delete Perm</button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-[#131314] p-6 rounded-2xl border border-[#444746]">
                                <h3 className="font-bold text-[#E3E3E3] mb-4">Wallet</h3>
                                <div className="text-3xl font-bold text-[#6DD58C] mb-4">₦{selectedUser.balance.toLocaleString()}</div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => { const a = prompt("Add amount:"); if(a) handleUpdateUser({...selectedUser, balance: selectedUser.balance + parseFloat(a)}); }}>+ Add</Button>
                                    <Button variant="outline" size="sm" onClick={() => { const a = prompt("Deduct amount:"); if(a) handleUpdateUser({...selectedUser, balance: selectedUser.balance - parseFloat(a)}); }}>- Deduct</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8">
              <h2 className="text-xl font-bold text-[#E3E3E3] mb-6">{isEditingProduct ? 'Edit Product' : 'New Product'}</h2>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <Input label="Title" value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} required />
                <Textarea label="Description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} required />
                <Input label="Price (₦)" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                <select className="w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3]" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}>
                    {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="cursor-pointer block border border-dashed border-[#444746] p-4 text-center rounded-xl text-xs text-[#8E918F]">
                    {newProduct.imageUrl ? 'Image Selected' : 'Upload Image'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">Save</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Course Modal */}
        {showCourseModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                <Card className="max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden p-0">
                    <div className="p-6 border-b border-[#444746] flex justify-between bg-[#131314]">
                        <h2 className="text-xl font-bold text-[#E3E3E3]">{isEditingCourse ? 'Edit Course' : 'New Course'}</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setCourseModalTab('basics')} className={`px-4 py-1 rounded-full text-xs font-bold ${courseModalTab === 'basics' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Basics</button>
                            <button onClick={() => setCourseModalTab('curriculum')} className={`px-4 py-1 rounded-full text-xs font-bold ${courseModalTab === 'curriculum' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F]'}`}>Content</button>
                            <button onClick={() => setShowCourseModal(false)} className="ml-4 text-[#5E5E5E]"><X /></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8">
                        {courseModalTab === 'basics' ? (
                            <div className="space-y-6 max-w-2xl mx-auto">
                                <Input label="Title" value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} />
                                <Textarea label="Description" value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} />
                                <div className="grid grid-cols-2 gap-6">
                                    <Input label="Price (₦)" value={currentCourse.price} onChange={e => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})} />
                                    <Input label="Instructor" value={currentCourse.instructor} onChange={e => setCurrentCourse({...currentCourse, instructor: e.target.value})} />
                                </div>
                                <label className="cursor-pointer block border border-dashed border-[#444746] p-8 text-center rounded-2xl text-[#8E918F]">
                                    {currentCourse.thumbnail ? 'Image Selected' : 'Upload Thumbnail'}
                                    <input type="file" className="hidden" onChange={handleCourseImageUpload} />
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <Button size="sm" onClick={handleAddModule} icon={Plus}>Add Module</Button>
                                {currentCourse.modules?.map((m, mIdx) => (
                                    <div key={m.id} className="bg-[#131314] p-6 rounded-2xl border border-[#444746] space-y-4">
                                        <div className="flex gap-4">
                                            <Input className="font-bold" value={m.title} onChange={e => { const mods = [...currentCourse.modules!]; mods[mIdx].title = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} />
                                            <button onClick={() => { const mods = [...currentCourse.modules!]; mods.splice(mIdx, 1); setCurrentCourse({...currentCourse, modules: mods}); }} className="text-[#CF6679]"><Trash2 /></button>
                                        </div>
                                        <div className="pl-8 space-y-3">
                                            {m.lessons.map((l, lIdx) => (
                                                <div key={l.id} className="bg-[#1E1F20] p-3 rounded-xl flex gap-4 items-center">
                                                    <Input className="text-xs" value={l.title} onChange={e => { const mods = [...currentCourse.modules!]; mods[mIdx].lessons[lIdx].title = e.target.value; setCurrentCourse({...currentCourse, modules: mods}); }} />
                                                    <select className="bg-[#131314] text-[10px] text-[#A8C7FA] rounded border border-[#444746] px-1" value={l.type} onChange={e => { const mods = [...currentCourse.modules!]; mods[mIdx].lessons[lIdx].type = e.target.value as any; setCurrentCourse({...currentCourse, modules: mods}); }}>
                                                        <option value="text">Text</option>
                                                        <option value="video">Video</option>
                                                    </select>
                                                </div>
                                            ))}
                                            <button className="text-xs text-[#A8C7FA] hover:underline" onClick={() => handleAddLesson(mIdx)}>+ Add Lesson</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-[#444746] bg-[#131314] flex justify-end">
                        <Button onClick={handleSaveCourse}>Save Complete Course</Button>
                    </div>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
};