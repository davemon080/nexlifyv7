import React from 'react';
import { LucideIcon } from 'lucide-react';

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
  
  // Google AI / Material 3 Dark colors
  const variants = {
    primary: "bg-[#A8C7FA] text-[#062E6F] hover:bg-[#8AB4F8] hover:shadow-[0_0_15px_rgba(168,199,250,0.3)] focus:ring-[#A8C7FA]",
    secondary: "bg-[#444746] text-[#E3E3E3] hover:bg-[#5E5E5E] focus:ring-[#8E918F]",
    outline: "border border-[#8E918F] text-[#E3E3E3] hover:bg-[#444746]/30 hover:border-[#E3E3E3] focus:ring-[#A8C7FA]",
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
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
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
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, ...props }) => {
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
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: "bg-[#0842A0] text-[#D3E3FD] border border-[#A8C7FA]/30",
    green: "bg-[#0F5223] text-[#C4EED0] border border-[#6DD58C]/30",
    yellow: "bg-[#5B4300] text-[#FFDF99] border border-[#FFD97D]/30",
    red: "bg-[#8C1D18] text-[#F9DEDC] border border-[#F2B8B5]/30",
    purple: "bg-[#4A0072] text-[#EDBEF7] border border-[#D0BCFF]/30"
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};