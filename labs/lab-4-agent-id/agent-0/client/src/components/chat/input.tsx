import React, {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useIsAuthenticated } from '@azure/msal-react'

import { Button, Input } from '@/components/ui'

import { ArrowUp } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export interface ChatInputRef {
  focus: () => void
}

const ChatInput = React.forwardRef<ChatInputRef, ChatInputProps>(
  ({ onSendMessage, isLoading }, ref) => {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const isAuthenticated = useIsAuthenticated()

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      },
    }))

    useLayoutEffect(() => {
      if (isAuthenticated) {
        inputRef.current?.focus()
      }
    }, [isAuthenticated])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (message.trim() && !isLoading) {
        const currentMessage = message
        setMessage('')
        await onSendMessage(currentMessage)
      }
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="focus-within:shadow-input-focus bg-background border-border relative z-10 flex w-full max-w-3xl cursor-text flex-col items-stretch gap-1.5 rounded-4xl border pt-2.5 pr-2.5 pb-2.5 pl-6 shadow-xs transition-all duration-200 sm:mx-0"
      >
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            className="px-0 text-base shadow-none focus:shadow-none"
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isAuthenticated
                ? 'Type your message...'
                : 'Login required to interact with Agent0'
            }
            disabled={isLoading || !isAuthenticated}
          />
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!isAuthenticated || isLoading}
          >
            <ArrowUp />
          </Button>
        </div>
      </form>
    )
  }
)

ChatInput.displayName = 'ChatInput'

export { ChatInput }
