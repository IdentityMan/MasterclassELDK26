import { cn } from '@/lib/utils'
import { Label } from '@/components/ui'
import { Check, Minus } from 'lucide-react'
import * as React from 'react'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      indeterminate,
      disabled,
      checked,
      defaultChecked,
      onChange,
      id,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState(
      defaultChecked || checked || false
    )
    const uniqueId = React.useId()
    const checkboxId = id || uniqueId

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked)
      }
    }, [checked])

    React.useEffect(() => {
      const input = ref && 'current' in ref ? ref.current : null
      if (input) {
        input.indeterminate = indeterminate || false
      }
    }, [indeterminate, ref])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked
      setIsChecked(newChecked)
      if (onChange) {
        onChange(event)
      }
    }

    return (
      <div
        className={cn(
          'relative flex cursor-pointer items-center',
          disabled && 'cursor-not-allowed'
        )}
      >
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            ref={ref}
            id={checkboxId}
            name={checkboxId}
            checked={isChecked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            disabled={disabled}
            aria-label={ariaLabel || label || 'Checkbox'}
            aria-checked={isChecked}
            className={cn(
              'shadow-checkbox-resting peer size-5 cursor-pointer appearance-none rounded-md border border-gray-900/40 transition-all',
              'hover:shadow-checkbox-hover hover:border-gray-900/60',
              'checked:border-gray-900 checked:bg-gray-900',
              'focus:shadow-checkbox-focus',
              disabled && 'cursor-not-allowed border-gray-200 bg-gray-50',
              className
            )}
            {...props}
          />
          {!indeterminate && isChecked && (
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
              aria-hidden="true"
            >
              <Check className="size-3 stroke-[4px]" absoluteStrokeWidth />
            </span>
          )}
          {indeterminate && (
            <span
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
              aria-hidden="true"
            >
              <Minus className="size-3 stroke-[4px]" absoluteStrokeWidth />
            </span>
          )}
        </div>
        {label && (
          <Label
            htmlFor={checkboxId}
            className={cn(
              'ml-2 cursor-pointer text-sm text-slate-600',
              disabled && 'cursor-not-allowed text-gray-500'
            )}
          >
            {label}
          </Label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
