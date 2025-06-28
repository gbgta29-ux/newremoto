"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";


export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlowRunning, setIsFlowRunning] = useState(true);
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const sendSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const runWelcomeFlow = async () => {
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
      
      setIsFlowRunning(true);
      setMessages([]);

      const audio1Url = 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/1-1.mp3';
      const audio2Url = 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/2-1.mp3';

      // 1. “Gravando áudio...” (delay 2s)
      setIsLoading(true);
      await delay(2000);
      setIsLoading(false);
      
      // 2. Play audio 1
      const audio1Id = Date.now();
      await new Promise<void>(resolve => {
        setMessages(prev => [...prev, {
          id: audio1Id,
          sender: 'bot',
          type: 'audio',
          url: audio1Url,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          onEnded: resolve,
        }]);
        setAutoPlayingAudioId(audio1Id);
      });
      setAutoPlayingAudioId(null);
      
      // 4. “Gravando áudio...” (delay 2s)
      setIsLoading(true);
      await delay(2000);
      setIsLoading(false);

      // 5. Play audio 2
      const audio2Id = Date.now() + 1;
      await new Promise<void>(resolve => {
        setMessages(prev => [...prev, {
          id: audio2Id,
          sender: 'bot',
          type: 'audio',
          url: audio2Url,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
          onEnded: resolve,
        }]);
        setAutoPlayingAudioId(audio2Id);
      });
      setAutoPlayingAudioId(null);


      // 6. Delay 3s após fim
      await delay(3000);

      // 7. & 8. Geolocation Image
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!geoResponse.ok) throw new Error('Failed to fetch geo data');
        const geoData = await geoResponse.json();
        const city = geoData.city || 'do Brasil';
        const encodedCity = encodeURIComponent(city);
        const imageUrl = `https://res.cloudinary.com/dxqmzd84a/image/upload/co_rgb:000000,l_text:roboto_50_bold_normal_left:${encodedCity}/fl_layer_apply,x_50,y_425/Design_sem_nome_12_txxzjl`;
        
        setMessages(prev => [...prev, {
            id: Date.now() + 2,
            sender: 'bot',
            type: 'image',
            url: imageUrl,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
        }]);

      } catch (error) {
        console.error("Geolocation flow error:", error);
         setMessages(prev => [...prev, { 
            id: Date.now() + 2,
            sender: 'bot',
            type: 'text', 
            text: 'Seja muito bem-vindo(a)!',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
        }]);
      }

      setIsFlowRunning(false);
    };

    runWelcomeFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    // Play sound before state updates to prevent re-render issues
    if (sendSoundRef.current) {
        sendSoundRef.current.currentTime = 0;
        sendSoundRef.current.play().catch(console.error);
    }

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      type: 'text',
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
        type: 'text',
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
        type: 'text',
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
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl">
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://i.pinimg.com/originals/34/8f/c9/348fc9806e32bba0fb4c42e799ddf880.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} autoPlayingAudioId={autoPlayingAudioId} />
          </div>
          <ChatInput formAction={formAction} disabled={isLoading || isFlowRunning} />
          <audio ref={sendSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/Efeito-sonoro-Whatsapp-dpbOO-8AIPo.mp3" preload="auto" />
      </div>
    </div>
  );
}
