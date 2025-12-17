import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getInquiries, addProduct, deleteProduct, updateProduct, getCourses, getAllUsers, updateUser, deleteUser, getUserActivity, addCourse, updateCourse, deleteCourse, adminEnrollUser, getAppSettings, updateAppSettings } from '../services/mockData';
import { Product, Inquiry, ProductCategory, Course, User, ActivityLog, Module, Lesson, QuizQuestion, AppSettings } from '../types';
import { Button, Input, Card, Badge, Textarea } from '../components/UI';
import { Plus, Trash2, Mail, LayoutGrid, GraduationCap, Loader2, Users, Wallet, Calendar, Search, MoreVertical, Shield, Clock, X, Check, AlertTriangle, Upload, FileText, Download, Edit, Video, ChevronDown, ChevronUp, GripVertical, Gift, HelpCircle, Settings, Save, BarChart3, TrendingUp } from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'inquiries' | 'training' | 'users' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({ platformName: 'Nexlify' });
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // User Management State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<ActivityLog[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [selectedCourseToGrant, setSelectedCourseToGrant] = useState('');

  // Product Management State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    category: ProductCategory.EBOOK,
    imageUrl: '',
    previewUrl: '',
    downloadUrl: ''
  });

  // Course Management State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState<'basics' | 'curriculum'>('basics');
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({
      title: '', description: '', thumbnail: '', level: 'Beginner', duration: '', price: 0, instructor: '', modules: []
  });

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
      const [pData, iData, cData, uData, settings] = await Promise.all([
        getProducts(),
        getInquiries(),
        getCourses(),
        getAllUsers(),
        getAppSettings()
      ]);
      setProducts(pData);
      setInquiries(iData);
      setCourses(cData);
      setUsers(uData);
      setAppSettings(settings);
    } catch (error) {
      console.error("Failed to load admin data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- STATISTICS CALCULATION ---
  const totalRevenue = users.reduce((acc, user) => {
    if(!user.enrolledCourses) return acc;
    // Calculate value of courses user is enrolled in
    const userValue = user.enrolledCourses.reduce((sum, cId) => {
        const course = courses.find(c => c.id === cId);
        return sum + (course?.price || 0);
    }, 0);
    return acc + userValue;
  }, 0);

  // --- DATABASE EXPORT LOGIC ---
  const handleExportDatabase = () => {
      const dbData = {
          timestamp: new Date().toISOString(),
          users,
          products,
          inquiries,
          courses
      };

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
          reader.onloadend = () => {
              setAppSettings({ ...appSettings, logoUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveSettings = () => {
      updateAppSettings(appSettings);
      alert("Settings saved successfully!");
  };

  // --- USER HANDLERS ---
  const handleUserClick = async (user: User) => {
      setSelectedUser(user);
      const logs = await getUserActivity(user.id);
      setUserActivity(logs);
      setSelectedCourseToGrant(''); // Reset dropdown
  };

  const handleUpdateUser = async (updatedUser: User) => {
      setIsUpdatingUser(true);
      await updateUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser); 
      setIsUpdatingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
      if(window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          setIsUpdatingUser(true);
          await deleteUser(userId);
          setUsers(users.filter(u => u.id !== userId));
          setSelectedUser(null);
          setIsUpdatingUser(false);
      }
  };

  const handleGrantAccess = async () => {
      if (!selectedUser || !selectedCourseToGrant) {
          alert("Please select a course to grant.");
          return;
      }
      setIsUpdatingUser(true);
      const updatedUser = await adminEnrollUser(selectedUser.id, selectedCourseToGrant);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setIsUpdatingUser(false);
      alert(`Access granted to course successfully.`);
      setSelectedCourseToGrant('');
  };

  // --- PRODUCT HANDLERS ---
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This will remove it from the Marketplace.')) {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const openAddProductModal = () => {
      setIsEditingProduct(false);
      setNewProduct({ 
          title: '', description: '', price: 0, category: ProductCategory.EBOOK, imageUrl: '', previewUrl: '', downloadUrl: ''
      });
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
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.zip')) {
          alert("Please upload a PDF or ZIP file.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, downloadUrl: reader.result as string });
      };
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
      setIsEditingProduct(false);
    } else {
        alert("Please fill in all required fields including the image.");
    }
  };

  // --- COURSE HANDLERS ---
  const handleCourseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentCourse({ ...currentCourse, thumbnail: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddModule = () => {
      const newModule: Module = {
          id: `m-${Date.now()}`,
          title: 'New Module',
          description: '',
          lessons: []
      };
      setCurrentCourse({ ...currentCourse, modules: [...(currentCourse.modules || []), newModule] });
  };

  const handleDeleteModule = (idx: number) => {
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules.splice(idx, 1);
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleUpdateModule = (idx: number, field: keyof Module, value: any) => {
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[idx] = { ...updatedModules[idx], [field]: value };
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleAddLesson = (moduleIdx: number) => {
      const newLesson: Lesson = {
          id: `l-${Date.now()}`,
          title: 'New Lesson',
          type: 'text',
          content: '',
          duration: '10 mins',
          questions: []
      };
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[moduleIdx].lessons.push(newLesson);
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleDeleteLesson = (moduleIdx: number, lessonIdx: number) => {
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[moduleIdx].lessons.splice(lessonIdx, 1);
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleUpdateLesson = (moduleIdx: number, lessonIdx: number, field: keyof Lesson, value: any) => {
      const updatedModules = [...(currentCourse.modules || [])];
      updatedModules[moduleIdx].lessons[lessonIdx] = { 
          ...updatedModules[moduleIdx].lessons[lessonIdx], 
          [field]: value 
      };
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleLessonFileUpload = (moduleIdx: number, lessonIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
               handleUpdateLesson(moduleIdx, lessonIdx, 'fileUrl', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // Quiz Management
  const handleAddQuestion = (moduleIdx: number, lessonIdx: number) => {
      const updatedModules = [...(currentCourse.modules || [])];
      const lesson = updatedModules[moduleIdx].lessons[lessonIdx];
      const newQuestion: QuizQuestion = {
          id: `q-${Date.now()}`,
          question: 'New Question?',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0
      };
      lesson.questions = [...(lesson.questions || []), newQuestion];
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleUpdateQuestion = (moduleIdx: number, lessonIdx: number, qIdx: number, field: keyof QuizQuestion, value: any) => {
      const updatedModules = [...(currentCourse.modules || [])];
      const questions = [...(updatedModules[moduleIdx].lessons[lessonIdx].questions || [])];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      updatedModules[moduleIdx].lessons[lessonIdx].questions = questions;
      setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };
  
  const handleUpdateOption = (moduleIdx: number, lessonIdx: number, qIdx: number, optIdx: number, value: string) => {
        const updatedModules = [...(currentCourse.modules || [])];
        const questions = [...(updatedModules[moduleIdx].lessons[lessonIdx].questions || [])];
        const options = [...questions[qIdx].options];
        options[optIdx] = value;
        questions[qIdx].options = options;
        updatedModules[moduleIdx].lessons[lessonIdx].questions = questions;
        setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleDeleteQuestion = (moduleIdx: number, lessonIdx: number, qIdx: number) => {
        const updatedModules = [...(currentCourse.modules || [])];
        const questions = [...(updatedModules[moduleIdx].lessons[lessonIdx].questions || [])];
        questions.splice(qIdx, 1);
        updatedModules[moduleIdx].lessons[lessonIdx].questions = questions;
        setCurrentCourse({ ...currentCourse, modules: updatedModules });
  };

  const handleSaveCourse = async () => {
      if(!currentCourse.title || !currentCourse.description) {
          alert("Please fill in basic course details");
          return;
      }

      if(isEditingCourse && currentCourse.id) {
          await updateCourse(currentCourse as Course);
          setCourses(prev => prev.map(c => c.id === currentCourse.id ? currentCourse as Course : c));
      } else {
          const newCourse: Course = {
              ...currentCourse as Course,
              id: `c-${Date.now()}`,
              modules: currentCourse.modules || []
          };
          await addCourse(newCourse);
          setCourses(prev => [newCourse, ...prev]);
      }
      setShowCourseModal(false);
  };

  const handleDeleteCourse = async (id: string) => {
      if(window.confirm("Are you sure? This will remove the course and all enrollment data.")) {
          await deleteCourse(id);
          setCourses(prev => prev.filter(c => c.id !== id));
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.includes(userSearch)
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[#A8C7FA]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* DASHBOARD STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0F5223] rounded-xl border border-[#6DD58C]/30 text-[#6DD58C]">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Total Revenue</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">₦{totalRevenue.toLocaleString()}</h2>
                </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#0842A0] rounded-xl border border-[#A8C7FA]/30 text-[#A8C7FA]">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Total Users</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">{users.length}</h2>
                </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#5B4300] rounded-xl border border-[#FFD97D]/30 text-[#FFD97D]">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Products Sold</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">--</h2>
                </div>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-[#1E1F20] to-[#131314] flex items-center gap-4">
                <div className="p-3 bg-[#370007] rounded-xl border border-[#F2B8B5]/30 text-[#F2B8B5]">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[#8E918F] text-xs font-medium uppercase tracking-wider">Growth</p>
                    <h2 className="text-2xl font-bold text-[#E3E3E3]">+12%</h2>
                </div>
            </Card>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
          <div>
            <Badge color="blue" >Administrator</Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-[#E3E3E3] mt-2">Dashboard</h1>
            <p className="text-sm md:text-base text-[#C4C7C5]">Manage your database and operations.</p>
          </div>
          <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            <div className="flex gap-2 bg-[#1E1F20] p-1.5 rounded-full border border-[#444746] min-w-max">
                <button onClick={() => setActiveTab('products')} className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'products' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                    <LayoutGrid className="w-4 h-4 mr-2" /> Products
                </button>
                <button onClick={() => setActiveTab('users')} className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'users' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                    <Users className="w-4 h-4 mr-2" /> Users
                </button>
                <button onClick={() => setActiveTab('inquiries')} className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'inquiries' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                    <Mail className="w-4 h-4 mr-2" /> Inquiries
                </button>
                <button onClick={() => setActiveTab('training')} className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'training' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                    <GraduationCap className="w-4 h-4 mr-2" /> Training
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center px-6 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}>
                    <Settings className="w-4 h-4 mr-2" /> Settings
                </button>
            </div>
          </div>
        </div>

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto">
                <Card className="p-8">
                    <h2 className="text-xl font-bold text-[#E3E3E3] mb-6 flex items-center gap-2"><Settings className="w-5 h-5" /> Platform Configuration</h2>
                    
                    <div className="space-y-6">
                        <Input 
                            label="Platform Name" 
                            value={appSettings.platformName} 
                            onChange={(e) => setAppSettings({...appSettings, platformName: e.target.value})} 
                        />
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-[#C4C7C5] ml-1">App Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-[#131314] border border-[#444746] flex items-center justify-center overflow-hidden">
                                    {appSettings.logoUrl ? (
                                        <img src={appSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[#8E918F] text-xs">No Logo</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-[#1E1F20] border border-[#444746] rounded-full text-[#E3E3E3] hover:bg-[#2D2E30] transition-colors text-sm font-medium">
                                        <Upload className="w-4 h-4 mr-2" /> Upload New Logo
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                    </label>
                                    <p className="text-xs text-[#8E918F] mt-2">Recommended size: 128x128px. PNG or JPG.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#444746] flex justify-end">
                            <Button onClick={handleSaveSettings} icon={Save}>Save Changes</Button>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-end mb-6">
              <Button onClick={openAddProductModal} icon={Plus}>Add Product</Button>
            </div>
            
            <div className="bg-[#1E1F20] rounded-[24px] shadow-sm border border-[#444746] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#444746]">
                  <thead className="bg-[#131314]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden sm:table-cell">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden sm:table-cell">Price</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1E1F20] divide-y divide-[#444746]">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-[#2D2E30] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                              <img className="h-10 w-10 md:h-12 md:w-12 rounded-lg object-cover border border-[#444746]" src={product.imageUrl} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-[#E3E3E3]">{product.title}</div>
                              <div className="text-sm text-[#8E918F] truncate max-w-[150px] sm:max-w-xs">{product.description}</div>
                              <div className="sm:hidden text-xs text-[#8E918F] mt-1">
                                {product.category} • {product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          <Badge color="purple">{product.category}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C4C7C5] hidden sm:table-cell">
                          {product.price === 0 ? 'Free' : `₦${product.price.toLocaleString()}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditProductModal(product)} className="text-[#A8C7FA] hover:text-[#D3E3FD] transition-colors p-2 hover:bg-[#A8C7FA]/10 rounded-full" title="Edit Product">
                                <Edit className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product.id)} className="text-[#CF6679] hover:text-[#FFB4AB] transition-colors p-2 hover:bg-[#CF6679]/10 rounded-full" title="Delete Product">
                                <Trash2 className="w-5 h-5" />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8E918F]" />
                    <input type="text" placeholder="Search users by name, email or ID..." className="w-full pl-12 pr-4 py-3 bg-[#1E1F20] border border-[#444746] rounded-2xl text-[#E3E3E3] focus:ring-2 focus:ring-[#A8C7FA] outline-none" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                 </div>
                 <Button onClick={handleExportDatabase} variant="outline" icon={Download}>Export Data</Button>
             </div>
             <div className="bg-[#1E1F20] rounded-[24px] shadow-sm border border-[#444746] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#444746]">
                    <thead className="bg-[#131314]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden sm:table-cell">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden sm:table-cell">Balance</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden md:table-cell">Joined</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#1E1F20] divide-y divide-[#444746]">
                        {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#2D2E30] transition-colors group cursor-pointer" onClick={() => handleUserClick(user)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                                {user.photoUrl ? (
                                    <img src={user.photoUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover border border-[#444746]" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-[#A8C7FA]/20 flex items-center justify-center text-[#A8C7FA] font-bold border border-[#A8C7FA]/30 text-lg">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="ml-4">
                                <div className="text-sm font-bold text-[#E3E3E3]">{user.name} <span className="text-[10px] bg-[#444746] px-1.5 py-0.5 rounded text-[#C4C7C5] ml-2">{user.role}</span></div>
                                <div className="text-sm text-[#8E918F]">{user.email}</div>
                                </div>
                            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'suspended' ? 'bg-[#CF6679]/20 text-[#CF6679] border border-[#CF6679]/30' : user.status === 'banned' ? 'bg-[#370007] text-[#FFB4AB] border border-[#FFB4AB]/30' : 'bg-[#0F5223] text-[#C4EED0] border border-[#6DD58C]/30'}`}>
                                    {user.status || 'active'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                                <div className="flex items-center text-sm font-mono text-[#6DD58C]">₦{user.balance.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#C4C7C5] hidden md:table-cell">
                                {new Date(user.joinedAt).toLocaleDateString()}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <Button size="sm" variant="ghost" icon={MoreVertical} />
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    {filteredUsers.length === 0 && <div className="p-12 text-center text-[#8E918F]">No users found matching "{userSearch}"</div>}
                </div>
             </div>
          </div>
        )}

        {/* --- INQUIRIES TAB --- */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
                <div className="text-center py-20 text-[#8E918F]">No inquiries received yet.</div>
            ) : (
                inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                    <div>
                        <h3 className="text-xl font-bold text-[#E3E3E3]">{inquiry.serviceType}</h3>
                        <p className="text-sm text-[#C4C7C5] mt-1">From: <span className="text-[#E3E3E3]">{inquiry.name}</span> ({inquiry.email})</p>
                    </div>
                    <span className="text-xs text-[#8E918F] bg-[#131314] px-3 py-1 rounded-full border border-[#444746] whitespace-nowrap">{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-[#131314] p-5 rounded-2xl text-[#C4C7C5] text-sm leading-relaxed border border-[#444746]">
                    {inquiry.message}
                    </div>
                    <div className="mt-6 flex gap-3">
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${inquiry.email}`}>Reply via Email</Button>
                    </div>
                </Card>
                ))
            )}
          </div>
        )}

        {/* --- TRAINING TAB --- */}
        {activeTab === 'training' && (
            <div className="space-y-6">
                <div className="bg-[#1E1F20] border border-[#444746] rounded-2xl p-6 text-center">
                    <h3 className="text-[#E3E3E3] font-bold text-lg mb-2">Manage Courses</h3>
                    <p className="text-[#8E918F] mb-6">Create new courses, manage curriculums, and upload video materials.</p>
                    <Button icon={Plus} onClick={() => {
                        setIsEditingCourse(false);
                        setCurrentCourse({ title: '', description: '', thumbnail: '', level: 'Beginner', duration: '', price: 0, instructor: '', modules: [] });
                        setShowCourseModal(true);
                        setCourseModalTab('basics');
                    }}>Create New Course</Button>
                </div>
                
                <h3 className="text-[#E3E3E3] font-bold text-lg mt-8 mb-4">Active Courses</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {courses.map(course => (
                        <Card key={course.id} className="p-6">
                             <div className="flex gap-4">
                                <img src={course.thumbnail || 'https://via.placeholder.com/150'} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover bg-[#131314]" />
                                <div className="flex-1">
                                    <h4 className="text-[#E3E3E3] font-bold text-sm md:text-base">{course.title}</h4>
                                    <p className="text-xs md:text-sm text-[#8E918F] mt-1">{course.modules.length} Modules • {course.level}</p>
                                    <div className="mt-3 flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => {
                                            setIsEditingCourse(true);
                                            setCurrentCourse({...course});
                                            setShowCourseModal(true);
                                            setCourseModalTab('curriculum');
                                        }}>Edit Content</Button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-full transition-colors"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                             </div>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* --- MODALS --- */}

        {/* User Modal */}
        {selectedUser && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                <Card className="max-w-4xl w-full bg-[#1E1F20] max-h-[90vh] flex flex-col overflow-hidden p-0 border border-[#444746]">
                    <div className="p-6 border-b border-[#444746] bg-[#131314] flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {selectedUser.photoUrl ? (
                                    <img src={selectedUser.photoUrl} alt={selectedUser.name} className="w-16 h-16 rounded-full object-cover shadow-lg border border-[#444746]" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-[#4285F4] flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[#E3E3E3]">{selectedUser.name}</h2>
                                <div className="flex items-center gap-2 text-sm text-[#8E918F] mt-1">
                                    <span>{selectedUser.email}</span>
                                    <span>•</span>
                                    <span className="font-mono text-xs">ID: {selectedUser.id}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Grant Access Section */}
                                <div className="bg-[#131314] p-6 rounded-2xl border border-[#444746]">
                                    <h3 className="text-[#A8C7FA] font-bold mb-4 flex items-center gap-2"><Gift className="w-5 h-5" /> Grant Access (Free Enrollment)</h3>
                                    <div className="flex gap-4">
                                        <select 
                                            className="flex-1 rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] outline-none"
                                            value={selectedCourseToGrant}
                                            onChange={(e) => setSelectedCourseToGrant(e.target.value)}
                                        >
                                            <option value="">Select Course...</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id} disabled={selectedUser.enrolledCourses?.includes(c.id)}>
                                                    {c.title} {selectedUser.enrolledCourses?.includes(c.id) ? '(Enrolled)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <Button onClick={handleGrantAccess} disabled={!selectedCourseToGrant} isLoading={isUpdatingUser}>Grant</Button>
                                    </div>
                                </div>

                                <div className="bg-[#131314] p-6 rounded-2xl border border-[#444746]">
                                    <h3 className="text-[#A8C7FA] font-bold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> Wallet Management</h3>
                                    <div className="flex items-center justify-between mb-6 p-4 bg-[#1E1F20] rounded-xl border border-[#444746]">
                                        <span className="text-[#C4C7C5]">Current Balance</span>
                                        <span className="text-3xl font-bold text-[#6DD58C] font-mono">₦{selectedUser.balance.toLocaleString()}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Button variant="outline" className="w-full" onClick={() => {
                                                const amount = prompt("Enter amount to add:");
                                                if(amount && !isNaN(parseFloat(amount))) {
                                                    handleUpdateUser({...selectedUser, balance: selectedUser.balance + parseFloat(amount)});
                                                }
                                            }}>+ Add Funds</Button>
                                        <Button variant="outline" className="w-full" onClick={() => {
                                                const amount = prompt("Enter amount to deduct:");
                                                if(amount && !isNaN(parseFloat(amount))) {
                                                    const val = parseFloat(amount);
                                                    if(selectedUser.balance >= val)
                                                        handleUpdateUser({...selectedUser, balance: selectedUser.balance - val});
                                                    else alert("Insufficient balance");
                                                }
                                            }}>- Deduct Funds</Button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[#E3E3E3] font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#C4C7C5]" /> Recent Activity</h3>
                                    <div className="space-y-3">
                                        {userActivity.map((log) => (
                                            <div key={log.id} className="flex gap-4 p-3 rounded-xl bg-[#131314] border border-[#444746] text-sm">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'success' ? 'bg-[#6DD58C]' : log.type === 'danger' ? 'bg-[#CF6679]' : log.type === 'warning' ? 'bg-[#F2B8B5]' : 'bg-[#A8C7FA]'}`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-[#E3E3E3]">{log.action}</span>
                                                        <span className="text-[#8E918F] text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-[#C4C7C5] mt-1">{log.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <Card className="p-6 bg-[#131314]">
                                    <h3 className="text-[#E3E3E3] font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#D96570]" /> Account Status</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#C4C7C5] text-sm">Current Status</span>
                                            <Badge color={selectedUser.status === 'active' ? 'green' : 'red'}>{(selectedUser.status || 'active').toUpperCase()}</Badge>
                                        </div>
                                        {selectedUser.status !== 'active' ? (
                                            <Button className="w-full bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3]" onClick={() => handleUpdateUser({...selectedUser, status: 'active'})}>Activate Account</Button>
                                        ) : (
                                            <Button className="w-full" variant="danger" onClick={() => handleUpdateUser({...selectedUser, status: 'suspended'})}>Suspend Account</Button>
                                        )}
                                        <div className="pt-4 border-t border-[#444746] mt-4">
                                            <button className="text-[#CF6679] text-sm hover:underline w-full text-left flex items-center gap-2" onClick={() => handleDeleteUser(selectedUser.id)}><AlertTriangle className="w-4 h-4" /> Permanently Delete User</button>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-6 bg-[#131314]">
                                    <h3 className="text-[#E3E3E3] font-bold mb-4">Quick Edit</h3>
                                    <div className="space-y-4">
                                        <Input label="Full Name" value={selectedUser.name} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} />
                                        <Input label="Email Address" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} />
                                         <div>
                                            <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Role</label>
                                            <div className="relative">
                                                <select className="w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] outline-none appearance-none" value={selectedUser.role} onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value as 'user' | 'admin'})}>
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button className="w-full mt-2" onClick={() => handleUpdateUser(selectedUser)} isLoading={isUpdatingUser}>Save Changes</Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <Card className="max-w-md w-full p-8 bg-[#1E1F20] max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-[#E3E3E3]">{isEditingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <Input label="Title" value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} required />
                <Textarea label="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} required />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Price (₦)" type="number" min="0" step="0.01" value={isNaN(newProduct.price!) ? '' : newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })} />
                  <div>
                    <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Category</label>
                    <div className="relative">
                        <select className="w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] outline-none appearance-none" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as ProductCategory })}>
                            {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#C4C7C5] ml-1">Product Image</label>
                    <div className="flex flex-col gap-4">
                        {newProduct.imageUrl && (
                            <div className="relative w-full h-48 bg-[#131314] rounded-2xl overflow-hidden border border-[#444746]">
                                <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                <button type="button" onClick={() => setNewProduct({...newProduct, imageUrl: ''})} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        <label className="cursor-pointer group">
                            <div className="w-full h-12 rounded-2xl bg-[#1E1F20] border border-dashed border-[#444746] group-hover:border-[#A8C7FA] flex items-center justify-center gap-2 transition-all">
                                <Upload className="w-4 h-4 text-[#8E918F] group-hover:text-[#A8C7FA]" /> <span className="text-sm text-[#8E918F] group-hover:text-[#E3E3E3]">Upload Image</span>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#C4C7C5] ml-1">Digital File (PDF/ZIP)</label>
                    <div className="flex flex-col gap-4">
                        {newProduct.downloadUrl && (
                            <div className="flex items-center gap-3 p-3 bg-[#0F5223] rounded-xl border border-[#6DD58C]/30 text-[#C4EED0]">
                                <FileText className="w-5 h-5" /> <span className="text-sm font-medium">File Uploaded Successfully</span>
                                <button type="button" onClick={() => setNewProduct({...newProduct, downloadUrl: ''})} className="ml-auto p-1 hover:bg-[#6DD58C]/20 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                        )}
                        <label className="cursor-pointer group">
                            <div className="w-full h-12 rounded-2xl bg-[#1E1F20] border border-dashed border-[#444746] group-hover:border-[#6DD58C] flex items-center justify-center gap-2 transition-all">
                                <Download className="w-4 h-4 text-[#8E918F] group-hover:text-[#6DD58C]" /> <span className="text-sm text-[#8E918F] group-hover:text-[#E3E3E3]">Upload Digital Product</span>
                            </div>
                            <input type="file" accept=".pdf,.zip,.rar" className="hidden" onChange={handlePdfUpload} />
                        </label>
                    </div>
                </div>
                <Input label="Preview URL (Optional)" value={newProduct.previewUrl} onChange={(e) => setNewProduct({ ...newProduct, previewUrl: e.target.value })} placeholder="Link to live demo (e.g. CodePen, Vercel)" />
                <div className="flex gap-4 mt-8">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowProductModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1">{isEditingProduct ? 'Save Changes' : 'Add Product'}</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* --- COURSE EDITOR MODAL --- */}
        {showCourseModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                <Card className="max-w-5xl w-full bg-[#1E1F20] h-[90vh] flex flex-col overflow-hidden p-0 border border-[#444746]">
                    <div className="p-6 border-b border-[#444746] bg-[#131314] flex justify-between items-center">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[#E3E3E3]">{isEditingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                            <p className="text-sm text-[#8E918F]">Manage course details and curriculum</p>
                        </div>
                        <div className="flex gap-3">
                            <Button size="sm" variant={courseModalTab === 'basics' ? 'primary' : 'outline'} onClick={() => setCourseModalTab('basics')}>Basic Info</Button>
                            <Button size="sm" variant={courseModalTab === 'curriculum' ? 'primary' : 'outline'} onClick={() => setCourseModalTab('curriculum')}>Curriculum</Button>
                            <button onClick={() => setShowCourseModal(false)} className="p-2 ml-4 hover:bg-[#2D2E30] rounded-full text-[#C4C7C5]"><X className="w-6 h-6" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {courseModalTab === 'basics' ? (
                            <div className="space-y-6 max-w-3xl mx-auto">
                                <Input label="Course Title" value={currentCourse.title} onChange={e => setCurrentCourse({...currentCourse, title: e.target.value})} placeholder="e.g. Master React JS" />
                                <Textarea label="Description" value={currentCourse.description} onChange={e => setCurrentCourse({...currentCourse, description: e.target.value})} placeholder="Detailed description of what students will learn..." rows={4} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Price (₦)" type="number" value={currentCourse.price} onChange={e => setCurrentCourse({...currentCourse, price: parseFloat(e.target.value)})} />
                                    <Input label="Duration" value={currentCourse.duration} onChange={e => setCurrentCourse({...currentCourse, duration: e.target.value})} placeholder="e.g. 3 Months" />
                                    <div>
                                        <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Level</label>
                                        <select className="w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] outline-none" value={currentCourse.level} onChange={e => setCurrentCourse({...currentCourse, level: e.target.value as any})}>
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                    <Input label="Instructor" value={currentCourse.instructor} onChange={e => setCurrentCourse({...currentCourse, instructor: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-[#C4C7C5] ml-1">Thumbnail Image</label>
                                    <div className="flex items-center gap-4">
                                        {currentCourse.thumbnail && <img src={currentCourse.thumbnail} alt="Thumb" className="w-24 h-16 object-cover rounded-lg border border-[#444746]" />}
                                        <label className="cursor-pointer px-4 py-2 bg-[#131314] border border-[#444746] rounded-full hover:bg-[#2D2E30] transition text-sm text-[#C4C7C5]">
                                            Upload Thumbnail
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCourseImageUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-[#E3E3E3]">Modules & Lessons</h3>
                                    <Button size="sm" onClick={handleAddModule} icon={Plus}>Add Module</Button>
                                </div>
                                
                                {(!currentCourse.modules || currentCourse.modules.length === 0) && (
                                    <div className="text-center py-12 border-2 border-dashed border-[#444746] rounded-2xl text-[#8E918F]">
                                        No modules yet. Click "Add Module" to start building your curriculum.
                                    </div>
                                )}

                                {currentCourse.modules?.map((module, mIdx) => (
                                    <Card key={module.id} className="p-4 bg-[#131314] border border-[#444746]">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="mt-3 cursor-grab text-[#5E5E5E]"><GripVertical className="w-5 h-5" /></div>
                                            <div className="flex-1 space-y-3">
                                                <Input value={module.title} onChange={e => handleUpdateModule(mIdx, 'title', e.target.value)} placeholder="Module Title (e.g. Week 1: Basics)" className="font-bold" />
                                                <Input value={module.description} onChange={e => handleUpdateModule(mIdx, 'description', e.target.value)} placeholder="Module Description" className="text-sm" />
                                            </div>
                                            <button onClick={() => handleDeleteModule(mIdx)} className="text-[#CF6679] p-2 hover:bg-[#CF6679]/10 rounded-full"><Trash2 className="w-5 h-5" /></button>
                                        </div>

                                        <div className="pl-10 space-y-3">
                                            {module.lessons.map((lesson, lIdx) => (
                                                <div key={lesson.id} className="bg-[#1E1F20] p-4 rounded-xl border border-[#444746] relative group">
                                                    <div className="flex gap-3 mb-3">
                                                        <select 
                                                            className="bg-[#131314] border border-[#444746] text-[#C4C7C5] text-xs rounded-lg px-2 py-1 outline-none"
                                                            value={lesson.type}
                                                            onChange={e => handleUpdateLesson(mIdx, lIdx, 'type', e.target.value)}
                                                        >
                                                            <option value="video">Video</option>
                                                            <option value="text">Text/Reading</option>
                                                            <option value="quiz">Quiz</option>
                                                        </select>
                                                        <input 
                                                            className="bg-transparent border-b border-[#444746] text-[#E3E3E3] text-sm flex-1 outline-none focus:border-[#A8C7FA] px-1" 
                                                            value={lesson.title} 
                                                            onChange={e => handleUpdateLesson(mIdx, lIdx, 'title', e.target.value)} 
                                                            placeholder="Lesson Title"
                                                        />
                                                        <button onClick={() => handleDeleteLesson(mIdx, lIdx)} className="text-[#CF6679] opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                                    </div>
                                                    
                                                    {lesson.type === 'video' && (
                                                        <div className="flex items-center gap-2">
                                                            <Video className="w-4 h-4 text-[#8E918F]" />
                                                            <input 
                                                                className="bg-[#131314] border border-[#444746] rounded-lg px-3 py-2 text-xs w-full text-[#C4C7C5] outline-none focus:border-[#A8C7FA]"
                                                                value={lesson.content} 
                                                                onChange={e => handleUpdateLesson(mIdx, lIdx, 'content', e.target.value)}
                                                                placeholder="Paste YouTube Link (e.g. youtube.com/watch?v=...)" 
                                                            />
                                                        </div>
                                                    )}

                                                    {lesson.type === 'text' && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-[#8E918F]" />
                                                                <textarea 
                                                                    className="bg-[#131314] border border-[#444746] rounded-lg px-3 py-2 text-xs w-full text-[#C4C7C5] outline-none focus:border-[#A8C7FA]"
                                                                    value={lesson.content} 
                                                                    onChange={e => handleUpdateLesson(mIdx, lIdx, 'content', e.target.value)}
                                                                    placeholder="Enter reading content here..." 
                                                                    rows={2}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-6">
                                                                {lesson.fileUrl ? (
                                                                    <div className="flex items-center gap-2 text-xs text-[#6DD58C] bg-[#0F5223] px-2 py-1 rounded border border-[#6DD58C]/30">
                                                                        <Check className="w-3 h-3" /> PDF/Doc Attached
                                                                        <button onClick={() => handleUpdateLesson(mIdx, lIdx, 'fileUrl', '')}><X className="w-3 h-3 hover:text-white"/></button>
                                                                    </div>
                                                                ) : (
                                                                    <label className="cursor-pointer flex items-center gap-1 text-xs text-[#A8C7FA] hover:underline">
                                                                        <Upload className="w-3 h-3" /> Upload PDF/Doc
                                                                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleLessonFileUpload(mIdx, lIdx, e)} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {lesson.type === 'quiz' && (
                                                        <div className="mt-2 pl-2 border-l-2 border-[#444746]">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs text-[#8E918F]">Quiz Questions</span>
                                                                <button onClick={() => handleAddQuestion(mIdx, lIdx)} className="text-xs text-[#A8C7FA] hover:underline">+ Add Question</button>
                                                            </div>
                                                            <div className="space-y-4">
                                                                {lesson.questions?.map((q, qIdx) => (
                                                                    <div key={q.id} className="bg-[#131314] p-3 rounded-lg border border-[#444746]">
                                                                        <div className="flex gap-2 mb-2">
                                                                            <span className="text-xs text-[#8E918F] pt-1">Q{qIdx+1}.</span>
                                                                            <input 
                                                                                className="bg-transparent border-b border-[#444746] text-[#E3E3E3] text-sm flex-1 outline-none focus:border-[#A8C7FA]"
                                                                                value={q.question}
                                                                                onChange={(e) => handleUpdateQuestion(mIdx, lIdx, qIdx, 'question', e.target.value)}
                                                                                placeholder="Question Text"
                                                                            />
                                                                            <button onClick={() => handleDeleteQuestion(mIdx, lIdx, qIdx)} className="text-[#CF6679] hover:bg-[#CF6679]/10 p-1 rounded"><Trash2 className="w-3 h-3" /></button>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2 ml-4">
                                                                            {q.options.map((opt, optIdx) => (
                                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name={`correct-${q.id}`} 
                                                                                        checked={q.correctAnswer === optIdx}
                                                                                        onChange={() => handleUpdateQuestion(mIdx, lIdx, qIdx, 'correctAnswer', optIdx)}
                                                                                        className="accent-[#6DD58C]"
                                                                                    />
                                                                                    <input 
                                                                                        className="bg-[#1E1F20] rounded border border-[#444746] text-xs text-[#C4C7C5] px-2 py-1 w-full outline-none focus:border-[#A8C7FA]"
                                                                                        value={opt}
                                                                                        onChange={(e) => handleUpdateOption(mIdx, lIdx, qIdx, optIdx, e.target.value)}
                                                                                        placeholder={`Option ${optIdx + 1}`}
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <Button size="sm" variant="ghost" onClick={() => handleAddLesson(mIdx)} className="text-xs">+ Add Lesson</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 border-t border-[#444746] bg-[#1E1F20] flex justify-end gap-4">
                        <Button variant="outline" onClick={() => setShowCourseModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveCourse}>Save Course</Button>
                    </div>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
};