import { useState, useEffect } from 'react'
import { AccountInfo } from '@azure/msal-browser'
import { accountToUser, fetchUserPhoto, EntraUser } from '@/lib/auth'

/**
 * Custom hook that returns a user object with the profile photo from Microsoft Graph
 */
export function useUserWithPhoto(account: AccountInfo | null): EntraUser | undefined {
  const [user, setUser] = useState<EntraUser | undefined>(() => accountToUser(account))

  useEffect(() => {
    let isMounted = true
    let photoUrl: string | null = null

    const loadUserWithPhoto = async () => {
      if (!account) {
        if (isMounted) {
          setUser(undefined)
        }
        return
      }

      // Set user immediately without photo
      if (isMounted) {
        setUser(accountToUser(account))
      }

      // Then fetch photo in background
      try {
        photoUrl = await fetchUserPhoto(account)
        if (isMounted && photoUrl) {
          setUser(accountToUser(account, photoUrl))
        }
      } catch (error) {
        console.error('Error loading user photo:', error)
      }
    }

    loadUserWithPhoto()

    // Cleanup: revoke the object URL when component unmounts or account changes
    return () => {
      isMounted = false
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl)
      }
    }
  }, [account?.localAccountId]) // Only re-run when the account ID changes

  return user
}
