// Import memory manager functions
import { loadMemory, updateMemory } from '@/utils/memoryManager';
import { getAssistantSystemPrompt } from './aiAssistantService';
import { sendMessageToJarvis } from './huggingfaceService';

// Interface for the completion request
export interface CompletionRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

// Interface for the completion response
export interface CompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// User memory functions
export const getUserMemory = (): Record<string, any> => {
  try {
    const memory = localStorage.getItem('user_memory');
    return memory ? JSON.parse(memory) : {};
  } catch (error) {
    console.error('Error retrieving user memory:', error);
    return {};
  }
};

export const updateUserMemory = (message: string): void => {
  try {
    const memory = getUserMemory();
    // Simple implementation - just store the last few messages
    if (!memory.recentMessages) memory.recentMessages = [];
    memory.recentMessages.unshift(message);
    if (memory.recentMessages.length > 10) memory.recentMessages.pop();
    localStorage.setItem('user_memory', JSON.stringify(memory));
  } catch (error) {
    console.error('Error updating user memory:', error);
  }
};

// Completion function using Hugging Face
export const createCompletion = async (
  request: CompletionRequest
): Promise<CompletionResponse> => {
  try {
    const response = await sendMessageToJarvis(request.prompt, []);
    
    return {
      text: response,
      usage: {
        promptTokens: Math.ceil(request.prompt.length / 4),
        completionTokens: Math.ceil(response.length / 4),
        totalTokens: Math.ceil((request.prompt.length + response.length) / 4),
      },
    };
  } catch (error) {
    console.error('Error creating completion:', error);
    return {
      text: "I encountered an error while processing your request. Please try again.",
    };
  }
};

// Generate assistant response with memory integration
export async function generateAssistantResponseWithMemory(
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>,
  assistant: 'jarvis' = 'jarvis'
): Promise<string> {
  const memory = loadMemory();

  // Example: include user info in context
  const userName = memory['userName'] || 'User';
  const contextMessage = `Remember, the user's name is ${userName}. ${userMessage}`;

  // Use the Hugging Face service
  const response = await sendMessageToJarvis(contextMessage, chatHistory.slice(-10));

  // Update memory if user shares their name
  if (userMessage.toLowerCase().includes('my name is')) {
    const name = userMessage.split('my name is')[1].trim();
    updateMemory('userName', name);
  }

  return response;
}
