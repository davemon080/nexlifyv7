import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/mockData';
import { User } from '../types';
import { Card, Button, Badge } from '../components/UI';
import { User as UserIcon, LogOut, Wallet, BookOpen, Clock, Settings } from 'lucide-react';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-[#4285F4] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-[#1E1F20]">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#E3E3E3]">{user.name}</h1>
              <p className="text-[#8E918F]">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={Settings}>Settings</Button>
            <Button variant="secondary" icon={LogOut} onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            
            {/* Wallet / Earnings */}
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

            {/* Enrolled Courses */}
            <div>
              <h3 className="text-xl font-bold text-[#E3E3E3] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#A8C7FA]" /> My Learning
              </h3>
              {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                <div className="grid gap-4">
                  {/* Mock implementation based on IDs */}
                  <Card className="p-6 flex items-center justify-between group hover:bg-[#2D2E30] transition-colors cursor-pointer" onClick={() => navigate('/classroom/c-web-dev')}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#131314] rounded-lg flex items-center justify-center text-[#A8C7FA]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#E3E3E3] group-hover:text-[#A8C7FA] transition-colors">Web Development Bootcamp</h4>
                        <p className="text-xs text-[#8E918F]">In Progress</p>
                      </div>
                    </div>
                    <Badge color="blue">Continue</Badge>
                  </Card>
                </div>
              ) : (
                <Card className="p-8 text-center border-dashed border-[#444746]">
                  <p className="text-[#8E918F] mb-4">You haven't enrolled in any courses yet.</p>
                  <Button variant="outline" onClick={() => navigate('/training')}>Browse Courses</Button>
                </Card>
              )}
            </div>
            
             {/* Tasks (Placeholder) */}
             <div>
              <h3 className="text-xl font-bold text-[#E3E3E3] mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D96570]" /> Active Tasks
              </h3>
              <Card className="p-8 text-center border-dashed border-[#444746]">
                  <p className="text-[#8E918F] mb-4">No active tasks assigned.</p>
                  <Button variant="outline" onClick={() => navigate('/earn')}>Find Work</Button>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
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
                <span className="truncate">nexlify.com/ref/{user.id}</span>
              </div>
              <Button size="sm" className="w-full">Copy Link</Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};