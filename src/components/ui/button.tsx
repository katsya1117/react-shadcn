import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant?: Variant
  size?: Size
}

const variantClass: Record<Variant, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm focus-visible:ring-2 focus-visible:ring-primary',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-secondary',
  outline:
    'border border-border bg-background hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring',
  ghost: 'hover:bg-muted/60',
  destructive:
    'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10 p-0',
}

export const Button = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
      variantClass[variant],
      sizeClass[size],
      className,
    )}
    {...props}
  />
)
