import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUser, changePassword, getCourses, getProducts } from '../services/mockData';
import { User, Course, Product } from '../types';
import { Card, Button, Badge, Input } from '../components/UI';
import { useFeedback } from '../App';
import { User as UserIcon, LogOut, Wallet, BookOpen, Clock, Settings, X, Save, Lock, Camera, Upload, Download, ShoppingBag } from 'lucide-react';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const { showToast, showDialog } = useFeedback();
  const [enrolledCoursesData, setEnrolledCoursesData] = useState<Course[]>([]);
  const [purchasedProductsData, setPurchasedProductsData] = useState<Product[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
      setEditForm({ name: currentUser.name, email: currentUser.email });
      loadUserAssets(currentUser);
    }
  }, [navigate]);

  const loadUserAssets = async (currentUser: User) => {
      if (currentUser.enrolledCourses && currentUser.enrolledCourses.length > 0) {
          const allCourses = await getCourses();
          const userCourses = allCourses.filter(c => currentUser.enrolledCourses?.includes(c.id));
          setEnrolledCoursesData(userCourses);
      }
      if (currentUser.purchasedProducts && currentUser.purchasedProducts.length > 0) {
          const allProducts = await getProducts();
          const userProducts = allProducts.filter(p => currentUser.purchasedProducts?.includes(p.id));
          setPurchasedProductsData(userProducts);
      }
  };

  const handleLogout = () => {
    showDialog({
      title: 'Sign Out',
      message: 'Are you sure you want to log out of your Nexlify account?',
      type: 'confirm',
      onConfirm: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
        navigate('/login');
      }
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
        const updatedUser = { ...user, name: editForm.name, email: editForm.email };
        await updateUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        showToast("Profile updated successfully!", 'success');
        setShowSettings(false);
    } catch (error: any) {
        showToast("Failed to update profile", 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordForm.new !== passwordForm.confirm) {
        showToast("New passwords do not match", 'error');
        return;
    }
    setIsLoading(true);
    try {
        await changePassword(user.id, passwordForm.current, passwordForm.new);
        showToast("Password changed successfully!", 'success');
        setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error: any) {
        showToast(error.message || "Security update failed", 'error');
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadProduct = (product: Product) => {
    if (product.downloadUrl) {
      showToast(`Starting download: ${product.title}`, 'info');
      const link = document.createElement('a');
      link.href = product.downloadUrl;
      link.download = `${product.title.replace(/\s+/g, '_')}${product.category === 'Ebook' ? '.pdf' : '.zip'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-6">
            <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[#1E1F20] shadow-xl bg-[#4285F4] flex items-center justify-center text-4xl font-bold text-white relative">
                    {user.photoUrl ? <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#E3E3E3]">{user.name}</h1>
              <p className="text-[#8E918F]">{user.email}</p>
              <div className="mt-2 flex gap-2">
                 <Badge color="blue">{user.role.toUpperCase()}</Badge>
                 <Badge color={user.status === 'active' ? 'green' : 'red'}>{user.status?.toUpperCase() || 'ACTIVE'}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={Settings} onClick={() => setShowSettings(true)}>Settings</Button>
            <Button variant="secondary" icon={LogOut} onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="p-8 bg-gradient-to-br from-[#1E1F20] to-[#131314]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#C4C7C5] mb-1">Total Balance</p>
                  <h2 className="text-4xl font-bold text-[#6DD58C]">₦{user.balance.toLocaleString()}</h2>
                </div>
                <div className="p-3 bg-[#0F5223] rounded-xl border border-[#6DD58C]/30">
                  <Wallet className="w-6 h-6 text-[#6DD58C]" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button size="sm" className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]">Withdraw Funds</Button>
                <Button size="sm" variant="outline">Transaction History</Button>
              </div>
            </Card>

            <div>
              <h3 className="text-xl font-bold text-[#E3E3E3] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#A8C7FA]" /> My Learning
              </h3>
              {enrolledCoursesData.length > 0 ? (
                <div className="grid gap-4">
                  {enrolledCoursesData.map(course => (
                      <Card key={course.id} className="p-6 flex items-center justify-between group hover:bg-[#2D2E30] transition-colors cursor-pointer" onClick={() => navigate(`/classroom/${course.id}`)}>
                        <div className="flex items-center gap-4">
                          <img src={course.thumbnail} alt={course.title} className="w-12 h-12 rounded-lg object-cover bg-[#131314]" />
                          <div>
                            <h4 className="font-bold text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors">{course.title}</h4>
                            <p className="text-xs text-[#8E918F]">{course.modules.length} Modules • Lifetime Access</p>
                          </div>
                        </div>
                        <Badge color="blue">Continue</Badge>
                      </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-[#444746]">
                  <p className="text-[#8E918F] mb-4">You haven't enrolled in any courses yet.</p>
                  <Button variant="outline" onClick={() => navigate('/training')}>Browse Courses</Button>
                </Card>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-[#E3E3E3] mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#9B72CB]" /> My Downloads
              </h3>
              {purchasedProductsData.length > 0 ? (
                  <div className="grid gap-4">
                      {purchasedProductsData.map(product => (
                          <Card key={product.id} className="p-6 flex items-center justify-between hover:bg-[#2D2E30] transition-colors">
                            <div className="flex items-center gap-4">
                                <img src={product.imageUrl} alt={product.title} className="w-12 h-12 rounded-lg object-cover bg-[#131314]" />
                                <div>
                                    <h4 className="font-bold text-[#E3E3E3]">{product.title}</h4>
                                    <p className="text-xs text-[#8E918F]">{product.category}</p>
                                </div>
                            </div>
                            <Button size="sm" icon={Download} variant="outline" onClick={() => handleDownloadProduct(product)}>
                                Download
                            </Button>
                          </Card>
                      ))}
                  </div>
              ) : (
                  <Card className="p-8 text-center border-dashed border-[#444746]">
                      <p className="text-[#8E918F] mb-4">No purchased digital products.</p>
                      <Button variant="outline" onClick={() => navigate('/market')}>Go to Marketplace</Button>
                  </Card>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-[#E3E3E3] mb-4">Account Details</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-[#444746]">
                  <span className="text-[#8E918F]">Joined</span>
                  <span className="text-[#E3E3E3]">{new Date(user.joinedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#444746]">
                  <span className="text-[#8E918F]">Account Type</span>
                  <span className="text-[#E3E3E3] capitalize">{user.role}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#444746]">
                  <span className="text-[#8E918F]">Status</span>
                  <span className="text-[#6DD58C]">Active</span>
                </div>
              </div>
            </Card>

            <div className="bg-[#4285F4]/10 rounded-2xl p-6 border border-[#4285F4]/20">
              <h4 className="font-bold text-[#A8C7FA] mb-2">Refer & Earn</h4>
              <p className="text-xs text-[#C4C7C5] mb-4">
                Share your unique link and earn ₦1,000 for every active user you refer.
              </p>
              <div className="bg-[#131314] p-2 rounded-lg flex justify-between items-center text-xs text-[#8E918F] mb-3">
                <span className="truncate">nexlify.com.ng/ref/{user.id}</span>
              </div>
              <Button size="sm" className="w-full" onClick={() => {
                navigator.clipboard.writeText(`https://nexlify.com.ng/#/register?ref=${user.id}`);
                showToast("Referral link copied!", 'success');
              }}>Copy Link</Button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <Card className="max-w-2xl w-full bg-[#1E1F20] max-h-[90vh] flex flex-col overflow-hidden p-0 border border-[#444746]">
                <div className="p-6 border-b border-[#444746] bg-[#131314] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#E3E3E3]">Account Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-8">
                    <section>
                        <h3 className="text-[#A8C7FA] font-medium mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5" /> Personal Information</h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <Input label="Full Name" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} />
                            <Input label="Email Address" type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                            <Button type="submit" isLoading={isLoading} icon={Save}>Update Profile</Button>
                        </form>
                    </section>
                    <div className="border-t border-[#444746]" />
                    <section>
                        <h3 className="text-[#CF6679] font-medium mb-4 flex items-center gap-2"><Lock className="w-5 h-5" /> Security</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input label="Current Password" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} required />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="New Password" type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} required />
                                <Input label="Confirm New Password" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} required />
                            </div>
                            <Button type="submit" variant="secondary" isLoading={isLoading} icon={Save}>Change Password</Button>
                        </form>
                    </section>
                </div>
            </Card>
        </div>
      )}
    </div>
  );
};
