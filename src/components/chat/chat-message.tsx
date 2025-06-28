
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { Check, CheckCheck } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const MessageStatus = ({ status }: { status: Message['status'] }) => {
  if (status === 'sent') {
    return <Check className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Sent" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 ml-1 text-muted-foreground" aria-label="Delivered" />;
  }
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 ml-1 text-sky-500" aria-label="Read" />;
  }
  return null;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  return (
    <div className={cn("flex mb-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-lg p-2 max-w-[85%] md:max-w-[75%] shadow",
        isUser ? "bg-whatsapp-user-message" : "bg-white"
      )}>
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex justify-end items-center mt-1">
          <span className="text-xs text-muted-foreground mr-1">{message.timestamp}</span>
          {isUser && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
