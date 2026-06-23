'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all duration-150 cursor-pointer',
  danger: 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all duration-150 cursor-pointer',
}

const sizeClasses = {
  sm: 'text-xs px-3 py-1.5',
  md: '',
  lg: 'text-base px-5 py-3',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantClasses[variant]} ${size !== 'md' ? sizeClasses[size] : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export { Button }
