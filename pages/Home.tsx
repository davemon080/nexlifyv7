import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICES_LIST } from '../services/mockData';
import { Button, Card, Badge } from '../components/UI';
import { ArrowRight, Code, Megaphone, PenTool, FileText, CheckCircle, Sparkles, Stars } from 'lucide-react';

const iconMap: Record<string, any> = {
  'code': Code,
  'megaphone': Megaphone,
  'pen-tool': PenTool,
  'file-text': FileText
};

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[500px] bg-[#4285F4] opacity-20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[400px] md:w-[600px] h-[400px] bg-[#9B72CB] opacity-10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col items-center text-center">
          <Badge color="blue" ><div className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Introducing Nexlify AI</div></Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 mt-8 leading-tight">
            The Hub for Digital <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570]">
              Intelligence & Growth
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-[#C4C7C5] max-w-2xl mb-10 md:mb-12 leading-relaxed">
            Connect with top-tier digital services, access premium resources, and unlock opportunities to earn. Built for the future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full sm:w-auto">
            <Button size="lg" onClick={() => navigate('/hire')} icon={Stars} className="w-full sm:w-auto">
              Hire an Expert
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/market')} className="w-full sm:w-auto">
              Explore Marketplace
            </Button>
          </div>

          {/* Abstract Visual */}
          <div className="mt-16 md:mt-20 relative w-full max-w-4xl mx-auto h-56 md:h-96 rounded-[24px] md:rounded-[32px] overflow-hidden border border-[#444746] shadow-2xl bg-[#1E1F20]">
             <div className="absolute inset-0 bg-gradient-to-br from-[#1E1F20] to-[#131314]"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 md:gap-8 opacity-30 transform -rotate-12 scale-110">
                   {[...Array(9)].map((_, i) => (
                     <div key={i} className="w-20 h-20 md:w-32 md:h-32 rounded-xl md:rounded-2xl bg-[#444746]/30 backdrop-blur-md"></div>
                   ))}
                </div>
             </div>
             <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="text-left">
                  <div className="text-[10px] md:text-xs font-mono text-[#A8C7FA] mb-1 md:mb-2">SYSTEM_STATUS: ONLINE</div>
                  <div className="text-lg md:text-2xl font-bold text-white">Next Generation Platform</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#E3E3E3]">Our Expertise</h2>
          <p className="mt-4 text-[#C4C7C5] text-lg">Comprehensive digital solutions tailored to your needs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES_LIST.map((service) => {
            const Icon = iconMap[service.iconName] || Code;
            return (
              <Card key={service.id} className="p-8 hoverEffect group border-t-4 border-t-transparent hover:border-t-[#A8C7FA]">
                <div className="w-14 h-14 bg-[#131314] rounded-2xl flex items-center justify-center mb-6 border border-[#444746] group-hover:border-[#A8C7FA]/50 transition-colors">
                  <Icon className="w-7 h-7 text-[#A8C7FA]" />
                </div>
                <h3 className="text-xl font-bold text-[#E3E3E3] mb-3">{service.title}</h3>
                <p className="text-[#8E918F] text-sm leading-relaxed">{service.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Features Split Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="bg-[#1E1F20] rounded-[32px] md:rounded-[40px] border border-[#444746] p-8 md:p-16 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#4285F4]/10 blur-[80px] md:blur-[100px] rounded-full pointer-events-none"></div>
           
           <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#E3E3E3] mb-8">Learn, Earn, and Succeed</h2>
              <div className="space-y-6 md:space-y-8">
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-[#A8C7FA]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#E3E3E3]">Premium Resources</h3>
                    <p className="text-[#C4C7C5] mt-1 md:mt-2 leading-relaxed text-sm md:text-base">Access high-quality ebooks, templates, and courses to upgrade your skills.</p>
                  </div>
                </div>
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-[#A8C7FA]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#E3E3E3]">Earning Opportunities</h3>
                    <p className="text-[#C4C7C5] mt-1 md:mt-2 leading-relaxed text-sm md:text-base">Monetize your skills through our freelance marketplace or affiliate program.</p>
                  </div>
                </div>
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-[#A8C7FA]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#E3E3E3]">Verified Talent</h3>
                    <p className="text-[#C4C7C5] mt-1 md:mt-2 leading-relaxed text-sm md:text-base">Clients get access to a vetted pool of professionals ready to work.</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 md:mt-12">
                <Button variant="secondary" onClick={() => navigate('/earn')} icon={ArrowRight} className="w-full md:w-auto">
                  Start Earning Today
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[#444746] shadow-2xl">
                 <img 
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
                    alt="Team working together" 
                    className="w-full object-cover h-[300px] md:h-[500px] opacity-80 hover:opacity-100 transition-opacity duration-500"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#131314] to-transparent"></div>
                 <div className="absolute bottom-6 left-6">
                    <Badge color="purple">Community Driven</Badge>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-[32px] md:rounded-[40px] p-8 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4] to-[#9B72CB] opacity-10"></div>
          <div className="absolute inset-0 border border-[#A8C7FA]/20 rounded-[32px] md:rounded-[40px]"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 text-[#E3E3E3]">Ready to Transform Your <br/>Digital Journey?</h2>
            <p className="text-[#C4C7C5] mb-8 md:mb-10 max-w-2xl mx-auto text-lg md:text-xl">
              Whether you need a website, want to learn a new skill, or are looking to earn extra income, Nexlify is your destination.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6">
              <Button size="lg" className="w-full sm:w-auto px-10 py-4 text-lg" onClick={() => navigate('/hire')}>
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};