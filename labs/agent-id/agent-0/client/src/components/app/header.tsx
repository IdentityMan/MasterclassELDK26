import { Edit3, Share } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { ThemeToggle, UserButton } from '@/components/app'
import { RenameChatDialog, ShareChatDialog } from '@/components/dialogs'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { EntraUser } from '@/lib/auth'

interface HeaderProps {
  loginUrl: () => Promise<void>
  loading: boolean
  user: EntraUser | undefined
  logout: () => void
  chatTitle?: string
  onUpdateChatTitle?: (newTitle: string) => Promise<boolean | undefined>
}

export const Header = ({
  loginUrl,
  loading,
  user,
  logout,
  chatTitle = 'New Chat',
  onUpdateChatTitle,
}: HeaderProps) => {
  const { chatId } = useParams<{ chatId: string }>()
  const [isRenamingDialogOpen, setIsRenamingDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const handleEditTitle = () => {
    setIsRenamingDialogOpen(true)
  }

  const handleOpenShareDialog = () => {
    setIsShareDialogOpen(true)
  }

  return (
    <header className="bg-card-background border-border sticky top-0 z-50 flex w-full border-b p-3">
      <div
        className={cn(
          'mx-auto flex w-full items-center',
          chatId ? 'justify-between' : 'justify-end'
        )}
      >
        {chatId && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="hover:bg-muted flex items-center gap-0.5 rounded-xl pr-2.5 pl-2"
              onClick={handleEditTitle}
              endIcon={onUpdateChatTitle && <Edit3 className="ml-1 size-4" />}
            >
              <h2 className="text-md truncate font-bold">{chatTitle}</h2>
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {chatId && (
            <Button
              variant="outline"
              onClick={handleOpenShareDialog}
              aria-label="Share chat"
              startIcon={<Share className="size-4" />}
            >
              Share
            </Button>
          )}

          <ThemeToggle />
          {user ? (
            <UserButton user={user} logout={logout} />
          ) : (
            <Button
              onClick={() => loginUrl()}
              variant="default"
              disabled={loading}
            >
              Log In
            </Button>
          )}
        </div>
      </div>

      {chatId && onUpdateChatTitle && (
        <RenameChatDialog
          open={isRenamingDialogOpen}
          onOpenChange={setIsRenamingDialogOpen}
          chatTitle={chatTitle}
          onSave={onUpdateChatTitle}
        />
      )}

      {chatId && (
        <ShareChatDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          chatId={chatId}
          chatTitle={chatTitle}
        />
      )}
    </header>
  )
}
