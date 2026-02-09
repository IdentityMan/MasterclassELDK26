import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'bg-input-background placeholder:text-muted-foreground flex w-full rounded-lg px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'shadow-input-resting text-input-foreground focus:shadow-input-focus focus:outline-hidden disabled:opacity-50',
        error:
          'shadow-input-error-resting text-input-error-foreground hover:shadow-input-error-hover focus:shadow-input-error-focus focus:outline-hidden',
      },
      size: {
        default: 'h-9 px-3 py-2',
        sm: 'h-8 rounded-md px-2 text-xs',
        md: 'h-10 rounded-md px-3',
        lg: 'h-10 rounded-md px-4',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: boolean
  helperText?: string
  size?: VariantProps<typeof inputVariants>['size']
  variant?: VariantProps<typeof inputVariants>['variant']
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      error,
      helperText,
      startAdornment,
      endAdornment,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative w-full">
        {startAdornment && (
          <div className="absolute top-1/2 left-1 -translate-y-1/2">
            {startAdornment}
          </div>
        )}
        <input
          className={cn(
            inputVariants({ variant: error ? 'error' : variant, size }),
            startAdornment && 'pl-10',
            endAdornment && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {endAdornment && (
          <div className="absolute top-1/2 right-1 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
        {helperText && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error
                ? 'text-[hsl(var(--input-error-helper))]'
                : 'text-muted-foreground'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }
