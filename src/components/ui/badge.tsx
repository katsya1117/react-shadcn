import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'outline' | 'destructive'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

const variantClass: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  destructive: 'bg-destructive text-white',
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => (
  <div
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
      variantClass[variant],
      className,
    )}
    {...props}
  />
)
