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
  Sparkles, Image as ImageIcon, DollarSign, Tag, Info, MessageSquare, Mail, Calendar, ExternalLink
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
  const [courseModalTab, setCourseModalTab] = useState<'basics' | 'curriculum'>('basics');
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({ title: '', modules: [] });
  const [expandedModuleIdx, setExpandedModuleIdx] = useState<number | null>(0);
  const [editingLesson, setEditingLesson] = useState<{ mIdx: number, lIdx: number } | null>(null);

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

  const handleSaveCourse = async () => {
      setLoading(true);
      if (isEditingCourse) await updateCourse(currentCourse as Course);
      else await addCourse({ ...currentCourse as Course, id: `c-${Date.now()}` } as Course);
      setShowCourseModal(false);
      showToast("Academy curriculum saved.", 'success');
      await loadData();
  };

  const handleSaveSeo = async () => {
      const updatedSettings = { ...appSettings, seoDefinitions: { ...(appSettings.seoDefinitions || {}), [seoPage]: seoForm } };
      await updateAppSettings(updatedSettings);
      setAppSettings(updatedSettings);
      showToast("SEO Metadata Updated", 'success');
  };

  const handleSendNotif = async (e: React.FormEvent) => {
      e.preventDefault();
      await sendNotification({ ...notifForm, isBroadcast: notifForm.userId === 'all' });
      showToast("Broadcast Dispatched", 'success');
      setNotifForm({ userId: 'all', title: '', message: '', type: 'info' });
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
                        <img src={p.imageUrl} className="w-full h-40 object-cover rounded-xl mb-4 bg-[#131314]" />
                        <div className="flex justify-between items-start mb-2">
                           <Badge color="blue" className="text-[10px] uppercase font-bold">{p.category}</Badge>
                           <p className="text-sm font-bold text-[#6DD58C]">₦{p.price.toLocaleString()}</p>
                        </div>
                        <h4 className="font-bold text-[#E3E3E3] truncate mb-2">{p.title}</h4>
                        <p className="text-[10px] text-[#8E918F] line-clamp-2 mb-4 flex-grow">{p.description}</p>
                        <div className="flex gap-2 pt-3 border-t border-[#444746]">
                            <Button size="sm" variant="outline" className="flex-1" icon={Edit} onClick={() => { setIsEditingProduct(true); setCurrentProduct(p); setShowProductModal(true); }}>Edit</Button>
                            <button onClick={() => {
                              showDialog({
                                title: 'Delete Product',
                                message: 'Are you sure? This action cannot be undone.',
                                type: 'confirm',
                                onConfirm: () => deleteProduct(p.id).then(loadData)
                              });
                            }} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
          <div className="space-y-6">
              <div className="bg-[#1E1F20] p-6 rounded-3xl border border-[#444746] flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-[#E3E3E3]">Hire Inquiries</h3>
                    <p className="text-sm text-[#8E918F]">New project requests from the hire page.</p>
                  </div>
                  <Badge color="blue">{inquiries.length} Total</Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                              <p className="text-sm text-[#C4C7C5] leading-relaxed italic">"{inq.message}"</p>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#5E5E5E] uppercase tracking-widest">
                              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(inq.createdAt).toLocaleDateString()}</div>
                              <a href={`mailto:${inq.email}?subject=Regarding your Nexlify Inquiry`} className="text-[#A8C7FA] hover:underline flex items-center gap-1">Reply via Email <ExternalLink className="w-3 h-3" /></a>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'users' && (
          <div className="space-y-6">
              <div className="flex gap-4">
                  <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E918F]" />
                      <input type="text" placeholder="Search by name or email..." className="w-full bg-[#1E1F20] border border-[#444746] rounded-2xl py-3.5 pl-12 pr-4 text-[#E3E3E3]" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                  <Button variant="outline" icon={DownloadCloud} onClick={() => {
                    const data = { users, timestamp: new Date().toISOString() };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `nexlify_backup.json`;
                    a.click();
                    showToast("Database backup downloaded.", 'success');
                  }}>Export Backup</Button>
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

      {/* Product Editor Modal */}
      {showProductModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 overflow-y-auto">
              <Card className="max-w-4xl w-full p-0 overflow-hidden bg-[#1E1F20] border-[#444746] shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center px-8 py-6 bg-[#131314] border-b border-[#444746]">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA]"><ImageIcon className="w-6 h-6" /></div>
                          <div>
                            <h2 className="text-xl font-bold text-[#E3E3E3]">{isEditingProduct ? 'Update Digital Asset' : 'New Digital Asset'}</h2>
                          </div>
                      </div>
                      <button onClick={() => setShowProductModal(false)} className="p-2.5 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5] transition-all">
                        <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSaveProduct} className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                          <div className="md:col-span-7 space-y-6">
                              <Input label="Asset Title" value={currentProduct.title} onChange={e => setCurrentProduct({...currentProduct, title: e.target.value})} required />
                              <Textarea label="Pitch Description" rows={4} value={currentProduct.description} onChange={e => setCurrentProduct({...currentProduct, description: e.target.value})} required />
                              <div className="grid grid-cols-2 gap-6">
                                  <Input label="Price (₦)" type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} required />
                                  <div>
                                      <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Category</label>
                                      <select className="w-full bg-[#131314] border border-[#444746] rounded-2xl p-3.5 text-sm text-[#E3E3E3] outline-none focus:border-[#A8C7FA]" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as ProductCategory})}>
                                          {Object.values(ProductCategory).map(v => <option key={v} value={v}>{v}</option>)}
                                      </select>
                                  </div>
                              </div>
                              <Input label="Live Preview URL" value={currentProduct.previewUrl} onChange={e => setCurrentProduct({...currentProduct, previewUrl: e.target.value})} />
                              <Input label="Download Source" value={currentProduct.downloadUrl} onChange={e => setCurrentProduct({...currentProduct, downloadUrl: e.target.value})} required />
                          </div>
                          <div className="md:col-span-5">
                              <label className="block text-sm font-medium text-[#C4C7C5] mb-2">Cover Media</label>
                              <div className="aspect-[4/3] bg-[#131314] border-2 border-dashed border-[#444746] rounded-3xl overflow-hidden relative mb-4">
                                  {currentProduct.imageUrl && <img src={currentProduct.imageUrl} className="w-full h-full object-cover" />}
                              </div>
                              <Input label="Image URL" value={currentProduct.imageUrl} onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} required />
                          </div>
                      </div>
                      <div className="flex gap-4 pt-10 border-t border-[#444746] mt-8">
                          <Button variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Discard</Button>
                          <Button type="submit" className="flex-1" icon={Save}>{isEditingProduct ? 'Update Asset' : 'Publish Asset'}</Button>
                      </div>
                  </form>
              </Card>
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
                              <button onClick={() => {
                                showDialog({
                                  title: 'Delete User',
                                  message: 'Warning: This will ban the user permanently.',
                                  type: 'confirm',
                                  onConfirm: () => deleteUser(selectedUser.id).then(loadData)
                                });
                              }} className="w-full py-3 text-xs text-[#CF6679] font-bold hover:underline">Delete Permanently</button>
                          </div>
                      </div>
                  </div>
              </Card>
          </div>
      )}

      {/* Course Curriculum Builder Modal (Simplified) */}
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
                          <Button icon={Save} className="w-full" onClick={handleSaveCourse}>Save Course</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
