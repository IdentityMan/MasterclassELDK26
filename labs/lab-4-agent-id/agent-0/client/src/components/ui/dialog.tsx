import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'
import * as React from 'react'
import { createPortal } from 'react-dom'

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  id: string
}

const DialogContext = React.createContext<DialogContextValue | undefined>(
  undefined
)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog provider')
  }
  return context
}

export interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  id?: string
}

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  id = `dialog-${Math.random().toString(36).substring(2, 9)}`,
}: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      setUncontrolledOpen(newOpen)
      onOpenChange?.(newOpen)
    },
    [onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open, setOpen, id }}>
      {children}
    </DialogContext.Provider>
  )
}

export type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const { setOpen, id } = useDialogContext()

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={false}
      aria-controls={id}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'center' | 'top'
  width?: string | number
  height?: string | number
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  overlayClassName?: string
}

export function DialogContent({
  children,
  className,
  position = 'center',
  width = '28rem',
  height,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  overlayClassName,
  ...props
}: DialogContentProps) {
  const { open, setOpen, id } = useDialogContext()
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const [portalContainer, setPortalContainer] =
    React.useState<HTMLElement | null>(null)

  React.useEffect(() => {
    setPortalContainer(document.getElementById('dialog-root') || document.body)
  }, [])

  const previousActiveElement = React.useRef<Element | null>(null)

  React.useEffect(() => {
    if (!open || !closeOnEsc) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeOnEsc, setOpen])

  React.useEffect(() => {
    if (!open || !closeOnOverlayClick) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [open, closeOnOverlayClick, setOpen])

  React.useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements?.length) {
        ;(focusableElements[0] as HTMLElement).focus()
      } else {
        dialogRef.current?.focus()
      }

      document.body.style.overflow = 'hidden'
    } else {
      if (previousActiveElement.current) {
        ;(previousActiveElement.current as HTMLElement).focus?.()
      }

      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements.length) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleTabKey)
    return () => window.removeEventListener('keydown', handleTabKey)
  }, [open])

  if (!open || !portalContainer) return null

  const dialogContent = (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto',
        position === 'center' ? 'items-center' : 'items-start pt-10',
        'animate-in fade-in-0',
        overlayClassName
      )}
      aria-modal="true"
      role="dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      style={{
        isolation: 'isolate',
      }}
    >
      <div className="animate-in fade-in-0 fixed inset-0 bg-black/50 backdrop-blur-sm duration-200" />

      <div
        ref={dialogRef}
        id={id}
        className={cn(
          'bg-background border-border shadow-bevel-xl relative z-[9999] flex flex-col rounded-4xl border p-8',
          'animate-in zoom-in-95 fade-in-0 duration-200',
          'focus:outline-none',
          className
        )}
        style={{
          width,
          ...(height ? { height } : {}),
        }}
        tabIndex={-1}
        {...props}
      >
        {children}

        <Button
          variant="ghost"
          className="bg-muted absolute top-8 right-8 inline-flex h-8 w-8 items-center justify-center rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100"
          onClick={() => setOpen(false)}
          aria-label="Close dialog"
        >
          <XIcon className="size-6" />
        </Button>
      </div>
    </div>
  )

  return createPortal(dialogContent, portalContainer)
}

export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>

export function DialogHeader({
  className,
  children,
  ...props
}: DialogHeaderProps) {
  return (
    <div className={cn('mb-4 space-y-1.5', className)} {...props}>
      {children}
    </div>
  )
}

export type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export function DialogTitle({
  className,
  children,
  ...props
}: DialogTitleProps) {
  const { id } = useDialogContext()

  return (
    <h2
      id={`${id}-title`}
      className={cn('text-foreground text-xl font-semibold', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

export function DialogDescription({
  className,
  children,
  ...props
}: DialogDescriptionProps) {
  const { id } = useDialogContext()

  return (
    <p
      id={`${id}-description`}
      className={cn('text-card-foreground text-sm', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>

export function DialogFooter({
  className,
  children,
  ...props
}: DialogFooterProps) {
  return (
    <div
      className={cn(
        'mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
