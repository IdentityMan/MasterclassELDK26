import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'

import { ChatInterface } from '@/components/chat'
import {
  addMessageToChat,
  createChat,
  getChatById,
  getChatMessages,
  updateChatTitle,
} from '@/lib/storage'
import { Message } from '@/types/message'
import { accountToUser, getAccessToken, loginRequest } from '@/lib/auth'

export default function ChatRoute() {
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFetchingChat, setIsFetchingChat] = useState(false)
  const [chatTitle, setChatTitle] = useState('New Chat')
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0] || null
  const user = accountToUser(account)
  const userId = user?.sub

  const loginWithRedirect = async () => {
    await instance.loginPopup(loginRequest)
  }

  const [content, setContent] = useState<string>(
    'Hello! How can i help you today?'
  )

  // Buffer for accumulating text chunks before updating state
  const contentBufferRef = useRef('')
  // For debouncing content updates
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: content,
      role: 'assistant',
    },
  ])

  // Update messages when content changes
  useEffect(() => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content: content,
          },
        ]
      }
      return prevMessages
    })
  }, [content])

  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!chatId || !isAuthenticated || !userId) return

      setIsFetchingChat(true)
      try {
        const chat = await getChatById(chatId)

        if (chat && chat.userId === userId) {
          setChatTitle(chat.title)

          const messagesFromDb = await getChatMessages(chatId)
          if (messagesFromDb.length > 0) {
            setMessages(
              messagesFromDb.map((msg) => ({
                id: msg.id,
                content: msg.content,
                role: msg.role as 'user' | 'assistant',
              }))
            )
          } else {
            // Reset messages for new empty chats
            setMessages([
              {
                id: '1',
                content: 'Hello! How can I help you today?',
                role: 'assistant',
              },
            ])
          }
        } else {
          navigate('/', { replace: true })
        }
      } catch (error) {
        console.error('Error fetching chat:', error)

        navigate('/', { replace: true })
      } finally {
        setIsFetchingChat(false)
      }
    }

    fetchChatMessages()
  }, [chatId, isAuthenticated, userId, navigate])

  useEffect(() => {
    if (!chatId) {
      setMessages([
        {
          id: '1',
          content: 'Hello! How can I help you today?',
          role: 'assistant',
        },
      ])
      setChatTitle('New Chat')
    }
  }, [chatId])

  const handleUpdateChatTitle = async (newTitle: string) => {
    if (!chatId || !newTitle.trim()) return

    try {
      await updateChatTitle(chatId, newTitle.trim())
      setChatTitle(newTitle.trim())
      return true
    } catch (error) {
      console.error('Error updating chat title:', error)
      return false
    }
  }

  const generateTitle = (message: string) => {
    const maxLength = 30
    let title = message.trim()

    if (title.length > maxLength) {
      title = title.substring(0, maxLength) + '...'
    }

    return title
  }

  const handleSendMessage = async (message: string) => {
    if (!isAuthenticated) {
      loginWithRedirect()
      return
    }

    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setIsStreaming(false)

    contentBufferRef.current = ''
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    try {
      const token = await getAccessToken(account)
      if (!token) {
        throw new Error('Failed to get access token')
      }

      let currentChatId = chatId
      let isFirstMessage = false

      if (!currentChatId && userId) {
        const newChat = await createChat(userId)
        currentChatId = newChat.id
        isFirstMessage = true

        navigate(`/chat/${newChat.id}`, { replace: true })

        setChatTitle(newChat.title)
      }

      if (currentChatId && userId) {
        await addMessageToChat(currentChatId, {
          content: userMessage.content,
          role: userMessage.role,
        })

        if (isFirstMessage) {
          const title = generateTitle(userMessage.content)
          await updateChatTitle(currentChatId, title)
          setChatTitle(title)
        }
      }

      const protocol = import.meta.env.DEV ? 'http' : 'https'
      const port = import.meta.env.DEV ? `:${import.meta.env.API_PORT}` : ''
      const apiUrl = `${protocol}://${import.meta.env.API_HOST}${port}/api/server/agent0`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ content, role }) => ({
            content,
            role,
          })),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.error(
            'Unauthorized: Check API permissions or token validity.'
          )
        } else {
          console.error('API responded with status:', response.status)
        }
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
      }

      setMessages((prev) => [...prev, systemMessage])

      // Set streaming to true once we start receiving chunks
      setIsStreaming(true)

      // Batched update function to reduce render cycles
      const updateMessageContent = (newContent: string) => {
        contentBufferRef.current += newContent

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }

        updateTimeoutRef.current = setTimeout(() => {
          systemMessage.content = contentBufferRef.current
          setContent(contentBufferRef.current)
          updateTimeoutRef.current = null
        }, 32) // ~2 frames at 60fps
      }

      while (true) {
        const { done, value } = await reader?.read()!

        if (done) break

        const chunk = decoder.decode(value)

        const lines = chunk.split('\n')

        for (const line of lines) {
          const match = line.match(/^\d+:\s*"([^"]*)"/)

          if (match) {
            let extracted = match[1] // Extract content inside quotes

            extracted = extracted.replace(/\\n/g, '\n')

            updateMessageContent(extracted)
          }
        }
      }

      // Final update to ensure all content is displayed
      if (contentBufferRef.current) {
        systemMessage.content = contentBufferRef.current
        setContent(contentBufferRef.current)
      }

      if (currentChatId) {
        await addMessageToChat(currentChatId, {
          content: systemMessage.content,
          role: systemMessage.role,
        })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'Login required') {
        console.error('Token expired or invalid. Redirecting to login...')
        loginWithRedirect()
      } else {
        console.error('Error sending message:', error)

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
        }

        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      // Clean up any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return (
    <ChatInterface
      messages={messages}
      isLoading={isLoading || isFetchingChat}
      isStreaming={isStreaming}
      handleSendMessage={handleSendMessage}
      chatTitle={chatTitle}
      onUpdateChatTitle={handleUpdateChatTitle}
    />
  )
}
