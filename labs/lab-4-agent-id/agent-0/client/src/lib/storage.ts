import { v4 as uuidv4 } from 'uuid'
import type { Message } from '@/types/message'

export type Chat = {
  id: string
  title: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type StoredMessage = {
  id: string
  content: string
  role: string
  createdAt: Date
  chatId: string
}

// Storage keys
const CHATS_STORAGE_KEY = 'agent0-chats'
const MESSAGES_STORAGE_KEY = 'agent0-messages'

// Type for raw stored chat from localStorage
interface RawStoredChat {
  id: string
  title: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Type for raw stored message from localStorage
interface RawStoredMessage {
  id: string
  content: string
  role: string
  createdAt: string
  chatId: string
}

// Helper functions to get and set data in localStorage
const getStoredChats = (): Chat[] => {
  try {
    const chatsJson = localStorage.getItem(CHATS_STORAGE_KEY)
    if (!chatsJson) return []

    return JSON.parse(chatsJson).map((chat: RawStoredChat) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
    }))
  } catch (error) {
    console.error('Error retrieving chats from localStorage:', error)
    return []
  }
}

const getStoredMessages = (): StoredMessage[] => {
  try {
    const messagesJson = localStorage.getItem(MESSAGES_STORAGE_KEY)
    if (!messagesJson) return []

    return JSON.parse(messagesJson).map((message: RawStoredMessage) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    }))
  } catch (error) {
    console.error('Error retrieving messages from localStorage:', error)
    return []
  }
}

const setStoredChats = (chats: Chat[]) => {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats))
  } catch (error) {
    console.error('Error saving chats to localStorage:', error)
    throw error
  }
}

const setStoredMessages = (messages: StoredMessage[]) => {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving messages to localStorage:', error)
    throw error
  }
}

// Chat related functions that mirror our Prisma functions
export async function createChat(
  userId: string,
  title = 'New Chat'
): Promise<Chat> {
  const chats = getStoredChats()

  const newChat: Chat = {
    id: uuidv4(),
    title,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  chats.push(newChat)
  setStoredChats(chats)

  return newChat
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const chats = getStoredChats()
  return chats.find((chat) => chat.id === chatId) || null
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const chats = getStoredChats()
  return chats
    .filter((chat) => chat.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function addMessageToChat(
  chatId: string,
  message: Omit<Message, 'id'>
): Promise<StoredMessage> {
  const messages = getStoredMessages()
  const chats = getStoredChats()

  const newMessage: StoredMessage = {
    id: uuidv4(),
    content: message.content,
    role: message.role,
    createdAt: new Date(),
    chatId,
  }

  messages.push(newMessage)
  setStoredMessages(messages)

  const chatIndex = chats.findIndex((chat) => chat.id === chatId)
  if (chatIndex !== -1) {
    chats[chatIndex].updatedAt = new Date()
    setStoredChats(chats)
  }

  return newMessage
}

export async function getChatMessages(
  chatId: string
): Promise<StoredMessage[]> {
  const messages = getStoredMessages()
  return messages
    .filter((message) => message.chatId === chatId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<Chat> {
  const chats = getStoredChats()
  const chatIndex = chats.findIndex((chat) => chat.id === chatId)

  if (chatIndex === -1) {
    throw new Error(`Chat with ID ${chatId} not found`)
  }

  chats[chatIndex].title = title
  chats[chatIndex].updatedAt = new Date()
  setStoredChats(chats)

  return chats[chatIndex]
}

export async function deleteChat(chatId: string): Promise<void> {
  const chats = getStoredChats()
  const messages = getStoredMessages()

  const updatedChats = chats.filter((chat) => chat.id !== chatId)

  const updatedMessages = messages.filter(
    (message) => message.chatId !== chatId
  )

  try {
    setStoredChats(updatedChats)
    setStoredMessages(updatedMessages)
  } catch (error) {
    console.error('Error during localStorage operations:', error)
    throw error
  }
}
