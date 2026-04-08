import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSession } from './SessionContext'
import { supabase } from '../lib/supabase'
import type { NotificationItem } from '../types'

type NotificationContextValue = {
  items: NotificationItem[]
  unreadCount: number
  loading: boolean
  reload: () => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clearAll: () => Promise<void>
  deleteOne: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  items: [],
  unreadCount: 0,
  loading: true,
  reload: async () => {},
  markRead: async () => {},
  markAllRead: async () => {},
  clearAll: async () => {},
  deleteOne: async () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const userId = session?.user?.id
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setItems((data || []) as NotificationItem[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    reload()

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { reload() },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, reload])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId])

  const clearAll = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').delete().eq('user_id', userId)
    setItems([])
  }, [userId])

  const deleteOne = useCallback(async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id)
    setItems(prev => prev.filter(n => n.id !== id))
  }, [])

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items])

  const value = useMemo(() => ({
    items, unreadCount, loading, reload, markRead, markAllRead, clearAll, deleteOne,
  }), [items, unreadCount, loading, reload, markRead, markAllRead, clearAll, deleteOne])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationContext)
}
