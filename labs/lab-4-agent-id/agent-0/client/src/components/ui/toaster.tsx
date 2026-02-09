import { Check, Info, AlertCircle, X } from 'lucide-react'
import {
  toast as hotToast,
  ToastOptions,
  Toast as HotToast,
  useToaster,
} from 'react-hot-toast'
import { cn } from '@/lib/utils'
import React, {
  ReactNode,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react'

type CustomToast = HotToast & {
  title?: string
  customMessage?: ReactNode
}

interface ToastComponentProps {
  toast: CustomToast
  onDismiss: () => void
}

const ToastComponent = ({ toast: t, onDismiss }: ToastComponentProps) => {
  const isError = t.type === 'error'
  const isSuccess = t.type === 'success'
  const isLoading = t.type === 'loading'
  const isCustom = !isError && !isSuccess && !isLoading && t.icon
  const toastRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = toastRef.current
    if (element && t.visible) {
      element.style.opacity = '0'
      element.style.transform = 'translateY(16px) scale(0.98)'

      void element.offsetWidth

      element.style.transition =
        'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)'
      element.style.opacity = '1'
      element.style.transform = 'translateY(0) scale(1)'
    }
  }, [t.visible])

  // Swipe to dismiss functionality
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const touch = 'touches' in e ? e.touches[0] : e
      setStartX(touch.clientX)
      setStartY(touch.clientY)
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!startX || !startY) return

      const touch = 'touches' in e ? e.touches[0] : e
      const dx = touch.clientX - startX
      const dy = touch.clientY - startY

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
        setOffsetX(dx)
        setOffsetY(0)
      }

      e.preventDefault()
    },
    [startX, startY]
  )

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) >= 80) {
      const element = toastRef.current
      if (element) {
        const direction = offsetX > 0 ? 1 : -1
        element.style.transition =
          'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 100ms ease'
        element.style.transform = `translate3d(${direction * window.innerWidth}px, 0, 0) scale(0.85)`
        element.style.opacity = '0'

        setTimeout(onDismiss, 200)
      } else {
        onDismiss()
      }
    } else {
      setOffsetX(0)
      setOffsetY(0)
    }

    setStartX(0)
    setStartY(0)
  }, [offsetX, offsetY, onDismiss])

  return (
    <div
      ref={toastRef}
      className={cn(
        'border-border bg-background shadow-bevel-lg pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-xl border px-3 py-3',
        'will-change-transform',
        t.className
      )}
      style={{
        WebkitTransform: 'translateZ(0)',
        transform: offsetX
          ? `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${1 - Math.abs(offsetX) / 1000})`
          : undefined,
        transition: offsetX
          ? 'transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)'
          : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className="flex-shrink-0 pt-0.5">
        {isError ? (
          <div className="text-destructive flex h-4 w-4 items-center justify-center">
            <AlertCircle className="size-4" />
          </div>
        ) : isSuccess ? (
          <div className="flex h-4 w-4 items-center justify-center text-green-600">
            <Check className="size-4" />
          </div>
        ) : isLoading ? (
          <div className="text-primary flex h-4 w-4 items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : isCustom ? (
          <div className="text-primary flex h-4 w-4 items-center justify-center">
            {t.icon}
          </div>
        ) : (
          <div className="flex h-4 w-4 items-center justify-center text-blue-500">
            <Info className="size-4" />
          </div>
        )}
      </div>

      <div className="flex-1">
        {t.title && (
          <div className="text-foreground text-sm font-medium">{t.title}</div>
        )}
        <div
          className={cn(
            'text-muted-foreground text-sm',
            !t.title && 'text-foreground'
          )}
        >
          {typeof t.message === 'string' ? t.message : t.customMessage}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()

          const element = toastRef.current
          if (element) {
            element.style.transition =
              'transform 150ms ease, opacity 100ms ease'
            element.style.transform = 'scale(0.9)'
            element.style.opacity = '0'

            setTimeout(onDismiss, 150)
          } else {
            onDismiss()
          }
        }}
        className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

const Toaster = () => {
  const { toasts, handlers } = useToaster()
  const { startPause, endPause } = handlers
  const MAX_VISIBLE_TOASTS = 5
  const [isHovering, setIsHovering] = useState(false)
  const [prevToastsLength, setPrevToastsLength] = useState(0)
  const toastContainerRef = useRef<HTMLDivElement>(null)

  const visibleToasts = toasts
    .filter((t) => t.visible)
    .slice(0, MAX_VISIBLE_TOASTS)

  useEffect(() => {
    setPrevToastsLength(visibleToasts.length)
  }, [visibleToasts.length])

  // Add a class to the container for staggered animations
  useEffect(() => {
    if (toastContainerRef.current) {
      if (visibleToasts.length > prevToastsLength) {
        toastContainerRef.current.classList.add('adding-toast')
        const timer = setTimeout(() => {
          toastContainerRef.current?.classList.remove('adding-toast')
        }, 300)
        return () => clearTimeout(timer)
      }
    }
  }, [visibleToasts.length, prevToastsLength])

  return (
    <div
      onMouseEnter={() => {
        startPause()
        setIsHovering(true)
      }}
      onMouseLeave={() => {
        endPause()
        setIsHovering(false)
      }}
      className="fixed right-0 bottom-0 z-[100] flex flex-col items-end gap-2 p-4"
      role="region"
      aria-label="Notifications"
    >
      <div
        ref={toastContainerRef}
        className="relative flex flex-col items-end gap-2"
      >
        {visibleToasts.map((t, index) => {
          const zIndex = 100 - index
          const hoverOffset = isHovering
            ? (visibleToasts.length - index - 1) * 72
            : index * 8

          return (
            <div
              key={t.id}
              className="relative"
              style={{
                position: index > 0 ? 'absolute' : 'relative',
                right: 0,
                bottom: 0,
                marginBottom: `${hoverOffset}px`,
                zIndex,
                width: '100%',
                transform: isHovering
                  ? 'scale(1)'
                  : `scale(${1 - index * 0.04})`,
                opacity: isHovering ? 1 : 1 - index * 0.15,
                transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform, opacity, margin-bottom',
              }}
            >
              <ToastComponent
                toast={t as CustomToast}
                onDismiss={() => hotToast.dismiss(t.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { ToastComponent, Toaster }

export const toast = {
  success: (message: string, title?: string, options?: ToastOptions) => {
    return hotToast.success(message, {
      ...options,
      icon: undefined,
      className: '',
      position: 'bottom-right',
      duration: 4000,
      style: {},
      id: options?.id,
      ...(title && { title }),
    })
  },

  error: (message: string, title?: string, options?: ToastOptions) => {
    return hotToast.error(message, {
      ...options,
      icon: undefined,
      className: '',
      position: 'bottom-right',
      duration: 5000,
      style: {},
      id: options?.id,
      ...(title && { title }),
    })
  },

  info: (message: string, title?: string, options?: ToastOptions) => {
    return hotToast(message, {
      ...options,
      icon: <Info className="size-5 text-blue-500" />,
      className: '',
      position: 'bottom-right',
      duration: 4000,
      style: {},
      id: options?.id,
      ...(title && { title }),
    })
  },

  loading: (message: string, title?: string, options?: ToastOptions) => {
    return hotToast.loading(message, {
      ...options,
      icon: undefined,
      className: '',
      position: 'bottom-right',
      duration: Infinity,
      style: {},
      id: options?.id,
      ...(title && { title }),
    })
  },

  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId)
  },
}
