import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICES_LIST, EARNING_METHODS, getCourses } from '../services/mockData';
import { Course } from '../types';
import { Button, Card, Badge } from '../components/UI';
import { 
  ArrowRight, Code, Megaphone, PenTool, FileText, 
  CheckCircle, Sparkles, Stars, Bot, GraduationCap, 
  ShoppingBag, Briefcase, Zap, Globe, ShieldCheck, 
  ZapIcon, MousePointer2, TrendingUp, PlayCircle, Clock, BookOpen, Loader2
} from 'lucide-react';
import { SEO } from '../components/SEO';

const iconMap: Record<string, any> = {
  'code': Code,
  'megaphone': Megaphone,
  'pen-tool': PenTool,
  'file-text': FileText
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [latestCourses, setLatestCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const allCourses = await getCourses();
        // Assuming courses added last are the newest, get the last 2 and reverse for display
        setLatestCourses(allCourses.slice(-2).reverse());
      } catch (error) {
        console.error("Failed to load courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  return (
    <div className="space-y-0 pb-0">
      <SEO 
        title="Nexlify - The AI-Powered Digital Ecosystem" 
        description="Master digital skills, access premium resources, hire top-tier experts, and monetize your skills in one intelligent platform."
        keywords="digital platform, freelance services, online courses, marketplace, earn money online, AI tools, Nexlify"
      />

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center pt-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#4285F4] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#9B72CB] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <Badge color="blue" className="animate-pulse">
            <div className="flex items-center gap-2 px-1 py-0.5 font-black uppercase tracking-widest text-[10px]">
              <Sparkles className="w-3 h-3" /> The Future of Digital Work is Here
            </div>
          </Badge>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 mt-10 leading-[1.05]">
            Transform Your <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570]">
              Digital Intelligence
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-[#C4C7C5] max-w-3xl mb-12 leading-relaxed font-light">
            Connect with premium digital services, master high-income skills, and access advanced AI tools built to accelerate your growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <Button size="lg" onClick={() => navigate('/hire')} icon={Stars} className="w-full sm:w-auto h-16 px-10 text-lg font-bold shadow-xl shadow-[#4285F4]/20">
              Hire Nexlify Agency
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/market')} icon={ShoppingBag} className="w-full sm:w-auto h-16 px-10 text-lg border-[#444746] bg-[#1E1F20]/50 backdrop-blur-md">
              Explore Marketplace
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl opacity-70">
             <div className="flex items-center gap-3 justify-center"><ShieldCheck className="text-[#6DD58C] w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Secure Payments</span></div>
             <div className="flex items-center gap-3 justify-center"><Globe className="text-[#A8C7FA] w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Global Talent</span></div>
             <div className="flex items-center gap-3 justify-center"><ZapIcon className="text-[#FFD97D] w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Instant Delivery</span></div>
             <div className="flex items-center gap-3 justify-center"><TrendingUp className="text-[#D96570] w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">High Success Rate</span></div>
          </div>
        </div>
      </section>

      {/* --- FOUR PILLARS SECTION --- */}
      <section className="bg-[#1E1F20]/30 py-24 border-y border-[#444746]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">One Platform. <span className="text-[#A8C7FA]">Infinite Potential.</span></h2>
              <p className="text-[#8E918F] max-w-xl mx-auto">Our ecosystem is structured to help you navigate every stage of your digital career.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Training Academy', desc: 'Master high-demand skills like Web Dev and Graphic Design through intensive bootcamps.', path: '/training', icon: GraduationCap, color: 'text-[#A8C7FA]', bgColor: 'bg-[#0842A0]' },
                { title: 'Digital Market', desc: 'Browse and buy premium templates, ebooks, and assets to fuel your projects instantly.', path: '/market', icon: ShoppingBag, color: 'text-[#9B72CB]', bgColor: 'bg-[#4A0072]' },
                { title: 'AI Tools Suite', desc: 'Leverage Gemini 3 Pro for analysis, transcription, chat, and creative workflows.', path: '/ai-tools', icon: Bot, color: 'text-[#D96570]', bgColor: 'bg-[#370007]' },
                { title: 'Earn Platform', desc: 'Monetize your skills via our freelance marketplace and lucrative referral program.', path: '/earn', icon: Zap, color: 'text-[#6DD58C]', bgColor: 'bg-[#0F5223]' }
              ].map((pillar, i) => (
                <Card key={i} className="p-8 hoverEffect group cursor-pointer border-[#444746]" onClick={() => navigate(pillar.path)}>
                   <div className={`w-12 h-12 ${pillar.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                      <pillar.icon className={`w-6 h-6 ${pillar.color}`} />
                   </div>
                   <h3 className="text-xl font-bold mb-3 group-hover:text-[#A8C7FA] transition-colors">{pillar.title}</h3>
                   <p className="text-sm text-[#8E918F] leading-relaxed mb-6">{pillar.desc}</p>
                   <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-[#A8C7FA] group-hover:translate-x-2 transition-transform">
                      Explore Page <ArrowRight className="w-3 h-3 ml-2" />
                   </div>
                </Card>
              ))}
           </div>
        </div>
      </section>

      {/* --- TRAINING ACADEMY PREVIEW --- */}
      <section className="bg-[#131314] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="max-w-2xl">
                 <h2 className="text-4xl md:text-5xl font-bold text-[#E3E3E3] mb-6">Nexlify <span className="text-[#6DD58C]">Academy</span></h2>
                 <p className="text-lg text-[#C4C7C5] font-light">Stop watching random tutorials. Join structured bootcamps led by industry experts and earn your certification.</p>
              </div>
              <Button variant="outline" icon={ArrowRight} onClick={() => navigate('/training')}>View All Courses</Button>
           </div>
           
           <div className="grid md:grid-cols-2 gap-10">
              {loadingCourses ? (
                <div className="md:col-span-2 flex justify-center py-20">
                   <Loader2 className="w-8 h-8 animate-spin text-[#6DD58C]" />
                </div>
              ) : latestCourses.length > 0 ? (
                latestCourses.map((course) => (
                  <Card key={course.id} className="p-0 overflow-hidden group border-[#444746] hoverEffect">
                    <div className="h-64 relative">
                        <img src={course.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={course.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#131314] to-transparent"></div>
                        <div className="absolute bottom-6 left-6 flex gap-2">
                           <Badge color="blue" className="bg-[#0842A0] border-0">{course.level}</Badge>
                           <Badge color="green" className="bg-[#0F5223] border-0">Newly Added</Badge>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex items-center gap-4 text-xs text-[#8E918F] mb-4">
                           <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</div>
                           <div className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course.modules.length} Modules</div>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 text-[#E3E3E3]">{course.title}</h3>
                        <p className="text-sm text-[#8E918F] leading-relaxed mb-6 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                           <div className="text-[#6DD58C] font-black">₦{course.price.toLocaleString()}</div>
                           <Button size="sm" onClick={() => navigate(`/training/${course.id}`)}>Learn More</Button>
                        </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-20 text-[#8E918F]">
                   No courses available at the moment.
                </div>
              )}
           </div>
        </div>
      </section>

      {/* --- SERVICES / AGENCY SECTION --- */}
      <section className="bg-[#1E1F20]/50 py-24 border-y border-[#444746]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold text-[#E3E3E3] mb-6">Nexlify <span className="text-[#A8C7FA]">Agency</span></h2>
              <p className="text-[#8E918F] max-w-2xl mx-auto text-lg leading-relaxed">Let our expert team handle your project. We deliver high-end digital solutions for businesses worldwide.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {SERVICES_LIST.map((service) => {
                const Icon = iconMap[service.iconName] || Code;
                return (
                  <Card key={service.id} className="p-10 hoverEffect group border-t-4 border-t-transparent hover:border-t-[#A8C7FA] bg-[#131314]">
                    <div className="w-16 h-16 bg-[#1E1F20] rounded-2xl flex items-center justify-center mb-8 border border-[#444746] group-hover:border-[#A8C7FA]/50 transition-colors shadow-lg">
                      <Icon className="w-8 h-8 text-[#A8C7FA]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#E3E3E3] mb-4">{service.title}</h3>
                    <p className="text-[#8E918F] text-sm leading-relaxed mb-8">{service.description}</p>
                    <button onClick={() => navigate('/hire')} className="text-xs font-black uppercase tracking-widest text-[#A8C7FA] hover:underline flex items-center">
                       Request Service <MousePointer2 className="w-3 h-3 ml-2" />
                    </button>
                  </Card>
                );
              })}
           </div>
           
           <div className="mt-20 p-10 bg-[#131314] rounded-[32px] border border-[#444746] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-[#6DD58C]/10 rounded-full flex items-center justify-center"><Briefcase className="w-8 h-8 text-[#6DD58C]" /></div>
                 <div>
                    <h4 className="text-xl font-bold text-[#E3E3E3]">Ready for your next big move?</h4>
                    <p className="text-[#8E918F] text-sm mt-1">Start a conversation with our project managers today.</p>
                 </div>
              </div>
              <Button size="lg" icon={Briefcase} onClick={() => navigate('/hire')}>Request a Quote</Button>
           </div>
        </div>
      </section>

      {/* --- EARN SECTION SNEAK PEEK --- */}
      <section className="py-24 overflow-hidden relative">
         <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#0F5223] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
               <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
                  {EARNING_METHODS.map((method, idx) => (
                    <Card key={idx} className={`p-6 border-[#444746] bg-[#1E1F20]/50 ${idx === 1 ? 'mt-8' : ''}`}>
                       <Badge color="green" className="mb-4">Earn</Badge>
                       <h4 className="text-lg font-bold mb-2">{method.title}</h4>
                       <p className="text-[10px] text-[#8E918F] uppercase tracking-widest mb-4">Potential: {method.potential}</p>
                       <p className="text-xs text-[#C4C7C5] leading-relaxed line-clamp-3">{method.description}</p>
                    </Card>
                  ))}
               </div>
               
               <div className="order-1 lg:order-2">
                  <Badge color="green" className="mb-6"><Zap className="w-3 h-3 mr-1" /> Passive Income Engine</Badge>
                  <h2 className="text-4xl md:text-6xl font-bold text-[#E3E3E3] mb-8 leading-tight">Turn Your Skills into <br/> <span className="text-[#6DD58C]">Daily Revenue.</span></h2>
                  <p className="text-lg text-[#C4C7C5] mb-10 leading-relaxed font-light">
                     Nexlify isn't just a place to spend; it's a place to grow your wealth. From completing micro-tasks to referring new users, we provide multiple pathways for digital earning.
                  </p>
                  <div className="space-y-6 mb-12">
                     <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-[#131314] rounded-full flex items-center justify-center border border-[#444746] text-[#6DD58C] font-bold text-sm">1</div>
                        <p className="text-sm font-medium text-[#8E918F]">Register an active account</p>
                     </div>
                     <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-[#131314] rounded-full flex items-center justify-center border border-[#444746] text-[#6DD58C] font-bold text-sm">2</div>
                        <p className="text-sm font-medium text-[#8E918F]">Choose your earning method (Referral/Freelance)</p>
                     </div>
                     <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-[#131314] rounded-full flex items-center justify-center border border-[#444746] text-[#6DD58C] font-bold text-sm">3</div>
                        <p className="text-sm font-medium text-[#8E918F]">Withdraw earnings instantly to your local bank</p>
                     </div>
                  </div>
                  <Button variant="secondary" className="bg-[#6DD58C] text-[#0F5223] px-10 h-14" onClick={() => navigate('/earn')}>Start Earning Now</Button>
               </div>
            </div>
         </div>
      </section>
      
      {/* --- FINAL CTA SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-gradient-to-br from-[#1E1F20] to-[#131314] rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden border border-[#444746]">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#4285F4] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-7xl font-bold mb-8 text-[#E3E3E3] tracking-tighter">Your Digital Journey <br/>Starts Here.</h2>
            <p className="text-[#C4C7C5] mb-12 max-w-2xl mx-auto text-lg md:text-2xl font-light">
              Join 5,000+ digital professionals already building their future on Nexlify.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button size="lg" className="h-16 px-12 text-lg shadow-2xl shadow-[#A8C7FA]/20" onClick={() => navigate('/register')}>
                Create Free Account
              </Button>
              <Button variant="outline" size="lg" className="h-16 px-12 text-lg backdrop-blur-xl" onClick={() => navigate('/market')}>
                Browse Marketplace
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
