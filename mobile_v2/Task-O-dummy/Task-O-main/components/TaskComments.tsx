'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MessageSquare, Send, User } from 'lucide-react'
import { format } from 'date-fns'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  user?: {
    full_name?: string
    email?: string
  }
}

interface TaskCommentsProps {
  taskId: string
  userId: string
}

export default function TaskComments({ taskId, userId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id (
          id,
          full_name,
          email
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (data) {
      setComments(data as Comment[])
    }
  }, [taskId])

  useEffect(() => {
    fetchComments()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`task_comments_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [taskId, fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('comments').insert([
        {
          task_id: taskId,
          user_id: userId,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border-l-4 border-primary-500 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {comment.user?.full_name || comment.user?.email || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
        <div className="flex space-x-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

