"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";

type FlowStep = 
  | 'initial'
  | 'awaiting_name'
  | 'awaiting_amor_permission'
  | 'awaiting_after_gostar_response'
  | 'awaiting_after_picante_response'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [city, setCity] = useState('do Brasil');
  const sendSoundRef = useRef<HTMLAudioElement>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>, sender: 'user' | 'bot'): Message => {
    const fullMessage: Message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: sender === 'user' ? 'sent' : 'read',
      ...msg,
      sender,
    };
    setMessages(prev => [...prev, fullMessage]);
    return fullMessage;
  };
  
  const playAudioSequence = async (audioId: number, url: string) => {
    await new Promise<void>(resolve => {
        const audioMessage = addMessage({ type: 'audio', url, onEnded: resolve }, 'bot');
        setAutoPlayingAudioId(audioMessage.id);
    });
    setAutoPlayingAudioId(null);
  };
  
  const showTypingIndicator = async (duration: number) => {
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      let currentCity = 'do Brasil';
      try {
        const geoResponse = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          currentCity = geoData.city || 'do Brasil';
          setCity(currentCity);
        }
      } catch (error) {
        console.error("Geolocation fetch error:", error);
      }
      
      await showTypingIndicator(2000);
      await playAudioSequence(1, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/1-1.mp3');
      await showTypingIndicator(2000);
      await playAudioSequence(2, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/2-1.mp3');
      await delay(3000);
      
      const encodedCity = encodeURIComponent(currentCity);
      const imageUrl = `https://res.cloudinary.com/dxqmzd84a/image/upload/co_rgb:000000,l_text:roboto_50_bold_normal_left:${encodedCity}/fl_layer_apply,x_50,y_425/Design_sem_nome_12_txxzjl`;
      addMessage({ type: 'image', url: imageUrl }, 'bot');
      
      await delay(2000);
      addMessage({ type: 'text', text: "Fotinha de agora meu bem 😍" }, 'bot');
      
      await showTypingIndicator(2000);
      await playAudioSequence(3, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/3-1.mp3');

      await delay(2000);
      addMessage({ type: 'text', text: `E moro em ${currentCity}` }, 'bot');
      
      await delay(2000);
      addMessage({ type: 'text', text: "Qual seu nome, bb? 💗" }, 'bot');
      
      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    runWelcomeFlow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    if (sendSoundRef.current) {
        sendSoundRef.current.currentTime = 0;
        sendSoundRef.current.play().catch(console.error);
    }
    
    const userMessage = addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);
    setIsLoading(true);

    setMessages((prev) => 
      prev.map(msg => msg.id === userMessage.id ? {...msg, status: 'read'} : msg)
    );

    switch (flowStep) {
      case 'awaiting_name':
        setUserName(userMessageText);
        addMessage({ type: 'text', text: `Adorei seu nome ${userMessageText}, 💗 posso te chamar de amor?` }, 'bot');
        setFlowStep('awaiting_amor_permission');
        setShowInput(true);
        break;

      case 'awaiting_amor_permission':
        await playAudioSequence(4, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/4.mp3');
        await delay(2000);
        await playAudioSequence(5, 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/5.mp3');
        await delay(2000);
        addMessage({ type: 'text', text: "Acho que vai gostar rsrs" }, 'bot');
        setFlowStep('awaiting_after_gostar_response');
        setShowInput(true);
        break;
        
      case 'awaiting_after_gostar_response':
        addMessage({ type: 'image', url: 'https://imperiumfragrance.shop/wp-content/uploads/2025/06/essa-.jpg' }, 'bot');
        await delay(2000);
        addMessage({ type: 'text', text: "O que você achou bb?? vou mostrar umas mais picantes" }, 'bot');
        setFlowStep('awaiting_after_picante_response');
        setShowInput(true);
        break;

      case 'awaiting_after_picante_response':
      case 'chat_mode':
        setFlowStep('chat_mode');
        try {
          const { response } = await sendMessage(userMessageText);
          addMessage({ type: 'text', text: response }, 'bot');
        } catch (error) {
          console.error(error);
          addMessage({ type: 'text', text: "Desculpe, ocorreu um erro ao processar sua mensagem." }, 'bot');
        }
        setShowInput(true);
        break;
    }
    setIsLoading(false);
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
          {showInput && <ChatInput formAction={formAction} disabled={isLoading} />}
          <audio ref={sendSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/Efeito-sonoro-Whatsapp-dpbOO-8AIPo.mp3" preload="auto" />
      </div>
    </div>
  );
}
