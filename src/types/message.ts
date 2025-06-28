
export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}
