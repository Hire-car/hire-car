"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

interface ChatThread {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  snippet: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chats: ChatThread[];
}

export function ChatSidebar({ chats }: ChatSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const activeChatId = params.id as string | undefined;
  
  const [search, setSearch] = useState("");

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.vehicle.toLowerCase().includes(q)
    );
  }, [chats, search]);

  // On mobile, if we are inside a chat room (activeChatId is present), hide the sidebar.
  // On desktop, always show it.
  const isMobileHidden = !!activeChatId;

  return (
    <div className={`
      ${isMobileHidden ? 'hidden md:flex' : 'flex'}
      flex-col w-full md:w-[340px] lg:w-[400px] flex-shrink-0 border-r border-slate-200 bg-white h-full
    `}>
      {/* Header */}
      <div className="h-[72px] px-4 flex items-center border-b border-slate-100 flex-shrink-0">
        <h2 className="font-heading text-xl font-bold text-slate-900">Messages</h2>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No conversations found.
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredChats.map((chat) => {
              const isActive = activeChatId === chat.id;
              
              // Format timestamp
              const date = new Date(chat.timestamp);
              const isToday = new Date().toDateString() === date.toDateString();
              const timeString = isToday 
                ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

              return (
                <Link 
                  key={chat.id} 
                  href={`/messages/${chat.id}`}
                  className={`
                    w-full flex items-start gap-3 p-3 transition-colors border-b border-slate-50
                    ${isActive ? 'bg-primary/[0.04] hover:bg-primary/[0.08]' : 'hover:bg-slate-50'}
                  `}
                >
                  <div className={`h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center font-bold text-sm shrink-0 ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                    {chat.initials}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`font-heading text-sm font-semibold truncate pr-2 ${isActive ? 'text-primary' : 'text-slate-900'}`}>
                        {chat.name}
                      </h3>
                      <span className={`text-[11px] whitespace-nowrap flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                        {timeString}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 truncate max-w-[80px]">
                        {chat.vehicle}
                      </span>
                      <span className="text-[10px] text-slate-300 flex-shrink-0">•</span>
                      <p className={`text-xs truncate ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>
                        {chat.snippet}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
