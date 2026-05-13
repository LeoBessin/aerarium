import * as React from 'react'
import { cn } from '@/lib/utils'

export const Badge = ({
  className,
  color,
  children,
}: {
  className?: string
  color?: string
  children: React.ReactNode
}) => (
  <span
    className={cn(
      'inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium',
      className
    )}
    style={
      color
        ? { backgroundColor: `${color}20`, color, borderColor: `${color}30`, border: '1px solid' }
        : { backgroundColor: '#5e6ad220', color: '#5e6ad2', border: '1px solid #5e6ad230' }
    }
  >
    {children}
  </span>
)
