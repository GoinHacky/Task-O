import { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { applyAuthDeepLink } from '../lib/authDeepLink'
import { devError, devLog } from '../lib/devLog'
import { supabase } from '../lib/supabase'

type SessionContextValue = {
  session: Session | null
  loading: boolean
  /** True after PASSWORD_RECOVERY deep link — user should set a new password */
  recoveryMode: boolean
  clearRecoveryMode: () => void
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
  recoveryMode: false,
  clearRecoveryMode: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), [])

  useEffect(() => {
    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          devLog('auth', 'initial session loaded', {
            hasSession: !!data.session,
            userId: data.session?.user?.id,
          })
          setSession(data.session)
          setLoading(false)
        }
      })
      .catch(error => {
        devError('auth', 'failed to read initial session', error)
        if (mounted) {
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      devLog('auth', 'auth state changed', {
        event,
        hasSession: !!nextSession,
        userId: nextSession?.user?.id,
      })
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      setSession(nextSession)
    })

    async function handleIncomingUrl(url: string | null) {
      if (!url) return
      const { ok, isRecovery } = await applyAuthDeepLink(url)
      if (ok) {
        devLog('auth', 'session from deep link applied')
        if (isRecovery) setRecoveryMode(true)
      }
    }

    Linking.getInitialURL().then(handleIncomingUrl)
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      handleIncomingUrl(url)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      linkSub.remove()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      recoveryMode,
      clearRecoveryMode,
    }),
    [session, loading, recoveryMode, clearRecoveryMode],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
