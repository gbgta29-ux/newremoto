
'use server';

import { generateResponse, GenerateResponseOutput } from '@/ai/flows/generate-response';

export async function sendMessage(message: string): Promise<GenerateResponseOutput> {
  try {
    const response = await generateResponse({ message });
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    return { response: "Desculpe, não consegui processar sua mensagem. Tente novamente mais tarde." };
  }
}
