import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
} from '@/components/ui'
import { Check, Copy, Mail } from 'lucide-react'

interface ShareChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string | null
  chatTitle: string
}

export function ShareChatDialog({
  open,
  onOpenChange,
  chatId,
  chatTitle,
}: ShareChatDialogProps) {
  const [shareMessage, setShareMessage] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setShareMessage('')
      setLinkCopied(false)
    }
  }, [open])

  useEffect(() => {
    if (linkCopied) {
      const timer = setTimeout(() => {
        setLinkCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [linkCopied])

  const handleCopyLink = () => {
    if (!chatId) return

    const url = `${window.location.origin}/chat/${chatId}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setLinkCopied(true)
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
        alert('Failed to copy link. Please try again.')
      })
  }

  const handleEmailShare = () => {
    if (!chatId) return

    const url = `${window.location.origin}/chat/${chatId}`
    const subject = encodeURIComponent(`Check out this chat: ${chatTitle}`)
    const body = encodeURIComponent(
      `${shareMessage}\n\nView the chat here: ${url}`
    )

    window.open(`mailto:?subject=${subject}&body=${body}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" position="center">
        <DialogHeader>
          <DialogTitle>Share Chat</DialogTitle>
          <DialogDescription>
            Share &ldquo;{chatTitle}&rdquo; with others via link or email.
          </DialogDescription>
        </DialogHeader>

        <div className="text-foreground mt-4 space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Chat Link</h4>
            <div className="flex items-center gap-2">
              <Input
                value={chatId ? `${window.location.origin}/chat/${chatId}` : ''}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
                endAdornment={
                  <Button
                    variant="link"
                    size="sm"
                    className="hover:text-foreground text-input-foreground h-7 cursor-pointer rounded-sm p-1"
                    onClick={handleCopyLink}
                  >
                    {linkCopied ? (
                      <Check className="size-4 text-green-700" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share via Email</h4>
            <Textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="resize-none"
              rows={3}
            />
            <Button
              variant="outline"
              className="mt-2 gap-1.5"
              onClick={handleEmailShare}
              startIcon={<Mail className="size-4" />}
            >
              Send via Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
