import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'signal' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'signal',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 rounded-md gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-lg gap-2",
    lg: "text-base px-5 py-3 rounded-xl gap-2.5 font-semibold",
    xl: "text-lg px-7 py-4 rounded-xl gap-3 font-bold tracking-tight",
  };

  const variantStyles = {
    signal: "bg-signal text-white hover:bg-signal-light active:bg-signal-dark shadow-signal-glow font-semibold",
    secondary: "bg-ink-800 text-ink-100 hover:bg-ink-700 active:bg-ink-600 border border-ink-700/60",
    ghost: "text-ink-300 hover:text-white hover:bg-ink-800/60 active:bg-ink-800",
    outline: "border border-ink-600/80 text-ink-200 hover:border-ink-400 hover:text-white hover:bg-ink-800/40",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 active:bg-red-500/30",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
