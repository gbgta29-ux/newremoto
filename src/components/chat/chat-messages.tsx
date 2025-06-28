
'use client'

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/message';
import ChatMessage from './chat-message';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  return (
    <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1" />
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        {isLoading && (
            <div className="flex justify-start mb-2">
            <div className="rounded-lg p-2 px-4 max-w-sm bg-white text-black shadow-sm flex items-end">
                <span className="text-sm italic text-muted-foreground">digitando</span>
                <div className="flex items-center justify-center ml-2 space-x-0.5">
                    <span className="typing-dot typing-dot-1 w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                    <span className="typing-dot typing-dot-2 w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                    <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full"></span>
                </div>
            </div>
            </div>
        )}
        <div ref={scrollRef} />
    </div>
  );
}
