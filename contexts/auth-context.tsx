'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { setGlobalAuthErrorHandler } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  userRole: string | null
  userFullName: string | null
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  handleAuthError: (error: any) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Function to handle authentication errors (especially JWT expiration)
  const handleAuthError = (error: any) => {
    const errorMessage = error?.message || error?.error_description || error?.error || ''

    // Check for JWT expiration or authentication errors
    if (
      errorMessage.includes('JWT expired') ||
      errorMessage.includes('invalid JWT') ||
      errorMessage.includes('token has expired') ||
      errorMessage.includes('Authentication required') ||
      errorMessage.includes('Invalid JWT') ||
      error?.status === 401 ||
      error?.code === 'PGRST301' // PostgREST JWT expired error
    ) {
      console.log('JWT expired or authentication error detected, signing out...')

      // Show user-friendly message
      toast.error('Your session has expired. Please sign in again.')

      // Sign out and redirect to auth page
      signOut().then(() => {
        router.push('/auth')
      })

      return true // Indicates the error was handled
    }

    return false // Error was not an auth error
  }

  useEffect(() => {
    // Set the global auth error handler
    setGlobalAuthErrorHandler(handleAuthError)

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          handleAuthError(error)
        } else {
          console.log('Initial session loaded:', !!session)
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error)
        handleAuthError(error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event, !!session)

        // Handle token refresh failures
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, signing out...')
          toast.error('Your session has expired. Please sign in again.')
          router.push('/auth')
        }

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  // Get user role and full name from metadata
  const userRole = user?.user_metadata?.role || user?.app_metadata?.role || null
  const userFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || null

  // Helper functions for role checking
  const hasRole = (role: string): boolean => {
    return userRole === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return userRole ? roles.includes(userRole) : false
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    userRole,
    userFullName,
    hasRole,
    hasAnyRole,
    handleAuthError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
