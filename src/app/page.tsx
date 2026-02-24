
"use client";

import { useState, useEffect, useRef } from "react";
import type { Message } from "@/types/message";
import { sendMessage, createPixCharge, checkPaymentStatus, type PixChargeData } from "@/app/actions";
import ChatHeader from "@/components/chat/chat-header";
import ChatMessages from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw, Play } from 'lucide-react';
import Image from "next/image";
import { track as fpixelTrack } from '@/lib/fpixel';

type FlowStep = 
  | 'initial'
  | 'awaiting_name'
  | 'awaiting_fantasy_response'
  | 'flow_sequencing'
  | 'awaiting_pix_payment'
  | 'payment_confirmed_awaiting_upsell_choice'
  | 'awaiting_upsell_pix_payment'
  | 'upsell_payment_confirmed'
  | 'flow_complete_redirect'
  | 'chat_mode';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Digitando...");
  const [autoPlayingAudioId, setAutoPlayingAudioId] = useState<number | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [flowStep, setFlowStep] = useState<FlowStep>('initial');
  const [userName, setUserName] = useState('');
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pixData, setPixData] = useState<PixChargeData | null>(null);
  const [upsellPixData, setUpsellPixData] = useState<PixChargeData | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const notificationSoundRef = useRef<HTMLAudioElement>(null);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  
  const playNotificationSound = () => {
    notificationSoundRef.current?.play().catch(console.error);
  }

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp' | 'status'>, sender: 'user' | 'bot'): Message => {
    if (sender === 'bot') {
      playNotificationSound();
    }
    const fullMessage: Message = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: sender === 'user' ? 'read' : 'sent',
      ...msg,
      sender,
    };
    setMessages(prev => [...prev, fullMessage]);
    return fullMessage;
  };
  
  const playAudioSequence = async (url: string) => {
    return new Promise<void>(resolve => {
        const audioMessage = addMessage({ type: 'audio', url, onEnded: resolve }, 'bot');
        setAutoPlayingAudioId(audioMessage.id);
    });
  };
  
  const showLoadingIndicator = async (duration: number, text: string = "Digitando...") => {
      setLoadingText(text);
      setIsLoading(true);
      await delay(duration);
      setIsLoading(false);
  };

  useEffect(() => {
    const runWelcomeFlow = async () => {
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/pdsk8muifi_1771460338060.mp3');
      setAutoPlayingAudioId(null);
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: "me fala seu nome…" }, 'bot');
      
      setShowInput(true);
      setFlowStep('awaiting_name');
    };

    if (isStarted) {
        runWelcomeFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStarted]);

  const handleCreatePix = async (value: number, isUpsell: boolean = false) => {
    setIsCreatingPix(true);
    if (!isUpsell) {
        addMessage({ type: 'text', text: "vou mandar meu pix pra você bb... 😍" }, 'bot');
        await showLoadingIndicator(4000);
    }
    
    const charge = await createPixCharge(value);
    if (charge && charge.pixCopyPaste) {
      fpixelTrack('InitiateCheckout', { value: value / 100, currency: 'BRL' });
      if(isUpsell) {
        setUpsellPixData(charge);
        setFlowStep('awaiting_upsell_pix_payment');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      } else {
        setPixData(charge);
        setFlowStep('awaiting_pix_payment');
        addMessage({ type: 'text', text: `Prontinho amor, faz o pagamento pra gente ir pra nossa chamadinha...` }, 'bot');
        addMessage({ type: 'pix', sender: 'bot', pixCopyPaste: charge.pixCopyPaste, value: value / 100 });
      }
    } else {
      addMessage({ type: 'text', text: "Ops, não consegui gerar o PIX agora, amor. Tenta de novo." }, 'bot');
      setFlowStep(isUpsell ? 'payment_confirmed_awaiting_upsell_choice' : 'flow_sequencing');
      if(!isUpsell) setShowInput(true); 
    }
    setIsCreatingPix(false);
  };

  const handleCheckPayment = async (txId: string, value: number, isUpsell: boolean = false) => {
    if (!txId || isCheckingPayment) return;

    setIsCheckingPayment(true);
    await showLoadingIndicator(4000);
    addMessage({ type: 'text', text: "Ok amor, só um momento que vou verificar... 😍" }, 'bot');
    
    await delay(6000); // Simulando verificação

    const result = await checkPaymentStatus(txId);

    if (result?.status === 'paid') {
      fpixelTrack('Purchase', { value: value / 100, currency: 'BRL' });
      if (isUpsell) {
        addMessage({ type: 'text', text: "Pagamento confirmado, gostoso! 🔥 Clique abaixo para pegar meu WhatsApp agora!" }, 'bot');
        setFlowStep('upsell_payment_confirmed');
      } else {
        await showLoadingIndicator(4000, "Gravando áudio...");
        await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/gdcqcftspd4_1771537290599.mp3');
        setAutoPlayingAudioId(null);
        addMessage({ type: 'text', text: "Amor, o pagamento caiu! 😍 Quer meu número pessoal do WhatsApp agora também pra gente conversar por lá sempre?" }, 'bot');
        setFlowStep('payment_confirmed_awaiting_upsell_choice');
      }
    } else {
      // Pagamento não aprovado
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/0aui1dajmnvk_1771537138947.mp3');
      setAutoPlayingAudioId(null);
    }
    setIsCheckingPayment(false);
  };

  const handleUpsellChoice = async (choice: 'yes' | 'no') => {
    if (choice === 'yes') {
        addMessage({ type: 'text', text: 'Quero' }, 'user');
        await handleCreatePix(1400, true);
    } else {
        addMessage({ type: 'text', text: 'Quero só a chamadinha' }, 'user');
        await showLoadingIndicator(4000);
        addMessage({ type: 'text', text: 'Tudo bem, amor! Clique abaixo para iniciar nossa chamada.' }, 'bot');
        setFlowStep('flow_complete_redirect');
    }
  }

  const formAction = async (formData: FormData) => {
    const userMessageText = formData.get("message") as string;
    if (!userMessageText.trim()) return;

    addMessage({ type: 'text', text: userMessageText }, 'user');
    setShowInput(false);

    if (flowStep === 'awaiting_name') {
      const name = userMessageText;
      setUserName(name);
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: `${name}… hmm… que delícia de nome.` }, 'bot');
      
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/uks5c0veyc_1771702629528.mp3');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'video', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/pfkx68epvd_1771461100635.mp4' }, 'bot');

      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/j0ersnhua1f_1771460336322.mp3');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: "imagina sua rola grossa no lugar dos meus dedos?, o que você faria ?" }, 'bot');
      
      setFlowStep('awaiting_fantasy_response');
      setShowInput(true);
      return;
    }

    if (flowStep === 'awaiting_fantasy_response') {
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/2op9h6qgtlc_1771461753269.mp3');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'image', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/pfmt7q5rjq_1771461955268.jpg' }, 'bot');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'video', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/hk60ue9l9qm_1771526731807.mp4' }, 'bot');

      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/62qem5ywino_1771526713045.mp3');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: "quero sua porra quente na minha cara" }, 'bot');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: `${userName}… minha buceta tá escorrendo até o cu, meu cuzinho tá piscando pedindo sua rola.` }, 'bot');
      
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/a8tha6a0n4s_1771527109081.mp3');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'text', text: "olha como eu to agora te esperando" }, 'bot');
      
      await showLoadingIndicator(4000);
      addMessage({ type: 'image', url: 'https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/m23yme7ft0r_1771527255525.jpg' }, 'bot');
      
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/qywyirtrr1_1771527488434.mp3');
      
      await showLoadingIndicator(4000, "Gravando áudio...");
      await playAudioSequence('https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/v08xzrhvxya_1771537020760.mp3');
      
      setAutoPlayingAudioId(null);
      await handleCreatePix(994);
    }
  };

  return (
    <div className="bg-[#111B21] flex items-center justify-center h-screen font-body select-none">
      <div className="w-full h-dvh sm:w-[450px] sm:h-[95vh] sm:max-h-[900px] flex flex-col bg-background shadow-2xl relative overflow-hidden">
          {!isStarted && (
            <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center gap-4 text-center p-4">
               <Image
                src="https://gvdtvgefzbxunjrtzrdw.supabase.co/storage/v1/object/public/media/d1396egl5vj_1771537797547.jpg"
                alt="Bia ❤️"
                width={80}
                height={80}
                className="rounded-full border-4 border-white object-cover aspect-square"
              />
              <h1 className="text-white text-2xl font-bold">Bia ❤️</h1>
              <p className="text-white/80">Mandou uma nova mensagem de audio</p>
              <Button onClick={() => setIsStarted(true)} size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground mt-4">
                <Play className="mr-2" />
                Ouvir agora
              </Button>
            </div>
          )}
          <ChatHeader />
          <div 
            className="flex-1 overflow-y-auto"
            style={{
              backgroundImage: "url('https://i.pinimg.com/originals/10/d0/fe/10d0fe1c2f20ef8f30e94b2c3b69e4d9.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <ChatMessages messages={messages} isLoading={isLoading} loadingText={loadingText} autoPlayingAudioId={autoPlayingAudioId} />
          </div>

          {(flowStep === 'awaiting_pix_payment' || flowStep === 'awaiting_upsell_pix_payment') && (
            <div className="p-4 bg-background border-t border-border/20 flex flex-col items-center gap-4">
              <Button
                  onClick={() => {
                    if (flowStep === 'awaiting_pix_payment' && pixData) {
                      handleCheckPayment(pixData.transactionId, 994, false);
                    } else if (flowStep === 'awaiting_upsell_pix_payment' && upsellPixData) {
                       handleCheckPayment(upsellPixData.transactionId, 1400, true);
                    }
                  }}
                  disabled={isCheckingPayment}
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-primary/90"
              >
                  {isCheckingPayment ? (
                      <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                      </>
                  ) : (
                      'Já paguei'
                  )}
              </Button>
            </div>
          )}
          
          {flowStep === 'payment_confirmed_awaiting_upsell_choice' && (
             <div className="p-4 bg-background border-t border-border/20 flex flex-col gap-3">
                <Button onClick={() => handleUpsellChoice('yes')} className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                    Quero
                </Button>
                <Button onClick={() => handleUpsellChoice('no')} variant="outline" className="w-full font-bold text-lg py-6 rounded-full">
                    Quero só a chamadinha
                </Button>
            </div>
          )}

          {(flowStep === 'upsell_payment_confirmed' || flowStep === 'flow_complete_redirect') && (
             <div className="p-4 bg-background border-t border-border/20 flex justify-center">
              <Button asChild className="w-full bg-accent text-accent-foreground font-bold text-lg py-6 rounded-full shadow-lg hover:bg-accent/90">
                <Link href="https://unrivaled-cascaron-259617.netlify.app/" target="_blank">
                  Iniciar chamada de vídeo
                </Link>
              </Button>
            </div>
          )}

          {showInput && <ChatInput formAction={formAction} disabled={isLoading || isCreatingPix} />}
          <audio ref={notificationSoundRef} src="https://imperiumfragrance.shop/wp-content/uploads/2025/06/adew.mp3" preload="auto" />
      </div>
    </div>
  );
}
