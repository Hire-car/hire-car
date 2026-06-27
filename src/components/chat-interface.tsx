"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/actions/chat";
import { Send, Loader2, Lock, Check, ArrowLeft } from "lucide-react";
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
    // Auto-scroll if we're already near the bottom (within 150px) or if forced (like when sending a message)
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
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter(m => m.id !== tempId));
      } else if (data) {
        // Swap temp ID with real ID
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
    <div className="flex flex-col h-full w-full bg-white font-sans overflow-hidden relative">
      {/* Chat Header */}
      <div className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm z-10 flex-shrink-0 h-[72px]">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink} className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
            {otherInitials}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{otherPartyName}</h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Usually replies within 1 hour
            </p>
          </div>
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#f8fafc] flex flex-col">
        
        {/* Encryption Banner */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-200/50 text-slate-500 text-[11px] px-4 py-2 rounded-xl text-center max-w-sm flex items-center justify-center gap-2 font-medium">
            <Lock className="h-3 w-3 shrink-0" />
            <p>End-to-end encrypted messaging.</p>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Send className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-end">
            {groupedMessages.map((group) => (
              <div key={group.dateLabel} className="flex flex-col w-full mb-6 last:mb-0">
                
                {/* Date Separator */}
                <div className="flex justify-center mb-4 mt-2">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
                    {group.dateLabel}
                  </span>
                </div>

                {/* Messages in Group */}
                <div className="flex flex-col gap-1">
                  {group.messages.map((msg) => {
                    const isMe = msg.sender_user_id === currentUserId;
                    const isPending = pendingMessageIds.has(msg.id);
                    
                    return (
                      <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} ${!msg.isConsecutive ? "mt-3" : ""}`}>
                        
                        {!isMe && msg.isLastInGroup ? (
                          <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0 mr-2 self-end mb-1">
                            {otherInitials}
                          </div>
                        ) : (
                          !isMe && <div className="w-9 shrink-0" /> // Spacer for alignment if not last
                        )}

                        <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] group/msg ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-4 py-2.5 text-[15px] leading-relaxed shadow-sm break-words whitespace-pre-wrap transition-opacity ${
                              isPending ? "opacity-70" : "opacity-100"
                            } ${
                              isMe
                                ? "bg-gradient-to-br from-[#FF5F00] to-[#ea580c] text-white"
                                : "bg-white border border-slate-200 text-slate-800"
                            } ${
                              msg.isConsecutive && msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-tr-sm rounded-br-2xl" : "rounded-r-2xl rounded-tl-sm rounded-bl-2xl"
                                : !msg.isConsecutive && !msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-tr-2xl rounded-br-sm" : "rounded-r-2xl rounded-tl-2xl rounded-bl-sm"
                                : msg.isConsecutive && !msg.isLastInGroup
                                ? isMe ? "rounded-l-2xl rounded-r-sm" : "rounded-r-2xl rounded-l-sm"
                                : "rounded-2xl" // Single standalone message
                            }`}
                          >
                            {msg.body}
                          </div>
                          
                          {/* Time & Status - Only on last message of a cluster, or revealed on hover */}
                          <div className={`flex items-center gap-1 mt-1 px-1 transition-all duration-200 ${msg.isLastInGroup ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden group-hover/msg:opacity-100 group-hover/msg:h-4 group-hover/msg:mt-1"}`}>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatTime(msg.created_at)}
                            </span>
                            {isMe && !isPending && (
                              <Check className="h-3 w-3 text-[#FF5F00] opacity-80" />
                            )}
                            {isMe && isPending && (
                              <Loader2 className="h-3 w-3 text-slate-300 animate-spin" />
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
        <div ref={messagesEndRef} className="h-1 w-full shrink-0" />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3 sm:p-4 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-[15px] max-h-[120px] focus:border-[#FF5F00] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FF5F00]/10 transition-all leading-tight scrollbar-thin scrollbar-thumb-slate-300"
              disabled={isSending}
              style={{ minHeight: '46px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#FF5F00] text-white shadow-md shadow-orange-500/20 hover:bg-[#E05300] hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5 ml-1" />
            )}
          </button>
        </form>
        <div className="text-center mt-2 hidden sm:block">
          <span className="text-[10px] text-slate-400 font-medium">Press <kbd className="font-sans bg-slate-100 border border-slate-200 px-1 rounded mx-0.5">Enter</kbd> to send, <kbd className="font-sans bg-slate-100 border border-slate-200 px-1 rounded mx-0.5">Shift + Enter</kbd> for new line</span>
        </div>
      </div>
    </div>
  );
}
