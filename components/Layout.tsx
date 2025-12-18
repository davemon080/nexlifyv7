
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Briefcase, DollarSign, LayoutDashboard, Home, Sparkles, GraduationCap, User as UserIcon, Cloud, CloudOff, Bot, Bell, Clock, Info, CheckCircle, AlertTriangle, AlertCircle, ChevronLeft, BookOpen } from 'lucide-react';
import { Button, Badge as UIBadge } from './UI';
import { isCloudEnabled, getAppSettings, getNotifications, markNotificationRead } from '../services/mockData';
import { AppSettings, Notification } from '../types';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [cloudActive, setCloudActive] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isTutor = currentUser?.role === 'tutor';

  useEffect(() => {
    setIsOpen(false);
    setIsNotifOpen(false);
    setCloudActive(isCloudEnabled());
    setAppSettings(getAppSettings());
  }, [location]);

  useEffect(() => {
    if (currentUser) {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target as Node)) {
          const isToggleButton = (event.target as HTMLElement).closest('.notif-toggle-btn');
          if (!isToggleButton) {
            setIsNotifOpen(false);
          }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const loadNotifications = async () => {
      if (!currentUser) return;
      try {
        const data = await getNotifications(currentUser.id);
        setNotifications(data);
      } catch (e) {
        console.error("Failed to load notifications");
      }
  };

  const handleMarkRead = async (id: string) => {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearAll = async () => {
      const unread = notifications.filter(n => !n.isRead);
      for(const n of unread) {
          await handleMarkRead(n.id);
      }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Training', path: '/training', icon: GraduationCap },
    { name: 'Marketplace', path: '/market', icon: ShoppingBag },
    { name: 'AI Tools', path: '/ai-tools', icon: Bot },
    { name: 'Hire Talent', path: '/hire', icon: Briefcase },
    { name: 'Earn', path: '/earn', icon: DollarSign },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  } else if (isTutor) {
    navItems.push({ name: 'Tutor Panel', path: '/tutor-dashboard', icon: BookOpen });
  }

  if (currentUser) {
    navItems.push({ name: 'Profile', path: '/profile', icon: UserIcon });
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const isActiveLink = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getNotifIcon = (type: string) => {
      switch(type) {
          case 'success': return <CheckCircle className="w-4 h-4 text-[#6DD58C]" />;
          case 'warning': return <AlertTriangle className="w-4 h-4 text-[#FFD97D]" />;
          case 'danger': return <AlertCircle className="w-4 h-4 text-[#F2B8B5]" />;
          default: return <Info className="w-4 h-4 text-[#A8C7FA]" />;
      }
  };

  const NotificationDrawer = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div 
      ref={notifRef}
      className={`${isMobile ? 'fixed inset-x-0 top-0 bottom-0 z-[100] h-screen' : 'absolute right-0 mt-4 w-80 md:w-96'} bg-[#1E1F20] border border-[#444746] ${!isMobile && 'rounded-2xl shadow-2xl'} overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
    >
        <div className="p-4 bg-[#131314] border-b border-[#444746] flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
                {isMobile && (
                    <button onClick={() => setIsNotifOpen(false)} className="p-2 -ml-2 text-[#C4C7C5]">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#A8C7FA]" />
                    <h3 className="font-bold text-[#E3E3E3]">Activity Hub</h3>
                </div>
            </div>
            <UIBadge color="blue">{unreadCount} New</UIBadge>
        </div>
        <div className={`${isMobile ? 'h-[calc(100%-140px)]' : 'max-h-[400px]'} overflow-y-auto custom-scrollbar`}>
            {notifications.length === 0 ? (
                <div className="p-10 text-center text-[#8E918F]">
                    <div className="w-16 h-16 bg-[#131314] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#444746]">
                        <Bell className="w-6 h-6 opacity-20" />
                    </div>
                    <p className="text-sm font-medium text-[#E3E3E3]">All caught up!</p>
                    <p className="text-xs mt-1">No new notifications at this time.</p>
                </div>
            ) : (
                notifications.map(notif => (
                    <div key={notif.id} onClick={() => handleMarkRead(notif.id)} className={`p-5 border-b border-[#444746] hover:bg-[#2D2E30] transition-colors cursor-pointer relative ${!notif.isRead ? 'bg-[#A8C7FA]/5' : ''}`}>
                        {!notif.isRead && <div className="absolute top-6 right-6 w-2 h-2 bg-[#A8C7FA] rounded-full shadow-[0_0_8px_rgba(168,199,250,0.6)]" />}
                        <div className="flex gap-4">
                            <div className="mt-1 flex-shrink-0">{getNotifIcon(notif.type)}</div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-[#E3E3E3] mb-1 truncate">{notif.title}</h4>
                                <p className="text-xs text-[#C4C7C5] leading-relaxed mb-2 line-clamp-3">{notif.message}</p>
                                <div className="flex items-center gap-1 text-[10px] text-[#5E5E5E] font-bold uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
        <div className="p-4 bg-[#131314] text-center border-t border-[#444746] absolute bottom-0 w-full">
            <button 
                onClick={handleClearAll}
                className="text-[10px] uppercase tracking-widest text-[#A8C7FA] hover:text-white transition-colors font-black py-2 px-4"
            >
                Clear all unread
            </button>
        </div>
    </div>
  );

  return (
    <nav className="fixed w-full top-0 z-[80] bg-[#131314]/90 backdrop-blur-xl border-b border-[#444746]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {appSettings.logoUrl ? (
                <img src={appSettings.logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-[0_0_15px_rgba(66,133,244,0.4)] group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-[#4285F4] via-[#9B72CB] to-[#D96570] rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform duration-300">
                    <Sparkles className="w-5 h-5" />
                </div>
              )}
              <span className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#E3E3E3] to-[#C4C7C5] tracking-tight">{appSettings.platformName}</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isActiveLink(item.path) ? 'bg-[#A8C7FA]/20 text-[#A8C7FA]' : 'text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]'}`}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="ml-4 pl-4 border-l border-[#444746] flex items-center gap-4">
              {currentUser && (
                  <div className="relative">
                      <button 
                        onClick={() => setIsNotifOpen(!isNotifOpen)} 
                        className={`notif-toggle-btn p-2 rounded-full transition-all relative ${isNotifOpen ? 'bg-[#A8C7FA]/10 text-[#A8C7FA]' : 'text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]'}`}
                      >
                          <Bell className="w-5 h-5" />
                          {unreadCount > 0 && (
                              <span className="absolute top-1 right-1 w-4 h-4 bg-[#CF6679] text-[#370007] text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#131314]">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                          )}
                      </button>

                      {isNotifOpen && <NotificationDrawer />}
                  </div>
              )}

              {isAdmin || currentUser ? (
                 <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
              ) : (
                 <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
              )}
            </div>
          </div>

          <div className="flex items-center lg:hidden gap-2">
            {currentUser && (
               <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsNotifOpen(!isNotifOpen);
                    if(isOpen) setIsOpen(false);
                }} 
                className={`notif-toggle-btn p-2 rounded-full transition-all relative ${isNotifOpen ? 'bg-[#A8C7FA] text-[#062E6F]' : 'text-[#C4C7C5]'}`}
               >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                      <span className={`absolute top-1 right-1 w-4 h-4 bg-[#CF6679] text-[#370007] text-[8px] font-bold rounded-full flex items-center justify-center border-2 ${isNotifOpen ? 'border-[#A8C7FA]' : 'border-[#131314]'}`}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                  )}
               </button>
            )}
            <button onClick={() => {
                setIsOpen(!isOpen);
                if(isNotifOpen) setIsNotifOpen(false);
            }} className="p-2 rounded-full text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]">
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Notification Hub */}
      {isNotifOpen && (
          <div className="lg:hidden">
              <NotificationDrawer isMobile />
          </div>
      )}

      <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#131314] border-t border-[#444746] shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-medium transition-colors ${isActiveLink(item.path) ? 'bg-[#A8C7FA]/10 text-[#A8C7FA] border border-[#A8C7FA]/20' : 'text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
             <div className="pt-4 mt-2 border-t border-[#444746]">
                {isAdmin || currentUser ? (
                  <Button variant="outline" className="w-full justify-center" onClick={handleLogout}>Log Out</Button>
                ) : (
                  <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/login')}>Login / Register</Button>
                )}
             </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0E0E0E] text-[#C4C7C5] py-12 md:py-16 border-t border-[#444746]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#4285F4] to-[#9B72CB] rounded-full flex items-center justify-center text-white font-bold">N</div>
              <span className="font-bold text-xl text-[#E3E3E3]">Nexlify</span>
            </div>
            <p className="text-sm leading-relaxed text-[#8E918F]">Empowering digital growth through services, resources, and opportunities. Join the future of work with Nexlify AI.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Platform</h3>
            <ul className="space-y-4">
              <li><Link to="/training" className="hover:text-[#A8C7FA] transition-colors">Training</Link></li>
              <li><Link to="/market" className="hover:text-[#A8C7FA] transition-colors">Marketplace</Link></li>
              <li><Link to="/ai-tools" className="hover:text-[#A8C7FA] transition-colors">AI Tools</Link></li>
              <li><Link to="/hire" className="hover:text-[#A8C7FA] transition-colors">Hire Talent</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-[#A8C7FA] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#A8C7FA] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Connect</h3>
            <div className="flex justify-center md:justify-start space-x-4">
               <div className="w-10 h-10 bg-[#1E1F20] rounded-full flex items-center justify-center hover:bg-[#A8C7FA] hover:text-[#062E6F] transition-all cursor-pointer border border-[#444746]">
                 <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#444746] text-center text-sm text-[#8E918F]">&copy; {new Date().getFullYear()} Nexlify. All rights reserved.</div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
};
