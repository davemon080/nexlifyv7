
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
import { 
  getProducts, getInquiries, addProduct, deleteProduct, updateProduct, 
  getCourses, getAllUsers, updateUser, deleteUser, getUserActivity, 
  addCourse, updateCourse, deleteCourse, adminEnrollUser, getAppSettings, 
  updateAppSettings, getAdminStats, deleteInquiry, adminRevokeAccess, 
  sendNotification
} from '../services/mockData';
import { 
  Product, Inquiry, ProductCategory, Course, User, AppSettings, PageSeoConfig 
} from '../types';
import { Button, Input, Card, Badge, Textarea } from '../components/UI';
import { 
  Plus, Trash2, GraduationCap, Loader2, Users, 
  Wallet, Search, MoreVertical, X, Settings, Save, Globe, Eye, BookOpen, Bell, Send, ChevronRight, UserCheck, Settings2, Mail, Calendar, MessageSquare, ExternalLink
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
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({ title: '', description: '', price: 0, category: ProductCategory.TEMPLATE, imageUrl: '', downloadUrl: '' });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({ title: '', modules: [] });

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
      if (s.seoDefinitions?.[seoPage]) setSeoForm(s.seoDefinitions[seoPage]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAssignTutor = async (courseId: string, tutorId: string) => {
    const course = courses.find(c => c.id === courseId);
    const tutor = users.find(u => u.id === tutorId);
    if (!course || !tutor) return;
    try {
      await updateCourse({ ...course, tutorId: tutor.id, instructor: tutor.name });
      await updateUser({ ...tutor, role: 'tutor' as any });
      showToast(`${tutor.name} assigned.`, 'success');
      loadData();
    } catch (e) { showToast("Assignment failed", 'error'); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      if (currentProduct.id) await updateProduct(currentProduct as Product);
      else await addProduct({ ...currentProduct as Product, id: `p-${Date.now()}`, createdAt: new Date().toISOString() } as Product);
      setShowProductModal(false);
      showToast("Catalog updated.", 'success');
      loadData();
  };

  const handleSaveSeo = async () => {
      const updated = { ...appSettings, seoDefinitions: { ...(appSettings.seoDefinitions || {}), [seoPage]: seoForm } };
      await updateAppSettings(updated);
      setAppSettings(updated);
      showToast("SEO Saved.", 'success');
  };

  // Added handleSendNotif to resolve the error on line 215
  const handleSendNotif = async () => {
    if (!notifForm.title || !notifForm.message) {
      showToast("Please fill in title and message", 'info');
      return;
    }
    try {
      await sendNotification({
        userId: notifForm.userId,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        isBroadcast: notifForm.userId === 'all'
      });
      showToast("Broadcast sent successfully!", 'success');
      setNotifForm({ userId: 'all', title: '', message: '', type: 'info' });
    } catch (error) {
      showToast("Failed to broadcast notification", 'error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <Badge color="blue" className="mb-2">Admin Dashboard</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#E3E3E3]">Control Center</h1>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <Card className="px-5 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1 md:flex-none">
                <div className="p-2 bg-[#0F5223] rounded-lg text-[#6DD58C]"><Wallet className="w-5 h-5" /></div>
                <div><p className="text-[10px] text-[#8E918F] font-black uppercase">Revenue</p><p className="font-bold text-[#E3E3E3]">₦{totalRevenue.toLocaleString()}</p></div>
            </Card>
            <Card className="px-5 py-3 flex items-center gap-4 bg-[#1E1F20]/50 border-[#444746] flex-1 md:flex-none">
                <div className="p-2 bg-[#0842A0] rounded-lg text-[#A8C7FA]"><Users className="w-5 h-5" /></div>
                <div><p className="text-[10px] text-[#8E918F] font-black uppercase">Users</p><p className="font-bold text-[#E3E3E3]">{users.length}</p></div>
            </Card>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] mb-8 sticky top-24 z-30 backdrop-blur-xl">
        {['products', 'users', 'training', 'inquiries', 'notifications', 'seo', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                {tab === 'training' ? 'Academy' : tab}
            </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1E1F20] p-6 rounded-3xl border border-[#444746]">
                <h3 className="font-bold text-[#E3E3E3]">Marketplace Items</h3>
                <Button size="sm" icon={Plus} onClick={() => { setCurrentProduct({ title: '', price: 0, category: ProductCategory.TEMPLATE }); setShowProductModal(true); }}>Add New</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                    <Card key={p.id} className="p-4 flex flex-col hover:border-[#A8C7FA]/50 transition-all">
                        <img src={p.imageUrl} className="w-full h-32 object-cover rounded-xl mb-4 bg-[#131314]" />
                        <h4 className="font-bold text-[#E3E3E3] truncate">{p.title}</h4>
                        <p className="text-xs text-[#8E918F] mb-4">₦{p.price.toLocaleString()}</p>
                        <div className="mt-auto flex gap-2">
                           <Button size="sm" variant="outline" className="flex-1" onClick={() => { setCurrentProduct(p); setShowProductModal(true); }}>Edit</Button>
                           <button onClick={() => deleteProduct(p.id).then(loadData)} className="p-2 text-[#CF6679] bg-[#CF6679]/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'users' && (
          <div className="space-y-6">
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E918F] w-5 h-5" />
                  <input type="text" placeholder="Search name or email..." className="w-full bg-[#1E1F20] border border-[#444746] rounded-2xl py-4 pl-12 pr-4 text-[#E3E3E3] outline-none" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              <div className="hidden md:block bg-[#1E1F20] rounded-3xl border border-[#444746] overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-[#131314] text-[10px] font-black uppercase text-[#8E918F]">
                          <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Wallet</th><th className="px-6 py-4 text-right">Action</th></tr>
                      </thead>
                      <tbody className="divide-y divide-[#444746]">
                          {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                              <tr key={u.id} className="hover:bg-[#2D2E30] transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                                  <td className="px-6 py-4"><div className="text-sm font-bold text-[#E3E3E3]">{u.name}</div><div className="text-[10px] text-[#8E918F]">{u.email}</div></td>
                                  <td className="px-6 py-4"><Badge color={u.role === 'admin' ? 'purple' : u.role === 'tutor' ? 'blue' : 'green'}>{u.role}</Badge></td>
                                  <td className="px-6 py-4 text-[#6DD58C] font-bold">₦{u.balance.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right"><MoreVertical className="w-5 h-5 ml-auto text-[#5E5E5E]" /></td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {/* Mobile Card List */}
              <div className="md:hidden space-y-4">
                  {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <Card key={u.id} className="p-4 flex justify-between items-center" onClick={() => setSelectedUser(u)}>
                          <div>
                              <p className="font-bold text-[#E3E3E3] text-sm">{u.name}</p>
                              <p className="text-[10px] text-[#8E918F]">{u.email}</p>
                              <Badge color={u.role === 'tutor' ? 'blue' : 'green'} className="mt-2 text-[8px]">{u.role}</Badge>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#444746]" />
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'inquiries' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inquiries.map(inq => (
                  <Card key={inq.id} className="p-6 border-[#444746]">
                      <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#A8C7FA]/10 flex items-center justify-center text-[#A8C7FA]"><MessageSquare className="w-5 h-5" /></div>
                              <div><h4 className="font-bold text-[#E3E3E3] text-sm">{inq.name}</h4><p className="text-[10px] text-[#8E918F]">{inq.email}</p></div>
                          </div>
                          <button onClick={() => deleteInquiry(inq.id).then(loadData)} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="bg-[#131314] p-4 rounded-xl mb-4"><Badge color="purple" className="mb-2 text-[8px]">{inq.serviceType}</Badge><p className="text-xs text-[#C4C7C5] leading-relaxed italic">"{inq.message}"</p></div>
                      <div className="flex items-center justify-between text-[8px] font-black uppercase text-[#5E5E5E] tracking-widest">
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(inq.createdAt).toLocaleDateString()}</div>
                          <a href={`mailto:${inq.email}`} className="text-[#A8C7FA] hover:underline">Reply via Email</a>
                      </div>
                  </Card>
              ))}
              {inquiries.length === 0 && <div className="md:col-span-2 py-20 text-center text-[#8E918F]">Inbox empty.</div>}
          </div>
      )}

      {activeTab === 'notifications' && (
          <Card className="max-w-xl mx-auto p-8 border-[#444746]">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[#A8C7FA]/10 rounded-2xl text-[#A8C7FA]"><Bell className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-[#E3E3E3]">Broadcast Activity</h3>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendNotif(); }} className="space-y-6">
                  <Input label="Title" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} required />
                  <Textarea label="Message" rows={3} value={notifForm.message} onChange={(e: any) => setNotifForm({...notifForm, message: e.target.value})} required />
                  <div className="flex gap-2">
                      {['info', 'success', 'warning', 'danger'].map(t => (
                          <button key={t} type="button" onClick={() => setNotifForm({...notifForm, type: t})} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${notifForm.type === t ? 'bg-[#A8C7FA] text-[#062E6F]' : 'bg-[#131314] text-[#C4C7C5] border border-[#444746]'}`}>{t}</button>
                      ))}
                  </div>
                  <Button type="submit" className="w-full py-4 text-xs font-black uppercase tracking-widest" icon={Send}>Broadcast Now</Button>
              </form>
          </Card>
      )}

      {activeTab === 'seo' && (
          <Card className="max-w-3xl mx-auto p-8 border-[#444746]">
              <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[#9B72CB]/10 rounded-2xl text-[#9B72CB]"><Globe className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-[#E3E3E3]">Meta & SEO</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                      {['/', '/training', '/market', '/ai-tools', '/hire', '/earn'].map(p => (
                          <button key={p} onClick={() => setSeoPage(p)} className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all ${seoPage === p ? 'bg-[#A8C7FA]/10 text-[#A8C7FA] border border-[#A8C7FA]/20' : 'text-[#C4C7C5] hover:bg-[#131314]'}`}>{p === '/' ? 'Home' : p.slice(1)}</button>
                      ))}
                  </div>
                  <div className="md:col-span-2 space-y-4">
                      <Input label="Page Title" value={seoForm.title} onChange={e => setSeoForm({...seoForm, title: e.target.value})} />
                      <Textarea label="Description" rows={3} value={seoForm.description} onChange={(e:any) => setSeoForm({...seoForm, description: e.target.value})} />
                      <Input label="Keywords" value={seoForm.keywords} onChange={e => setSeoForm({...seoForm, keywords: e.target.value})} />
                      <Button className="w-full" icon={Save} onClick={handleSaveSeo}>Save SEO</Button>
                  </div>
              </div>
          </Card>
      )}

      {activeTab === 'settings' && (
          <Card className="max-w-xl mx-auto p-10 border-[#444746]">
              <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-[#D96570]/10 rounded-2xl text-[#D96570]"><Settings2 className="w-6 h-6" /></div>
                  <h3 className="text-xl font-bold text-[#E3E3E3]">System Branding</h3>
              </div>
              <div className="space-y-8">
                  <Input label="Brand Name" value={appSettings.platformName} onChange={e => setAppSettings({...appSettings, platformName: e.target.value})} />
                  <Input label="Logo URL" value={appSettings.logoUrl} onChange={e => setAppSettings({...appSettings, logoUrl: e.target.value})} />
                  <Button className="w-full py-4" icon={Save} onClick={() => updateAppSettings(appSettings).then(() => showToast("Branding saved.", 'success'))}>Update Identity</Button>
              </div>
          </Card>
      )}

      {activeTab === 'training' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map(c => (
                  <Card key={c.id} className="p-6 border-[#444746] flex flex-col">
                      <div className="flex gap-4 mb-6">
                          <img src={c.thumbnail} className="w-20 h-20 rounded-2xl object-cover bg-[#131314]" alt={c.title} />
                          <div className="flex-1">
                              <h4 className="font-bold text-[#E3E3E3] text-base leading-tight mb-1">{c.title}</h4>
                              <p className="text-[#6DD58C] font-bold text-xs">₦{c.price.toLocaleString()}</p>
                          </div>
                      </div>
                      <div className="bg-[#131314] p-4 rounded-2xl border border-[#444746] mb-6">
                          <label className="block text-[8px] font-black uppercase text-[#8E918F] mb-2 tracking-widest">Assign Instructor</label>
                          <select className="w-full bg-[#1E1F20] border border-[#444746] rounded-xl px-4 py-2 text-xs text-[#E3E3E3] outline-none" value={c.tutorId || ''} onChange={(e) => handleAssignTutor(c.id, e.target.value)}>
                              <option value="">Choose Tutor...</option>
                              {users.filter(u => u.role !== 'admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                      </div>
                      <div className="mt-auto flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => { setCurrentCourse(c); setShowCourseModal(true); }}>Curriculum</Button>
                          <button onClick={() => deleteCourse(c.id).then(loadData)} className="p-2 text-[#CF6679] bg-[#CF6679]/10 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  </Card>
              ))}
          </div>
      )}

      {/* Modal Placeholders (Functionality remains same as previous but UI refined) */}
      {showProductModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
              <Card className="max-w-md w-full p-8 border-[#444746] bg-[#1E1F20]">
                  <h3 className="text-xl font-bold mb-6 text-[#E3E3E3]">Market Item Details</h3>
                  <form onSubmit={handleSaveProduct} className="space-y-4">
                      <Input label="Title" value={currentProduct.title} onChange={e => setCurrentProduct({...currentProduct, title: e.target.value})} required />
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="Price (₦)" type="number" value={currentProduct.price} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} required />
                          <Input label="Category" value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value as any})} />
                      </div>
                      <Input label="Image URL" value={currentProduct.imageUrl} onChange={e => setCurrentProduct({...currentProduct, imageUrl: e.target.value})} />
                      <Input label="Download Link" value={currentProduct.downloadUrl} onChange={e => setCurrentProduct({...currentProduct, downloadUrl: e.target.value})} />
                      <div className="flex gap-3 pt-4">
                          <Button variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancel</Button>
                          <Button type="submit" className="flex-1">Save Item</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}
    </div>
  );
};
