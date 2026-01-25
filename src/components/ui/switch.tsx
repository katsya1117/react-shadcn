import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const Switch = ({ className, ...props }: SwitchProps) => (
  <label className={cn('relative inline-flex cursor-pointer items-center', className)}>
    <input type="checkbox" className="peer sr-only" {...props} />
    <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-primary transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring/80" />
    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4" />
  </label>
)
