import { Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-provider'

export function ThemeToggle({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={cn('hover:bg-background relative rounded-full p-2', className)}
      {...props}
    >
      {theme === 'light' ? (
        <Moon
          className={cn(
            'h-5 w-5 transition-all duration-100',
            theme === 'light'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 -rotate-90 opacity-0'
          )}
        />
      ) : (
        <Sun
          className={cn(
            'h-5 w-5 transition-all duration-100',
            theme === 'dark'
              ? 'scale-100 rotate-0 opacity-100'
              : 'scale-0 rotate-90 opacity-0'
          )}
        />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
