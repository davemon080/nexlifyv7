import React from 'react';
import { EARNING_METHODS } from '../services/mockData';
import { Card, Button, Badge } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users, Briefcase, MousePointer, ArrowRight, Zap } from 'lucide-react';

export const Earn: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#1E1F20] py-24 px-4 border-b border-[#444746]">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#0F5223] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge color="green"><div className="flex items-center gap-2"><Zap className="w-3 h-3" /> Start Earning Now</div></Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-8 mt-6 text-[#E3E3E3]">Monetize Your <br/> <span className="text-[#6DD58C]">Time & Skills</span></h1>
          <p className="text-xl text-[#C4C7C5] max-w-3xl mx-auto mb-12 leading-relaxed">
            Join thousands of users who are earning money daily with Nexlify through simple tasks, referrals, and freelance gigs.
          </p>
          <Button size="lg" className="bg-[#6DD58C] text-[#0F5223] hover:bg-[#85E0A3] px-10" onClick={() => navigate('/hire')}>
            Register to Earn
          </Button>
        </div>
      </div>

      {/* Methods */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-[#E3E3E3] text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {EARNING_METHODS.map((method, idx) => (
            <Card key={method.id} className="p-10 hoverEffect border-t-4 border-t-transparent hover:border-t-[#6DD58C]">
              <div className="w-16 h-16 bg-[#0F5223] rounded-2xl flex items-center justify-center mb-8 border border-[#6DD58C]/30">
                {idx === 0 ? <Users className="w-8 h-8 text-[#6DD58C]" /> : 
                 idx === 1 ? <Briefcase className="w-8 h-8 text-[#6DD58C]" /> : 
                 <MousePointer className="w-8 h-8 text-[#6DD58C]" />}
              </div>
              <h3 className="text-2xl font-bold text-[#E3E3E3] mb-4">{method.title}</h3>
              <p className="text-[#C4C7C5] mb-6 h-20 leading-relaxed text-sm">{method.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <Badge color="green">Potential: {method.potential}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats/Trust */}
      <div className="bg-[#1E1F20] py-20 border-y border-[#444746]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="p-4">
              <div className="text-5xl font-bold text-[#A8C7FA] mb-3">5K+</div>
              <div className="text-[#8E918F] uppercase tracking-wider text-sm">Active Earners</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-bold text-[#6DD58C] mb-3">₦50M+</div>
              <div className="text-[#8E918F] uppercase tracking-wider text-sm">Paid Out</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-bold text-[#D96570] mb-3">200+</div>
              <div className="text-[#8E918F] uppercase tracking-wider text-sm">Projects Completed</div>
            </div>
            <div className="p-4">
              <div className="text-5xl font-bold text-[#9B72CB] mb-3">24/7</div>
              <div className="text-[#8E918F] uppercase tracking-wider text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <Card className="p-16 bg-gradient-to-br from-[#1E1F20] to-[#131314] border border-[#444746]">
          <div className="w-20 h-20 bg-[#5B4300] rounded-full flex items-center justify-center mx-auto mb-8 border border-[#FFD97D]/30">
            <DollarSign className="w-10 h-10 text-[#FFD97D]" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-[#E3E3E3]">Start Your Earning Journey</h2>
          <p className="text-[#C4C7C5] mb-12 text-xl max-w-2xl mx-auto">
            Create an account today and get access to exclusive tasks and freelance opportunities immediately.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-[#A8C7FA] text-[#062E6F] hover:bg-[#C2D9FC]" icon={ArrowRight}>
              Create Account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};