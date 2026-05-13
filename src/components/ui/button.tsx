import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-accent text-white hover:bg-accent-hover': variant === 'default',
            'bg-transparent text-text-secondary hover:bg-surface-overlay hover:text-text-primary': variant === 'ghost',
            'bg-transparent border border-border text-text-secondary hover:border-border-strong hover:text-text-primary': variant === 'outline',
            'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20': variant === 'danger',
            'bg-success/10 text-success border border-success/20 hover:bg-success/20': variant === 'success',
          },
          {
            'h-7 px-2.5 text-xs': size === 'sm',
            'h-8 px-3 text-sm': size === 'md',
            'h-9 px-4 text-sm': size === 'lg',
            'h-8 w-8 p-0': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
