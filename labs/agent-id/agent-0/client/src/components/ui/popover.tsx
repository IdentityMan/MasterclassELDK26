import { cn } from '@/lib/utils'
import * as React from 'react'

export interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  width?: string | number
}

export function Popover({
  children,
  content,
  open: controlledOpen,
  onOpenChange,
  className,
  align = 'start',
  sideOffset = 4,
  width,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [triggerWidth, setTriggerWidth] = React.useState<number>(0)

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      setUncontrolledOpen(newOpen)
      onOpenChange?.(newOpen)
    },
    [onOpenChange]
  )

  React.useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const updateWidth = () => {
      const width = trigger.getBoundingClientRect().width
      setTriggerWidth(width)
    }

    updateWidth()

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(trigger)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !triggerRef.current?.contains(event.target as Node) &&
        !contentRef.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [open, setOpen])

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={triggerRef} className="w-full" onClick={handleTriggerClick}>
        {children}
      </div>
      {open && (
        <div
          ref={contentRef}
          className={cn(
            'bg-popover-background text-popover-foreground border-border shadow-bevel-xl absolute z-50 overflow-hidden rounded-2xl border',

            'animate-in fade-in-0 zoom-in-95 translate-y-1',
            {
              'left-0': align === 'start',
              'left-1/2 -translate-x-1/2': align === 'center',
              'right-0': align === 'end',
            },
            className
          )}
          style={{
            top: `calc(100% + ${sideOffset}px)`,
            width: width || triggerWidth || '100%',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
