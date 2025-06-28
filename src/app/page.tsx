"use client";

import { useState, useEffect } from "react";
import type { Message } from "@/types/message";
import { sendMessage } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialTime, setInitialTime] = useState('');

  useEffect(() => {
    // Set time on client to prevent hydration mismatch
    setInitialTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  useEffect(() => {
    if (initialTime) {
      setMessages([
        {
          id: 1,
          text: "Oi, tudo bem? 😊",
          sender: "bot",
          timestamp: initialTime,
          status: "read",
        },
      ]);
    }
  }, [initialTime]);

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: userMessageText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { response } = await sendMessage(userMessageText);
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: response,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: "read",
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setMessages((prev) => 
        prev.map(msg => msg.id === userMessage.id ? {...msg, status: 'read'} : msg)
      );

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Desculpe, ocorreu um erro ao processar sua mensagem.",
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: "read",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111B21] flex items-center justify-center h-screen font-body">
      <div className="w-full h-full sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl">
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://i.pinimg.com/originals/34/8f/c9/348fc9806e32bba0fb4c42e799ddf880.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} />
          </div>
          <ChatInput formAction={formAction} isLoading={isLoading} />
      </div>
    </div>
  );
}
