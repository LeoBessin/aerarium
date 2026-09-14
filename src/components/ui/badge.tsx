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
      'chip inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium',
      className
    )}
    style={{ '--chip': color ?? 'rgb(var(--accent))' } as React.CSSProperties}
  >
    {children}
  </span>
)
