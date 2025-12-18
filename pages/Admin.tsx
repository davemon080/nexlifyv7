import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getInquiries, addProduct, deleteProduct, updateProduct, getCourses, getAllUsers, updateUser, deleteUser, getUserActivity, addCourse, updateCourse, deleteCourse, adminEnrollUser, getAppSettings, updateAppSettings, getAdminStats, deleteInquiry, adminRevokeAccess, sendNotification } from '../services/mockData';
import { Product, Inquiry, ProductCategory, Course, User, ActivityLog, Module, Lesson, QuizQuestion, AppSettings, PageSeoConfig } from '../types';
import { Button, Input, Card, Badge, Textarea } from '../components/UI';
import { Plus, Trash2, Mail, LayoutGrid, GraduationCap, Loader2, Users, Wallet, Search, MoreVertical, Shield, Clock, X, Check, AlertTriangle, Upload, FileText, Download, Edit, Video, GripVertical, Gift, Settings, Save, BarChart3, TrendingUp, Globe, Eye, BookOpen, Cloud, Bell, Send } from 'lucide-react';

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

  // Notification State
  const [notifForm, setNotifForm] = useState({
      userId: 'all',
      title: '',
      message: '',
      type: 'info' as any
  });
  const [isSendingNotif, setIsSendingNotif] = useState(false);

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

  // --- USER HANDLERS ---
  const handleUserClick = async (user: User) => {
      const freshUser = users.find(u => u.id === user.id) || user;
      setSelectedUser(freshUser);
      const logs = await getUserActivity(user.id);
      setUserActivity(logs);
  };

  const handleUpdateUser = async (updatedUser: User) => {
      setIsUpdatingUser(true);
      await updateUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser); 
      setIsUpdatingUser(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0F5223] rounded-xl border border-[#6DD58C]/30 text-[#6DD58C]"><Wallet className="w-6 h-6" /></div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Total Revenue</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">₦{totalRevenue.toLocaleString()}</h2>
                </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0842A0] rounded-xl border border-[#A8C7FA]/30 text-[#A8C7FA]"><Users className="w-6 h-6" /></div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Total Users</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">{users.length}</h2>
                </div>
            </Card>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <Badge color="blue">Administrator</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-[#E3E3E3] mt-2">Dashboard</h1>
          </div>
          <div className="w-full lg:w-auto overflow-x-auto">
            <div className="flex gap-2 bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] min-w-max">
                <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === 'products' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Products</button>
                <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === 'users' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Users</button>
                <button onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === 'notifications' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}><Bell className="w-4 h-4" /> Broadcast</button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeTab === 'settings' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>Settings</button>
                <button onClick={() => navigate('/admin/hosting')} className="px-6 py-2 rounded-full text-sm font-medium text-[#C4C7C5] hover:bg-[#444746]">Hosting</button>
            </div>
          </div>
        </div>

        {/* --- BROADCAST TAB --- */}
        {activeTab === 'notifications' && (
            <div className="max-w-2xl mx-auto">
                <Card className="p-8">
                    <h2 className="text-xl font-bold text-[#E3E3E3] mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-[#A8C7FA]" /> Send System Notification</h2>
                    <form onSubmit={handleSendNotification} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Target Recipient</label>
                            <select 
                                className="w-full rounded-2xl bg-[#131314] border border-[#444746] px-5 py-3 text-[#E3E3E3] outline-none focus:border-[#A8C7FA]"
                                value={notifForm.userId}
                                onChange={(e) => setNotifForm({...notifForm, userId: e.target.value})}
                            >
                                <option value="all">Broadcast to All Users</option>
                                <optgroup label="Specific User">
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        <Input label="Notification Title" placeholder="e.g., Update Available" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} required />
                        
                        <Textarea label="Message" placeholder="Detailed message for the user..." rows={4} value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} required />

                        <div>
                            <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Alert Style</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['info', 'success', 'warning', 'danger'].map(style => (
                                    <button
                                        key={style}
                                        type="button"
                                        onClick={() => setNotifForm({...notifForm, type: style})}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${notifForm.type === style ? 'bg-[#A8C7FA]/10 border-[#A8C7FA] text-[#A8C7FA]' : 'bg-transparent border-[#444746] text-[#8E918F] hover:border-[#5E5E5E]'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg" icon={Send} isLoading={isSendingNotif}>Dispatch Notification</Button>
                    </form>
                </Card>
            </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8E918F]" />
                    <input type="text" placeholder="Search users..." className="w-full pl-12 pr-4 py-3 bg-[#1E1F20] border border-[#444746] rounded-2xl text-[#E3E3E3] focus:ring-2 focus:ring-[#A8C7FA] outline-none" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                 </div>
                 <Button onClick={handleExportDatabase} variant="outline" icon={Download}>Export Data</Button>
             </div>
             <div className="bg-[#1E1F20] rounded-[24px] shadow-sm border border-[#444746] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#444746]">
                    <thead className="bg-[#131314]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#1E1F20] divide-y divide-[#444746]">
                        {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map((user) => (
                        <tr key={user.id} className="hover:bg-[#2D2E30] cursor-pointer" onClick={() => handleUserClick(user)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-[#A8C7FA]/20 flex items-center justify-center text-[#A8C7FA] font-bold">{user.name.charAt(0).toUpperCase()}</div>
                                    <div className="ml-4">
                                        <div className="text-sm font-bold text-[#E3E3E3]">{user.name}</div>
                                        <div className="text-sm text-[#8E918F]">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge color={user.status === 'active' ? 'green' : 'red'}>{user.status || 'active'}</Badge>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button size="sm" variant="ghost" icon={MoreVertical} />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
             </div>
          </div>
        )}

        {/* MODALS (Simplified forbrevity as previously provided) */}
        {selectedUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                <Card className="max-w-4xl w-full bg-[#1E1F20] max-h-[90vh] flex flex-col overflow-hidden p-0 border border-[#444746]">
                    <div className="p-6 border-b border-[#444746] bg-[#131314] flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-[#E3E3E3]">{selectedUser.name}</h2>
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="space-y-6">
                                <h3 className="text-[#A8C7FA] font-bold flex items-center gap-2"><Bell className="w-5 h-5" /> Quick Notification</h3>
                                <div className="p-4 bg-[#131314] rounded-xl border border-[#444746] space-y-4">
                                    <Input placeholder="Direct Alert Title" id="quick-title" />
                                    <Textarea placeholder="Message for this user..." id="quick-msg" rows={3} />
                                    <Button className="w-full" size="sm" onClick={async () => {
                                        const t = (document.getElementById('quick-title') as HTMLInputElement).value;
                                        const m = (document.getElementById('quick-msg') as HTMLTextAreaElement).value;
                                        if(!t || !m) return;
                                        await sendNotification({ userId: selectedUser.id, title: t, message: m, type: 'info' });
                                        alert("Sent!");
                                    }}>Send Direct Alert</Button>
                                </div>
                             </div>
                             <div>
                                <h3 className="text-[#E3E3E3] font-bold mb-4">Account</h3>
                                <div className="space-y-4">
                                    <Button className="w-full" variant={selectedUser.status === 'active' ? 'danger' : 'primary'} onClick={() => handleUpdateUser({...selectedUser, status: selectedUser.status === 'active' ? 'suspended' : 'active'})}>
                                        {selectedUser.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                                    </Button>
                                </div>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
};