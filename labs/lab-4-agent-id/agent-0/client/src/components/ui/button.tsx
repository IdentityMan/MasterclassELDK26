import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { Spinner } from '@/components/ui'
import { cn } from '@/lib/utils'

export type ButtonState = 'default' | 'loading'

export type ButtonAlignment = 'space-between' | 'center' | 'left' | 'right'

export type ButtonSize = 'default' | 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants = cva(
  'focus-visible:ring-ring focus-visible:ring-ring inline-flex cursor-pointer items-center justify-between gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-hidden focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-btn-primary text-primary-foreground shadow-btn-primary-resting hover:shadow-btn-primary-hover hover:bg-btn-primary-hover focus:shadow-btn-primary-focus',
        destructive:
          'bg-btn-destructive text-btn-destructive-foreground shadow-btn-destructive-resting hover:shadow-btn-destructive-hover hover:bg-btn-destructive-hover focus:shadow-btn-destructive-focus fill-black',
        outline:
          'bg-btn-outlined text-btn-outlined-foreground shadow-btn-outlined-resting hover:shadow-btn-outlined-hover hover:bg-btn-outlined-hover focus:shadow-btn-outlined-focus',
        ghost:
          'bg-btn-ghost text-btn-ghost-foreground hover:bg-btn-ghost-hover focus:shadow-btn-ghost-focus',
        link: 'text-primary p-0 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 rounded-full px-3 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        md: 'h-10 rounded-md px-8',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
      state: {
        default: '',
        loading: 'cursor-wait opacity-70',
      },
      alignment: {
        'space-between': 'justify-between',
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
      alignment: 'center',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  size?: ButtonSize
  state?: ButtonState
  alignment?: ButtonAlignment
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      state,
      alignment,
      startIcon,
      endIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, alignment, className }))}
        {...props}
      >
        {state === 'loading' ? <Spinner /> : variant !== 'link' && startIcon}
        <span className="w-full px-0.5">{children}</span>
        {variant !== 'link' && endIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
