import React, { useState } from 'react';
import { submitInquiry } from '../services/mockData';
import { Button, Input, Textarea, Card } from '../components/UI';
import { SERVICES_LIST } from '../services/mockData';
import { CheckCircle, Send, MessageCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export const Hire: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    serviceType: SERVICES_LIST[0].title,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitInquiry(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', serviceType: SERVICES_LIST[0].title, message: '' });
    } catch (error) {
      console.error(error);
      alert('Failed to send inquiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <SEO title="Request Received | Nexlify" />
        <Card className="max-w-md w-full p-10 text-center bg-[#1E1F20]">
          <div className="w-20 h-20 bg-[#0F5223] rounded-full flex items-center justify-center mx-auto mb-8 border border-[#6DD58C]/30">
            <CheckCircle className="w-10 h-10 text-[#6DD58C]" />
          </div>
          <h2 className="text-3xl font-bold text-[#E3E3E3] mb-4">Request Received!</h2>
          <p className="text-[#C4C7C5] mb-10 text-lg">
            Thank you for reaching out. Our team will review your project details and get back to you within 24 hours.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Send Another Request
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Hire Us - Digital Agency Services" 
        description="Looking for web development, branding, or digital marketing services? Hire Nexlify experts to bring your vision to life."
        keywords="hire developers, digital agency, web design service, marketing agency, nexlify hire"
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#E3E3E3] mb-6">Hire Us</h1>
          <p className="text-xl text-[#C4C7C5] max-w-2xl mx-auto">
            Got a project in mind? Fill out the form below and let's bring your vision to life.
          </p>
        </div>

        <Card className="p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#4285F4]/5 blur-[80px] rounded-full pointer-events-none"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">Service Required</label>
              <div className="relative">
                <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    className="w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] outline-none appearance-none transition-all"
                >
                    {SERVICES_LIST.map(service => (
                    <option key={service.id} value={service.title} className="bg-[#1E1F20]">{service.title}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#C4C7C5]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                </div>
              </div>
            </div>

            <Textarea
              label="Project Details"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              placeholder="Tell us about your project goals, timeline, and budget..."
              required
            />

            <div className="pt-6">
              <Button type="submit" size="lg" className="w-full text-lg" isLoading={loading} icon={Send}>
                Submit Request
              </Button>
            </div>
            
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#444746]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1E1F20] text-[#8E918F]">Or connect via</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.open('https://wa.me/2348167240880', '_blank')}
              className="w-full flex items-center justify-center px-4 py-3 border border-[#444746] rounded-full text-[#C4C7C5] bg-[#131314] hover:bg-[#2D2E30] transition-all duration-200 font-medium"
            >
              <MessageCircle className="w-5 h-5 text-[#6DD58C] mr-2" />
              Chat on WhatsApp
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};