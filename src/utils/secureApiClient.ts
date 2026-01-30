import { supabase } from '@/integrations/supabase/client';

// Secure API client that routes through Supabase Edge Functions
export class SecureApiClient {
  
  // Secure AI chat using Hugging Face (via edge function)
  static async sendChatMessage(messages: Array<{role: string, content: string}>) {
    try {
      const lastMessage = messages[messages.length - 1]?.content || '';
      
      const { data, error } = await supabase.functions.invoke('huggingface-chat', {
        body: {
          message: lastMessage,
          chatHistory: messages.slice(0, -1)
        }
      });

      if (error) {
        console.error('Secure API error:', error);
        throw new Error('Failed to get AI response');
      }

      return data;
    } catch (error) {
      console.error('SecureApiClient error:', error);
      throw error;
    }
  }

  // Remove any direct API key usage from localStorage
  static validateSecureUsage() {
    // Remove old Groq keys if they exist (no longer needed)
    const dangerousKeys = ['groq_api_key', 'openai_key', 'GROQ_API_KEY'];
    
    dangerousKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.warn(`Removing old API key: ${key} - now using secure edge function`);
        localStorage.removeItem(key);
      }
    });
  }
}

// Initialize security check on module load
SecureApiClient.validateSecureUsage();
