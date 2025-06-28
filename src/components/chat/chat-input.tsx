
'use client'

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, ArrowUp, Smile, Paperclip } from 'lucide-react';

interface ChatInputProps {
  formAction: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

export default function ChatInput({ formAction, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isLoading) {
      setMessage('');
      formRef.current?.reset();
    }
  }, [isLoading]);
  
  const handleFormSubmit = async (formData: FormData) => {
    if (message.trim()) {
      await formAction(formData);
    }
  }

  return (
    <div className="flex items-center p-2.5 bg-background border-t border-border/20 shrink-0">
      <form ref={formRef} action={handleFormSubmit} className="flex-grow flex items-center gap-2.5">
        <div className="flex-grow bg-white rounded-full flex items-center px-4 shadow-sm">
          <button type="button" aria-label="Emoji">
            <Smile className="text-muted-foreground" />
          </button>
          <Input 
            name="message" 
            placeholder="Mensagem" 
            className="flex-1 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-11 p-0 ml-2"
            autoComplete="off"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
          <button type="button" aria-label="Attach file">
            <Paperclip className="text-muted-foreground" />
          </button>
        </div>
        <Button 
          type="submit"
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shrink-0 shadow-sm"
          disabled={isLoading}
          aria-label={message.trim() ? 'Enviar mensagem' : 'Gravar áudio'}
        >
          {message.trim() ? <ArrowUp className="text-white" /> : <Mic className="text-white" />}
        </Button>
      </form>
    </div>
  );
}
