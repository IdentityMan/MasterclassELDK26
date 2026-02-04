import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusCircleIcon,
  Trash2,
  MoreHorizontal,
  Share,
  Edit,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'

import {
  getUserChats,
  deleteChat,
  updateChatTitle,
  createChat,
} from '@/lib/storage'
import { accountToUser, loginRequest } from '@/lib/auth'
import { Button, Popover } from '@/components/ui'

import {
  RenameChatDialog,
  ShareChatDialog,
  DeleteChatDialog,
} from '@/components/dialogs'

type ChatInfo = {
  id: string
  title: string
  updatedAt: Date
}

interface SidebarProps {
  currentChatId?: string
  currentChatTitle?: string
  refreshTrigger?: number
}

export function Sidebar({
  currentChatId,
  currentChatTitle,
  refreshTrigger = 0,
}: SidebarProps) {
  const [chats, setChats] = useState<ChatInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [chatToDeleteTitle, setChatToDeleteTitle] = useState('')

  const [chatToRename, setChatToRename] = useState<string | null>(null)
  const [chatToRenameTitle, setChatToRenameTitle] = useState('')

  const [chatToShare, setChatToShare] = useState<string | null>(null)
  const [chatToShareTitle, setChatToShareTitle] = useState('')

  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0)
  const [activePopover, setActivePopover] = useState<string | null>(null)
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const account = accounts[0] || null
  const user = accountToUser(account)
  const userId = user?.sub
  const navigate = useNavigate()

  const loginWithRedirect = async () => {
    await instance.loginPopup(loginRequest)
  }

  useEffect(() => {
    setInternalRefreshTrigger((prev) => prev + 1)
  }, [refreshTrigger])

  // Effect to update sidebar when current chat title changes from header
  useEffect(() => {
    if (currentChatId && currentChatTitle && isAuthenticated) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, title: currentChatTitle }
            : chat
        )
      )
    }
  }, [currentChatId, currentChatTitle, isAuthenticated])

  const loadChats = async () => {
    if (!isAuthenticated || !userId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const userChats = await getUserChats(userId)
      setChats(
        userChats.map((chat) => ({
          id: chat.id,
          title: chat.title,
          updatedAt: chat.updatedAt,
        }))
      )
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadChats()
  }, [isAuthenticated, userId, internalRefreshTrigger])

  const openDeleteDialog = (
    chatId: string,
    chatTitle: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setChatToDelete(chatId)
    setChatToDeleteTitle(chatTitle)
    setActivePopover(null)
  }

  const handleCancelDelete = () => {
    setChatToDelete(null)
    setChatToDeleteTitle('')
  }

  const handleConfirmDelete = async () => {
    if (!chatToDelete) return

    try {
      await deleteChat(chatToDelete)

      setInternalRefreshTrigger((prev) => prev + 1)

      if (currentChatId === chatToDelete) {
        navigate('/')
      }

      toast.success('Chat deleted successfully')
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error('Failed to delete chat')
    } finally {
      setChatToDelete(null)
    }
  }

  const openRenameDialog = (
    chatId: string,
    currentTitle: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setChatToRename(chatId)
    setChatToRenameTitle(currentTitle)
    setActivePopover(null)
  }

  const handleCancelRename = () => {
    setChatToRename(null)
    setChatToRenameTitle('')
  }

  const handleConfirmRename = async (newTitle: string) => {
    if (!chatToRename || !newTitle.trim()) return false

    try {
      await updateChatTitle(chatToRename, newTitle.trim())

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatToRename ? { ...chat, title: newTitle.trim() } : chat
        )
      )

      toast.success('Chat renamed successfully')
      return true
    } catch (error) {
      console.error('Error renaming chat:', error)
      toast.error('Failed to rename chat')
      return false
    }
  }

  const openShareDialog = (
    chatId: string,
    chatTitle: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setChatToShare(chatId)
    setChatToShareTitle(chatTitle)
    setActivePopover(null)
  }

  const handleCloseShareDialog = () => {
    setChatToShare(null)
    setChatToShareTitle('')
  }

  const togglePopover = (chatId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setActivePopover(activePopover === chatId ? null : chatId)
  }

  const handleNewChat = async () => {
    if (!isAuthenticated || !user?.sub) {
      loginWithRedirect()
      return
    }

    try {
      const newChat = await createChat(user.sub, 'New Chat')
      navigate(`/chat/${newChat.id}`)
      setInternalRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error creating new chat:', error)
      toast.error('Failed to create new chat')
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const day = 24 * 60 * 60 * 1000

    if (diff < day) {
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
      }).format(date)
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date)
    }
  }

  const renderPopoverContent = (chatId: string, chatTitle: string) => (
    <div className="flex flex-col p-1">
      <Button
        variant="ghost"
        className="text-foreground hover:bg-muted flex h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openRenameDialog(chatId, chatTitle)
        }}
        startIcon={<Edit className="size-4" />}
      >
        Rename
      </Button>
      <Button
        variant="ghost"
        className="text-foreground hover:bg-muted flex h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openShareDialog(chatId, chatTitle)
        }}
        startIcon={<Share className="size-4" />}
      >
        Share
      </Button>
      <Button
        variant="ghost"
        className="text-foreground hover:bg-muted flex h-8 items-center gap-1.5 rounded-lg px-2 py-1 text-left text-sm"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openDeleteDialog(chatId, chatTitle)
        }}
        startIcon={<Trash2 className="size-4" />}
      >
        Delete
      </Button>
    </div>
  )

  if (!isAuthenticated) {
    return (
      <div className="border-border bg-background flex h-full w-64 flex-col border-r">
        <div className="text-muted-foreground p-4 text-center text-sm">
          Please log in to view chat history
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border-border bg-background flex h-full w-64 flex-col border-r">
        <div className="flex items-center justify-between py-3 pr-2.5 pl-4">
          <img src="/agent0.svg" />
          <h1 className="text-foreground text-lg font-bold">Agent ID</h1>
          <Button
            variant="outline"
            onClick={handleNewChat}
            className="text-muted-foreground hover:text-foreground h-8 p-1.5"
            aria-label="New Chat"
          >
            <PlusCircleIcon className="size-4" />
          </Button>
        </div>

        <div className="flex-1 px-2">
          {isLoading ? (
            <div className="flex justify-center p-4">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    to={`/chat/${chat.id}`}
                    className={`group relative flex items-center justify-between rounded-xl py-1 pr-1 pl-2.5 text-sm ${
                      currentChatId === chat.id
                        ? 'bg-muted text-foreground'
                        : 'text-foreground hover:bg-muted/50 hover:text-accent-foreground'
                    } `}
                  >
                    <div className="flex-1 truncate">{chat.title}</div>
                    <div className="flex items-center space-x-2.5">
                      <span className="text-foreground/50 text-xs">
                        {formatDate(chat.updatedAt)}
                      </span>

                      <div className="relative">
                        <Popover
                          content={renderPopoverContent(chat.id, chat.title)}
                          open={activePopover === chat.id}
                          onOpenChange={(open) =>
                            setActivePopover(open ? chat.id : null)
                          }
                          align="start"
                          width={104}
                        >
                          <Button
                            variant="ghost"
                            className="hover:text-foreground text-muted-foreground h-6 rounded-lg p-1 hover:bg-transparent"
                            onClick={(e) => togglePopover(chat.id, e)}
                          >
                            <MoreHorizontal size={16} />
                          </Button>
                        </Popover>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DeleteChatDialog
        open={chatToDelete !== null}
        onOpenChange={(open) => !open && handleCancelDelete()}
        chatTitle={chatToDeleteTitle}
        onDelete={handleConfirmDelete}
      />

      <RenameChatDialog
        open={chatToRename !== null}
        onOpenChange={(open) => !open && handleCancelRename()}
        chatTitle={chatToRenameTitle}
        onSave={handleConfirmRename}
      />

      <ShareChatDialog
        open={chatToShare !== null}
        onOpenChange={(open) => !open && handleCloseShareDialog()}
        chatId={chatToShare}
        chatTitle={chatToShareTitle}
      />
    </>
  )
}
