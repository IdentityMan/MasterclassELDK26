import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'

const textareaVariants = cva(
  'bg-input-background placeholder:text-muted-foreground flex w-full rounded-lg px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'shadow-input-resting text-input-foreground focus:shadow-input-focus focus:outline-hidden disabled:opacity-50',
        error:
          'shadow-input-error-resting text-input-error-foreground hover:shadow-input-error-hover focus:shadow-input-error-focus focus:outline-hidden',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  error?: boolean
  helperText?: string
  variant?: VariantProps<typeof textareaVariants>['variant']
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
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
          <div className="absolute top-1/2 left-3 -translate-y-1/2">
            {startAdornment}
          </div>
        )}
        <textarea
          className={cn(
            textareaVariants({ variant: error ? 'error' : variant }),
            startAdornment && 'pl-10',
            endAdornment && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {endAdornment && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
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
Textarea.displayName = 'Textarea'

export { Textarea }
