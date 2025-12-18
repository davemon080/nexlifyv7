
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../App';
import { api } from '../services/api';
import { Product, Inquiry, Course, User, AppSettings } from '../types';
// Fixed import: Loader2 is from lucide-react, not UI
import { Button, Card, Badge, Input } from '../components/UI';
import { LayoutDashboard, ShoppingBag, Users, GraduationCap, Mail, Bell, Settings, Plus, Wallet, Search, MoreVertical, Loader2 } from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const [activeTab, setActiveTab] = useState('products');
  const [stats, setStats] = useState({ totalRevenue: 0, userCount: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [p, u, i, s] = await Promise.all([
            api.getProducts(),
            api.getAllUsers(),
            api.getInquiries(),
            api.getAdminStats()
        ]);
        setProducts(p);
        setUsers(u);
        setInquiries(i);
        setStats(s);
    } catch (err) {
        showToast("Error loading admin data", "error");
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-12 h-12 text-[#A8C7FA]" /></div>;

  return (
    <div className="min-h-screen p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-[#8E918F]">Manage Nexlify ecosystem entities.</p>
            </div>
            <div className="flex gap-4">
                <Card className="px-6 py-3 flex items-center gap-4">
                    <div className="p-2 bg-[#0F5223] rounded-lg text-[#6DD58C]"><Wallet className="w-5 h-5" /></div>
                    <div><p className="text-[10px] text-[#8E918F] uppercase font-bold">Revenue</p><p className="font-bold">₦{stats.totalRevenue.toLocaleString()}</p></div>
                </Card>
                <Card className="px-6 py-3 flex items-center gap-4">
                    <div className="p-2 bg-[#0842A0] rounded-lg text-[#A8C7FA]"><Users className="w-5 h-5" /></div>
                    <div><p className="text-[10px] text-[#8E918F] uppercase font-bold">Users</p><p className="font-bold">{stats.userCount}</p></div>
                </Card>
            </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 p-1.5 bg-[#1E1F20] rounded-2xl border border-[#444746] max-w-3xl">
            {[
                {id: 'products', icon: ShoppingBag, label: 'Market'},
                {id: 'users', icon: Users, label: 'Community'},
                {id: 'training', icon: GraduationCap, label: 'Academy'},
                {id: 'inquiries', icon: Mail, label: 'Requests'},
                {id: 'settings', icon: Settings, label: 'System'}
            ].map(tab => (
                <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#8E918F] hover:bg-[#131314]'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>

        {activeTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button className="h-full min-h-[250px] border-2 border-dashed border-[#444746] rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-[#A8C7FA] hover:bg-[#A8C7FA]/5 transition-all text-[#8E918F] hover:text-[#A8C7FA]">
                    <div className="w-12 h-12 rounded-full bg-[#1E1F20] flex items-center justify-center"><Plus /></div>
                    <span className="font-bold">List New Product</span>
                </button>
                {products.map(p => (
                    <Card key={p.id} className="p-4 group">
                        <img src={p.imageUrl} className="w-full h-32 object-cover rounded-xl mb-4" />
                        <h4 className="font-bold text-sm truncate">{p.title}</h4>
                        <p className="text-[10px] text-[#8E918F] mb-4 uppercase">{p.category}</p>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-[#6DD58C]">₦{p.price.toLocaleString()}</span>
                            <button className="p-2 hover:bg-[#131314] rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                        </div>
                    </Card>
                ))}
            </div>
        )}

        {activeTab === 'users' && (
            <Card className="overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#131314] text-[10px] uppercase text-[#8E918F]">
                        <tr>
                            <th className="px-6 py-4">Identity</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Wallet</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#444746]">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-[#131314] transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-sm">{u.name}</div>
                                    <div className="text-[10px] text-[#8E918F]">{u.email}</div>
                                </td>
                                <td className="px-6 py-4"><Badge color={u.role === 'admin' ? 'purple' : 'blue'}>{u.role}</Badge></td>
                                <td className="px-6 py-4 font-bold text-[#6DD58C]">₦{u.balance.toLocaleString()}</td>
                                <td className="px-6 py-4 text-xs text-[#8E918F]">{new Date(u.joinedAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right"><button className="p-2 hover:bg-[#1E1F20] rounded-lg"><MoreVertical className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        )}

        {activeTab === 'inquiries' && (
            <div className="grid md:grid-cols-2 gap-6">
                {inquiries.map(i => (
                    <Card key={i.id} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <Badge color="purple">{i.serviceType}</Badge>
                            <span className="text-[10px] text-[#8E918F]">{new Date(i.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold mb-1">{i.name}</h4>
                        <p className="text-xs text-[#8E918F] mb-4">{i.email}</p>
                        <p className="text-sm text-[#C4C7C5] italic">"{i.message}"</p>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
