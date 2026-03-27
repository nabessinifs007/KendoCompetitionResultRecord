import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  ...props
}: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = variant === 'ghost' ? 'btn-ghost' : `btn-${variant}`;
  
  const sizeClasses = {
    sm: 'text-sm py-1 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-3 px-6',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  // Quick fallback style since ghost isn't in index.css
  const customGhostStyle = variant === 'ghost' ? {
    background: 'transparent',
    color: 'inherit',
    border: '1px solid transparent'
  } : {};

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClasses[size]} ${widthClass} ${className}`}
      style={variant === 'ghost' ? { ...customGhostStyle, ...props.style } : props.style}
      {...props}
    >
      {children}
    </button>
  );
}
