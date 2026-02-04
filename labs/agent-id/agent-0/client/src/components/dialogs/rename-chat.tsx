import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@/components/ui'

interface RenameChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatTitle: string
  onSave: (newTitle: string) => Promise<boolean | undefined>
}

export function RenameChatDialog({
  open,
  onOpenChange,
  chatTitle,
  onSave,
}: RenameChatDialogProps) {
  const [newTitle, setNewTitle] = useState(chatTitle)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setNewTitle(chatTitle)
  }, [chatTitle, open])

  const handleSave = async () => {
    if (!newTitle.trim()) return

    setIsUpdating(true)
    try {
      const success = await onSave(newTitle)
      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error updating title:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" position="center">
        <DialogHeader>
          <DialogTitle>Rename Chat</DialogTitle>
          <DialogDescription>
            Enter a new title for this chat.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter chat title"
          className="my-4"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSave()
            }
          }}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating || !newTitle.trim()}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
