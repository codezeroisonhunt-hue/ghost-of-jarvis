import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface HuggingFaceResponse {
  message: string;
  success: boolean;
  error?: string;
  retryable?: boolean;
}

/**
 * Send a message to JARVIS via Hugging Face API (through secure edge function)
 */
export async function sendMessageToJarvis(
  message: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('huggingface-chat', {
      body: { message, chatHistory }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to get AI response');
    }

    if (data.error) {
      // Handle retryable errors (like model loading)
      if (data.retryable) {
        toast({
          title: "Model Loading",
          description: data.error,
          variant: "default"
        });
        // Wait and retry once
        await new Promise(resolve => setTimeout(resolve, 3000));
        return sendMessageToJarvis(message, chatHistory);
      }
      
      throw new Error(data.error);
    }

    return data.message;
  } catch (error) {
    console.error('Hugging Face service error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    toast({
      title: "AI Response Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    return "I apologize, but I'm having trouble connecting to my systems right now. Please try again in a moment.";
  }
}

/**
 * Check if the Hugging Face service is available
 */
export async function checkServiceAvailability(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('huggingface-chat', {
      body: { message: 'ping' }
    });
    
    return !error && data?.success;
  } catch {
    return false;
  }
}
