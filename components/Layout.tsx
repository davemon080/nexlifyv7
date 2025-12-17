import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Briefcase, DollarSign, LayoutDashboard, Home, Sparkles, GraduationCap, User as UserIcon, Cloud, CloudOff } from 'lucide-react';
import { Button } from './UI';
import { isCloudEnabled, getAppSettings } from '../services/mockData';
import { AppSettings } from '../types';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cloudActive, setCloudActive] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(getAppSettings());
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  useEffect(() => {
    setIsOpen(false);
    setCloudActive(isCloudEnabled());
    setAppSettings(getAppSettings()); // Update on navigation
  }, [location]);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
        setAppSettings(getAppSettings());
    };
    window.addEventListener('appSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('appSettingsChanged', handleSettingsChange);
  }, []);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Training', path: '/training', icon: GraduationCap },
    { name: 'Marketplace', path: '/market', icon: ShoppingBag },
    { name: 'Hire Talent', path: '/hire', icon: Briefcase },
    { name: 'Earn', path: '/earn', icon: DollarSign },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin', path: '/admin', icon: LayoutDashboard });
  } else if (currentUser) {
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

  return (
    <nav className="fixed w-full top-0 z-50 bg-[#131314]/90 backdrop-blur-xl border-b border-[#444746]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              {appSettings.logoUrl ? (
                <img 
                    src={appSettings.logoUrl} 
                    alt="Logo" 
                    className="w-10 h-10 rounded-full object-cover shadow-[0_0_15px_rgba(66,133,244,0.4)] group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-tr from-[#4285F4] via-[#9B72CB] to-[#D96570] rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(66,133,244,0.4)]">
                    <Sparkles className="w-5 h-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#E3E3E3] to-[#C4C7C5] tracking-tight">{appSettings.platformName}</span>
              </div>
            </Link>
             {/* DB Status Indicator */}
            <div className="hidden sm:flex ml-4 items-center gap-1.5 px-2 py-1 rounded-md bg-[#1E1F20] border border-[#444746]">
                {cloudActive ? (
                    <>
                        <Cloud className="w-3 h-3 text-[#6DD58C]" />
                        <span className="text-[10px] text-[#C4C7C5] font-medium">Cloud Active</span>
                    </>
                ) : (
                    <>
                        <CloudOff className="w-3 h-3 text-[#8E918F]" />
                        <span className="text-[10px] text-[#8E918F] font-medium" title="Data stored on this device only">Local Only</span>
                    </>
                )}
            </div>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActiveLink(item.path)
                    ? 'bg-[#A8C7FA]/20 text-[#A8C7FA]'
                    : 'text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            
            <div className="ml-4 pl-4 border-l border-[#444746]">
              {isAdmin || currentUser ? (
                 <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
              ) : (
                 <Button variant="primary" size="sm" onClick={() => navigate('/login')}>Login</Button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20] focus:outline-none focus:ring-2 focus:ring-[#A8C7FA]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[#131314] border-t border-[#444746] shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            <div className="flex items-center gap-2 px-4 py-2 mb-2 text-xs text-[#8E918F]">
                {cloudActive ? (
                    <><Cloud className="w-3 h-3 text-[#6DD58C]" /> Database Connected (Cloud)</>
                ) : (
                    <><CloudOff className="w-3 h-3" /> Local Mode (Device Only)</>
                )}
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-base font-medium transition-colors ${
                  isActiveLink(item.path)
                    ? 'bg-[#A8C7FA]/10 text-[#A8C7FA] border border-[#A8C7FA]/20'
                    : 'text-[#C4C7C5] hover:text-[#E3E3E3] hover:bg-[#1E1F20]'
                }`}
              >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-tr from-[#4285F4] to-[#9B72CB] rounded-full flex items-center justify-center text-white font-bold">
                N
              </div>
              <span className="font-bold text-xl text-[#E3E3E3]">Nexlify</span>
            </div>
            <p className="text-sm leading-relaxed text-[#8E918F]">
              Empowering digital growth through services, resources, and opportunities. Join the future of work with Nexlify AI.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Platform</h3>
            <ul className="space-y-4">
              <li><Link to="/training" className="hover:text-[#A8C7FA] transition-colors">Training</Link></li>
              <li><Link to="/market" className="hover:text-[#A8C7FA] transition-colors">Marketplace</Link></li>
              <li><Link to="/hire" className="hover:text-[#A8C7FA] transition-colors">Hire Talent</Link></li>
              <li><Link to="/earn" className="hover:text-[#A8C7FA] transition-colors">Earn Money</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Company</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-[#A8C7FA] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#A8C7FA] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#A8C7FA] transition-colors">Contact</a></li>
              <li><Link to="/login" className="hover:text-[#A8C7FA] transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#E3E3E3] tracking-widest uppercase mb-6">Connect</h3>
            <div className="flex space-x-4">
               {/* Social placeholders */}
               <div className="w-10 h-10 bg-[#1E1F20] rounded-full flex items-center justify-center hover:bg-[#A8C7FA] hover:text-[#062E6F] transition-all cursor-pointer border border-[#444746]">
                 <span className="sr-only">Facebook</span>
                 <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </div>
               <div className="w-10 h-10 bg-[#1E1F20] rounded-full flex items-center justify-center hover:bg-[#A8C7FA] hover:text-[#062E6F] transition-all cursor-pointer border border-[#444746]">
                 <span className="sr-only">Twitter</span>
                 <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
               </div>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#444746] text-center text-sm text-[#8E918F]">
          &copy; {new Date().getFullYear()} Nexlify. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Navbar />
      <main className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
};