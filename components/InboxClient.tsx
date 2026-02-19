'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search, Send, UserPlus, MoreVertical, Paperclip,
    MessageSquare, Users, Image as ImageIcon, File,
    UserMinus, Ban, Trash2, ChevronRight, Hash
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface InboxClientProps {
    initialConversations: any[]
    currentUser: any
}

export default function InboxClient({ initialConversations, currentUser }: InboxClientProps) {
    const [conversations, setConversations] = useState(initialConversations)
    const [activeConversation, setActiveConversation] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<'direct' | 'teams'>('direct')
    const [showOptions, setShowOptions] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const focusSearch = () => {
        searchInputRef.current?.focus()
    }

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.conversation_id)

            // Subscribe to new messages
            const channel = supabase
                .channel(`room:${activeConversation.conversation_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${activeConversation.conversation_id}`,
                    },
                    (payload) => {
                        setMessages((prev) => {
                            // Prevent duplicates
                            if (prev.find(m => m.id === payload.new.id)) return prev
                            return [...prev, payload.new]
                        })
                        scrollToBottom()
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [activeConversation])

    useEffect(scrollToBottom, [messages])

    const fetchMessages = async (conversationId: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
        setMessages(data || [])
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim() && !isUploading) return

        const messageContent = newMessage.trim()
        setNewMessage('') // Optimistic clear

        const { error } = await supabase.from('messages').insert({
            conversation_id: activeConversation.conversation_id,
            sender_id: currentUser.id,
            content: messageContent,
        })

        if (error) {
            console.error('Error sending message:', error)
            setNewMessage(messageContent) // Rollback
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeConversation) return

        setIsUploading(true)
        // Here you would typically upload to Supabase Storage
        // For now, we'll simulate an attachment
        const mockAttachmentUrl = 'https://example.com/mock-file'

        await supabase.from('messages').insert({
            conversation_id: activeConversation.conversation_id,
            sender_id: currentUser.id,
            content: `Attached: ${file.name}`,
            attachment_url: mockAttachmentUrl,
            attachment_name: file.name,
            attachment_type: file.type
        })

        setIsUploading(false)
    }

    const startNewConversation = async (otherUser: any) => {
        // Check if conversation already exists
        const { data: existing } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id)
            .in('conversation_id', (
                await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .eq('user_id', otherUser.id)
            ).data?.map(c => c.conversation_id) || [])

        if (existing && existing.length > 0) {
            const conv = conversations.find(c => c.conversation_id === existing[0].conversation_id)
            if (conv) {
                setActiveConversation(conv)
                setActiveTab('direct')
                setSearchQuery('')
                setSearchResults([])
                return
            }
        }

        // Create new
        const { data: conv } = await supabase
            .from('conversations')
            .insert({ is_team: false })
            .select()
            .single()

        if (conv) {
            await supabase.from('conversation_participants').insert([
                { conversation_id: conv.id, user_id: currentUser.id },
                { conversation_id: conv.id, user_id: otherUser.id }
            ])

            window.location.reload()
        }
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        const { data } = await supabase
            .from('users')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .neq('id', currentUser.id)
            .limit(5)

        setSearchResults(data || [])
    }

    const filteredConversations = conversations.filter(c =>
        activeTab === 'teams' ? c.is_team : !c.is_team
    )

    return (
        <div className="flex bg-white dark:bg-slate-950 rounded-[40px] border border-gray-100 dark:border-slate-800/50 shadow-2xl shadow-indigo-100/20 dark:shadow-none overflow-hidden h-[calc(100vh-180px)] animate-in fade-in duration-700 backdrop-blur-3xl">
            {/* Sidebar */}
            <div className="w-[380px] border-r border-gray-100 dark:border-slate-800/50 flex flex-col bg-white dark:bg-slate-900/30">
                <div className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-slate-50 tracking-tight">Inbox</h2>
                        <button
                            onClick={focusSearch}
                            className="w-10 h-10 rounded-2xl bg-[#f3f4ff] dark:bg-indigo-500/10 text-[#6366f1] flex items-center justify-center hover:bg-[#e8e9ff] dark:hover:bg-indigo-500/20 transition-all"
                        >
                            <UserPlus size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-slate-800/50 rounded-[20px] mb-6">
                        <button
                            onClick={() => setActiveTab('direct')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-xs font-bold transition-all ${activeTab === 'direct' ? 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-sm dark:shadow-none' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                        >
                            <MessageSquare size={16} /> Direct
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-xs font-bold transition-all ${activeTab === 'teams' ? 'bg-white dark:bg-slate-800 text-[#6366f1] shadow-sm dark:shadow-none' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'}`}
                        >
                            <Users size={16} /> Teams
                        </button>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 group-focus-within:text-[#6366f1] transition-colors" size={18} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Find conversations..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-semibold dark:text-slate-100 focus:ring-2 focus:ring-[#6366f1]/10 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
                    {searchResults.length > 0 && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                            <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">People</p>
                            {searchResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => startNewConversation(user)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#f3f4ff] dark:hover:bg-indigo-500/10 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-[#6366f1] text-white flex items-center justify-center font-bold text-sm">
                                        {user.full_name?.[0]}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-slate-50">{user.full_name}</p>
                                        <p className="text-[10px] font-bold text-[#6366f1] uppercase tracking-wider">Start Chat</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Recent</p>
                    {filteredConversations.length > 0 ? filteredConversations.map((conv: any) => {
                        const displayName = conv.is_team ? (conv.name || 'Team Chat') : (conv.user?.full_name || 'Generic User')
                        const isActive = activeConversation?.conversation_id === conv.conversation_id
                        return (
                            <button
                                key={conv.conversation_id}
                                onClick={() => setActiveConversation(conv)}
                                className={`w-full flex items-center gap-4 p-4 rounded-[28px] transition-all relative group ${isActive ? 'bg-[#f3f4ff] dark:bg-indigo-500/10 shadow-sm dark:shadow-none' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl relative overflow-hidden shadow-sm">
                                    {conv.is_team ? (
                                        <div className="w-full h-full bg-[#f3f4ff] dark:bg-slate-800 text-[#6366f1] flex items-center justify-center">
                                            {conv.avatar_url ? <img src={conv.avatar_url} alt={conv.name || 'Team'} className="w-full h-full object-cover" /> : <Hash size={24} />}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-100 dark:border-slate-700 flex items-center justify-center">
                                            {conv.user?.avatar_url ? <img src={conv.user.avatar_url} alt={displayName} className="w-full h-full object-cover" /> : displayName[0]}
                                        </div>
                                    )}
                                    {!conv.is_team && (
                                        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-[15px] font-bold text-gray-900 dark:text-slate-100 truncate tracking-tight">{displayName}</p>
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                                            {conv.messages?.[0] ? format(new Date(conv.messages[0].created_at), 'HH:mm') : ''}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${isActive ? 'text-[#6366f1] font-bold' : 'text-gray-500 font-medium'}`}>
                                        {conv.messages?.[0]?.content || 'Start a new conversation'}
                                    </p>
                                </div>
                                {isActive && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6366f1] rounded-full" />
                                )}
                            </button>
                        )
                    }) : (
                        <div className="py-20 text-center">
                            <p className="text-xs text-gray-400 font-bold italic">No {activeTab} chats found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeConversation ? (
                <div className="flex-1 flex flex-col bg-[#fcfcfd] dark:bg-slate-900/10 relative overflow-hidden">
                    {/* Header */}
                    <div className="p-6 px-10 border-b border-gray-100 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-10 sticky top-0">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center font-black text-[#6366f1] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                {activeConversation.avatar_url ? (
                                    <img src={activeConversation.avatar_url} alt={activeConversation.is_team ? activeConversation.name : activeConversation.user?.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    activeConversation.is_team ? <Hash size={20} /> : activeConversation.user?.full_name?.[0]
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50 leading-tight">
                                    {activeConversation.is_team ? activeConversation.name : activeConversation.user?.full_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Active Now</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setShowOptions(!showOptions)}
                                    className="w-11 h-11 rounded-xl text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                {showOptions && (
                                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-slate-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden backdrop-blur-3xl">
                                        <button className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-[#f3f4ff] dark:hover:bg-indigo-500/10 hover:text-[#6366f1] transition-all">
                                            <UserPlus size={18} /> Invite to team
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-all">
                                            <Ban size={18} /> Block User
                                        </button>
                                        <div className="h-px bg-gray-50 dark:bg-slate-800 mx-4 my-2" />
                                        <button className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all">
                                            <Trash2 size={18} /> Delete Chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                        {messages.length > 0 ? messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUser.id
                            const showAvatar = i === 0 || messages[i - 1].sender_id !== msg.sender_id

                            return (
                                <div key={msg.id || i} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0 overflow-hidden text-[10px] flex items-center justify-center font-black">
                                            {showAvatar ? activeConversation.user?.full_name?.[0] : ''}
                                        </div>
                                    )}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[65%]`}>
                                        <div className={`p-5 rounded-[28px] text-[15px] leading-relaxed shadow-sm border ${isMe
                                            ? 'bg-[#6366f1] text-white border-[#6366f1] rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border-gray-100 dark:border-slate-700 rounded-tl-none shadow-indigo-100/10 dark:shadow-none'
                                            }`}>
                                            {msg.attachment_url && (
                                                <div className="mb-3 p-3 bg-black/5 rounded-2xl flex items-center gap-3">
                                                    {msg.attachment_type?.startsWith('image') ? <ImageIcon size={20} /> : <File size={20} />}
                                                    <span className="text-xs font-bold truncate">{msg.attachment_name}</span>
                                                </div>
                                            )}
                                            <p className="font-medium">{msg.content}</p>
                                        </div>
                                        <span className="text-[10px] mt-2 font-bold text-gray-300 uppercase tracking-widest px-1">
                                            {format(new Date(msg.created_at), 'HH:mm')}
                                        </span>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                                <MessageSquare size={48} className="text-gray-200" />
                                <p className="text-sm font-bold text-gray-400">No messages yet. Say hello!</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input System */}
                    <div className="p-8 bg-white dark:bg-slate-950 border-t border-gray-50 dark:border-slate-800/50 flex gap-4 backdrop-blur-3xl">
                        <div className="flex gap-2">
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-slate-500 flex items-center justify-center hover:bg-[#f3f4ff] dark:hover:bg-indigo-500/10 hover:text-[#6366f1] transition-all border border-gray-100 dark:border-slate-800"
                            >
                                <Paperclip size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleSendMessage} className="flex-1 relative flex gap-4">
                            <input
                                type="text"
                                placeholder="Write your message here..."
                                className="flex-1 pl-6 pr-6 py-4 bg-gray-50 dark:bg-slate-900/50 border border-gray-50 dark:border-slate-800/50 rounded-[28px] text-[15px] font-medium dark:text-slate-100 focus:ring-4 focus:ring-[#6366f1]/5 focus:bg-white dark:focus:bg-slate-800 focus:border-[#6366f1]/20 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() && !isUploading}
                                className="w-14 h-14 bg-[#6366f1] text-white rounded-2xl flex items-center justify-center hover:bg-[#5558e3] transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                            >
                                <Send size={22} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-[#fcfcfd] dark:bg-slate-950/20 text-center p-20 animate-in fade-in zoom-in duration-1000">
                    <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-indigo-100/40 dark:shadow-none flex items-center justify-center text-[#6366f1] mb-10 border border-gray-50 dark:border-slate-800 group backdrop-blur-xl">
                        <MessageSquare size={48} className="group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-slate-50 mb-4 tracking-tight">Your Inbox</h3>
                    <p className="text-gray-400 dark:text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        Select a conversation from the sidebar or search for someone to start a new collaboration.
                    </p>
                    <button
                        onClick={focusSearch}
                        className="mt-8 px-8 py-3.5 bg-[#6366f1] text-white text-xs font-bold rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all active:scale-95 uppercase tracking-widest"
                    >
                        New Message
                    </button>
                </div>
            )}
        </div>
    )
}
