"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { Send, Loader2, Lock, Check, X, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Message = {
  id: string;
  lead_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

interface ChatInterfaceProps {
  leadId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherPartyName: string;
  backLink?: string;
  headerActions?: React.ReactNode;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) {
    return "Today";
  } else if (isSameDay(dateString, yesterday.toISOString())) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function ChatInterface({ leadId, currentUserId, initialMessages, otherPartyName, backLink, headerActions }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [supabase] = useState(() => createClient());

  // Group messages by day and determine if consecutive
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; messages: (Message & { isConsecutive: boolean; isLastInGroup: boolean })[] }[] = [];
    
    messages.forEach((msg, index) => {
      const dateLabel = formatDateLabel(msg.created_at);
      let group = groups.find((g) => g.dateLabel === dateLabel);
      if (!group) {
        group = { dateLabel, messages: [] };
        groups.push(group);
      }

      const prevMsg = index > 0 ? messages[index - 1] : null;
      const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

      const isConsecutive = prevMsg ? prevMsg.sender_user_id === msg.sender_user_id && isSameDay(prevMsg.created_at, msg.created_at) : false;
      const isLastInGroup = !nextMsg || nextMsg.sender_user_id !== msg.sender_user_id || !isSameDay(msg.created_at, nextMsg.created_at);

      group.messages.push({ ...msg, isConsecutive, isLastInGroup });
    });

    return groups;
  }, [messages]);

  // Smart auto-scroll
  const scrollToBottom = (force = false) => {
    if (!scrollContainerRef.current || !messagesEndRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 150) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to Realtime inserts
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, supabase]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const tempBody = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    setNewMessage(""); 
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    // Optimistic UI update
    const optimisticMessage: Message = {
      id: tempId,
      lead_id: leadId,
      sender_user_id: currentUserId,
      body: tempBody,
      created_at: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    setPendingMessageIds((prev) => new Set(prev).add(tempId));
    setIsSending(true);
    
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const { data, error } = await sendMessage(leadId, tempBody);
      if (error) {
        toast.error(error);
        setNewMessage(tempBody);
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      } else if (data) {
        setMessages((prev) => prev.map(m => m.id === tempId ? data : m));
      }
    } finally {
      setIsSending(false);
      setPendingMessageIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const otherInitials = getInitials(otherPartyName);

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto flex flex-col h-[100dvh] md:h-full w-full bg-[#f8fafc] font-sans overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center z-0">
        <div className="w-full max-w-2xl h-full relative opacity-[0.03]">
          <div className="absolute top-[20%] -left-32 w-96 h-96 bg-[#FF5F00] rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-[40%] -right-32 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Chat Header - Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink} className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 transition-all active:scale-95">
              <ChevronLeft className="h-6 w-6" />
            </Link>
          )}
          <div className="relative">
            <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-slate-100 to-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 font-extrabold text-sm shrink-0 ring-4 ring-white">
              {otherInitials}
            </div>
            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm"></span>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">{otherPartyName}</h2>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">
              Online • Replies quickly
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 z-10 flex flex-col relative scroll-smooth scrollbar-thin scrollbar-thumb-slate-200/60">
        
        {/* Encryption Banner */}
        <div className="flex justify-center mb-8 mt-2">
          <div className="bg-emerald-50/60 backdrop-blur-md border border-emerald-100/50 text-emerald-600/80 text-[11px] px-4 py-2 rounded-full text-center max-w-sm flex items-center justify-center gap-2 font-bold shadow-sm">
            <Lock className="h-3 w-3 shrink-0" />
            <p>End-to-end encrypted chat</p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 mb-20">
            <div className="h-20 w-20 rounded-full bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-[#FF5F00]/5 animate-ping opacity-20"></div>
              <Send className="h-8 w-8 text-[#FF5F00]/40 translate-x-1" />
            </div>
            <p className="text-sm font-semibold tracking-wide text-slate-500">Start the conversation</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-end">
            {groupedMessages.map((group) => (
              <div key={group.dateLabel} className="flex flex-col w-full mb-8 last:mb-2">
                
                {/* Date Separator */}
                <div className="flex justify-center mb-6 mt-2 relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200/50"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 bg-[#f8fafc] px-4 py-1 uppercase">
                      {group.dateLabel}
                    </span>
                  </div>
                </div>

                {/* Messages in Group */}
                <div className="flex flex-col gap-1.5">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender_user_id === currentUserId;
                    const isPending = pendingMessageIds.has(msg.id);
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex w-full ${isMe ? "justify-end" : "justify-start"} ${!msg.isConsecutive ? "mt-4" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        
                        {!isMe && msg.isLastInGroup ? (
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 border border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0 mr-2.5 self-end mb-1">
                            {otherInitials}
                          </div>
                        ) : (
                          !isMe && <div className="w-[38px] shrink-0" />
                        )}

                        <div className={`flex flex-col max-w-[80%] sm:max-w-[70%] group/msg ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-5 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap transition-all shadow-sm ${
                              isPending ? "opacity-60 scale-[0.98]" : "opacity-100 scale-100"
                            } ${
                              isMe
                                ? "bg-gradient-to-br from-[#FF5F00] to-[#e05300] text-white shadow-[#FF5F00]/20"
                                : "bg-white border border-slate-100 text-slate-800 shadow-slate-200/40"
                            } ${
                              msg.isConsecutive && msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-tr-md rounded-br-2xl" : "rounded-r-2xl rounded-tl-md rounded-bl-2xl"
                                : !msg.isConsecutive && !msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" : "rounded-r-2xl rounded-tl-2xl rounded-bl-md"
                                : msg.isConsecutive && !msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-r-md" : "rounded-r-2xl rounded-l-md"
                                : "rounded-2xl"
                            }`}
                          >
                            {msg.body}
                          </div>
                          
                          {/* Time & Status */}
                          <div className={`flex items-center gap-1.5 mt-1.5 px-1.5 transition-all duration-300 ${msg.isLastInGroup ? "opacity-100 max-h-6" : "opacity-0 max-h-0 overflow-hidden group-hover/msg:opacity-100 group-hover/msg:max-h-6"}`}>
                            <span className="text-[10px] text-slate-400 font-bold tracking-wide">
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && !isPending && (
                              <Check className="h-3.5 w-3.5 text-[#FF5F00] opacity-90 drop-shadow-sm" />
                            )}
                            {isMe && isPending && (
                              <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
      </div>

      {/* Input Area - Floating Island Style */}
      <div className="bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4 px-4 sm:px-6 z-20 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto bg-white rounded-[28px] border border-slate-200/80 p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] focus-within:shadow-[0_8px_40px_rgba(255,95,0,0.12)] focus-within:border-[#FF5F00]/30 transition-all duration-300">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none bg-transparent px-4 py-3.5 text-[15px] font-medium text-slate-800 max-h-[140px] focus:outline-none leading-relaxed scrollbar-thin scrollbar-thumb-slate-300 placeholder:text-slate-400"
              disabled={isSending}
              style={{ minHeight: '52px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#FF5F00] text-white hover:bg-[#e05300] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-[#FF5F00] transition-all duration-200 mb-0.5 mr-0.5"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </form>
        <div className="text-center mt-3 hidden sm:block">
          <span className="text-[10px] font-semibold tracking-wide text-slate-400">
            <kbd className="font-sans bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md mx-1 shadow-sm">Enter</kbd> to send, 
            <kbd className="font-sans bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded-md mx-1 shadow-sm">Shift + Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );
}
