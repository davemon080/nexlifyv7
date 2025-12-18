import React, { useEffect, useState } from 'react';
import { LucideIcon, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  isLoading,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#131314] disabled:opacity-50 disabled:cursor-not-allowed rounded-full tracking-wide";
  
  const variants = {
    primary: "bg-[#A8C7FA] text-[#062E6F] hover:bg-[#8AB4F8] hover:shadow-[0_0_15px_rgba(168,199,250,0.3)] focus:ring-[#A8C7FA]",
    secondary: "bg-[#444746] text-[#E3E3E3] hover:bg-[#5E5E5E] focus:ring-[#8E918F]",
    outline: "border border-[#444746] text-[#E3E3E3] hover:bg-[#444746]/30 hover:border-[#E3E3E3] focus:ring-[#A8C7FA]",
    ghost: "text-[#A8C7FA] hover:bg-[#A8C7FA]/10",
    danger: "bg-[#CF6679] text-[#370007] hover:bg-[#B00020] hover:text-white focus:ring-[#CF6679]"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">{label}</label>}
      <input
        className={`w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all outline-none ${error ? 'border-[#CF6679] focus:border-[#CF6679] focus:ring-[#CF6679]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#CF6679] ml-1">{error}</p>}
    </div>
  );
};

// Textarea Component
export const Textarea: React.FC<any> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-[#C4C7C5] mb-2 ml-1">{label}</label>}
      <textarea
        className={`w-full rounded-2xl bg-[#1E1F20] border border-[#444746] px-5 py-3 text-[#E3E3E3] placeholder-[#8E918F] focus:border-[#A8C7FA] focus:ring-1 focus:ring-[#A8C7FA] transition-all outline-none ${error ? 'border-[#CF6679] focus:border-[#CF6679] focus:ring-[#CF6679]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#CF6679] ml-1">{error}</p>}
    </div>
  );
};

// Card Component
export const Card: React.FC<any> = ({ children, className = '', hoverEffect = false, ...props }) => {
  return (
    <div 
      className={`bg-[#1E1F20] rounded-[24px] border border-[#444746] overflow-hidden ${hoverEffect ? 'hover:bg-[#2D2E30] hover:border-[#5E5E5E] transition-all duration-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Badge Component
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'; className?: string }> = ({ children, color = 'blue', className = '' }) => {
  const colors = {
    blue: "bg-[#0842A0] text-[#D3E3FD] border border-[#A8C7FA]/30",
    green: "bg-[#0F5223] text-[#C4EED0] border border-[#6DD58C]/30",
    yellow: "bg-[#5B4300] text-[#FFDF99] border border-[#FFD97D]/30",
    red: "bg-[#8C1D18] text-[#F9DEDC] border border-[#F2B8B5]/30",
    purple: "bg-[#4A0072] text-[#EDBEF7] border border-[#D0BCFF]/30"
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

// --- NEW POPUP COMPONENTS ---

export const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#6DD58C]" />,
    error: <AlertCircle className="w-5 h-5 text-[#CF6679]" />,
    info: <Info className="w-5 h-5 text-[#A8C7FA]" />
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md px-4 animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-[#1E1F20] border border-[#444746] rounded-2xl p-4 shadow-2xl flex items-center gap-4">
        <div className="shrink-0">{icons[type]}</div>
        <p className="flex-1 text-sm font-medium text-[#E3E3E3]">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-[#131314] rounded-lg text-[#8E918F] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const Dialog: React.FC<{ 
  title: string; 
  message: string; 
  type?: 'alert' | 'confirm' | 'prompt';
  confirmText?: string;
  cancelText?: string;
  onConfirm: (val?: string) => void; 
  onCancel: () => void;
}> = ({ title, message, type = 'alert', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-md w-full p-8 bg-[#1E1F20] border-[#444746] shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-[#E3E3E3] mb-3">{title}</h3>
        <p className="text-[#C4C7C5] text-sm mb-6 leading-relaxed">{message}</p>
        
        {type === 'prompt' && (
          <Input 
            autoFocus 
            className="mb-6" 
            value={inputVal} 
            onChange={e => setInputVal(e.target.value)}
            placeholder="Type here..." 
          />
        )}

        <div className="flex justify-end gap-3">
          {(type === 'confirm' || type === 'prompt') && (
            <Button variant="outline" onClick={onCancel}>{cancelText}</Button>
          )}
          <Button 
            variant={type === 'confirm' ? 'primary' : 'primary'} 
            onClick={() => onConfirm(type === 'prompt' ? inputVal : undefined)}
          >
            {confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#A8C7FA', '#6DD58C', '#D0BCFF', '#FFD97D', '#F2B8B5'];
    const newParticles = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 3,
      rotate: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[500] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: 0.8,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
