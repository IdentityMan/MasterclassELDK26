import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'

import { Message } from '@/types/message'
import { ChatInput, ChatInputRef, ChatMessage } from '@/components/chat'
import { Header, Sidebar } from '@/components/app'
import { loginRequest } from '@/lib/auth'
import { useUserWithPhoto } from '@/lib/useUserWithPhoto'
import * as React from 'react'

interface ChatInterfaceProps {
  messages: Message[]
  isLoading: boolean
  isStreaming?: boolean
  handleSendMessage: (message: string) => Promise<void>
  chatTitle?: string
  onUpdateChatTitle?: (newTitle: string) => Promise<boolean | undefined>
}

const ChatInterface = React.forwardRef<HTMLDivElement, ChatInterfaceProps>(
  (
    {
      messages,
      isLoading,
      isStreaming = false,
      handleSendMessage,
      chatTitle = 'New Chat',
      onUpdateChatTitle,
    },
    ref
  ) => {
    const { chatId } = useParams<{ chatId: string }>()
    const chatInputRef = useRef<ChatInputRef>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { instance, accounts } = useMsal()
    const user = useUserWithPhoto(accounts[0] || null)

    const loginWithRedirect = async () => {
      await instance.loginPopup(loginRequest)
    }

    const logout = () => {
      instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      })
    }

    const handleSendMessageWrapper = async (message: string) => {
      await handleSendMessage(message)

      // Ensure focus returns to input after message is sent
      setTimeout(() => {
        chatInputRef.current?.focus()
      }, 0)
    }

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
      <div className="flex h-screen" ref={ref}>
        <Sidebar currentChatId={chatId} currentChatTitle={chatTitle} />

        <div className="flex flex-1 flex-col">
          <Header
            loginUrl={() => loginWithRedirect()}
            loading={isLoading}
            logout={logout}
            user={user}
            chatTitle={chatTitle}
            onUpdateChatTitle={onUpdateChatTitle}
          />

          <div
            className="z-0 flex-1 overflow-y-auto px-8"
            style={{
              WebkitMaskImage:
                'linear-gradient(to top, transparent 0%, black 5%)',
              maskImage: 'linear-gradient(to top, transparent 0%, black 5%)',
            }}
          >
            <div className="mx-auto max-w-2xl space-y-4 py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={
                    isStreaming &&
                    message.id === messages[messages.length - 1]?.id &&
                    message.role === 'assistant'
                  }
                />
              ))}
              <div ref={messagesEndRef} />
              {isLoading && !isStreaming && (
                <div className="mb-4 flex justify-start">
                  <div className="bg-background border-border text-muted-foreground flex items-center rounded-full border border-dotted px-2.5 py-1.5">
                    <span className="bg-foreground animate-think block h-4 w-4 rounded-full"></span>
                    <span className="animate-pulse px-1.5">Thinking</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-3 sm:px-4 md:px-0">
            <ChatInput
              ref={chatInputRef}
              onSendMessage={handleSendMessageWrapper}
              isLoading={isLoading}
            />
            <footer className="text-muted-foreground mx-auto w-full max-w-2xl text-center text-xs">
              Powered by Microsoft Entra
            </footer>
          </div>
        </div>
      </div>
    )
  }
)

ChatInterface.displayName = 'ChatInterface'

export { ChatInterface }
