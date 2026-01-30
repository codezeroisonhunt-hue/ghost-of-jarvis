import { useState, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Message, ConversationContext } from '@/types/chat';
import { generateAssistantResponse } from '@/services/aiAssistantService';
import { getUserMemory, updateUserMemory } from '@/services/aiService';
import { AssistantType } from '@/pages/JarvisInterface';
import { processSkillCommand, isSkillCommand } from '@/services/skillsService';
import { analyzeTextEmotions, analyzeSentiment } from '@/services/emotionalIntelligenceService';
import { detectLanguage } from '@/services/languageService';
import { parseTaskFromText } from '@/services/taskManagementService';

export const useChatLogic = (
  activeMode: 'normal' | 'voice' | 'face' | 'hacker',
  setIsSpeaking: (isSpeaking: boolean) => void,
  activeAssistant: AssistantType,
  inputMode: 'voice' | 'text'
) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am JARVIS, your personal assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentTopics: [],
    userPreferences: getUserMemory(),
    sessionStartTime: new Date()
  });
  const [emotionalData, setEmotionalData] = useState({
    emotions: null,
    sentiment: null
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (role === 'assistant') {
      setConversationContext(prev => {
        const topics = [...prev.recentTopics];
        const simpleTopic = content.split(' ').slice(0, 3).join(' ') + '...';
        
        if (!topics.includes(simpleTopic)) {
          topics.unshift(simpleTopic);
          if (topics.length > 5) topics.pop();
        }
        
        return {
          ...prev,
          recentTopics: topics
        };
      });
    }
  };

  const simulateTyping = async (text: string) => {
    setIsTyping(true);
    setCurrentTypingText('');
    
    for (let i = 0; i <= text.length; i++) {
      setCurrentTypingText(text.substring(0, i));
      await new Promise(resolve => setTimeout(resolve, Math.random() * 20 + 10));
    }
    
    setIsTyping(false);
    setCurrentTypingText('');
    addMessage('assistant', text);
  };

  const processUserMessage = async (message: string) => {
    setIsProcessing(true);
    addMessage('user', message);
    
    try {
      // Analyze emotions for emotional intelligence
      const emotions = analyzeTextEmotions(message);
      const sentiment = analyzeSentiment(message);
      setEmotionalData({ emotions, sentiment });
      
      // Check for task-related content
      const taskInfo = parseTaskFromText(message);
      
      updateUserMemory(message);

      // Detect language
      const detectedLanguage = await detectLanguage(message);
      if (detectedLanguage !== selectedLanguage) {
        console.log(`Detected language: ${detectedLanguage}, currently using: ${selectedLanguage}`);
      }
      
      if (isSkillCommand(message)) {
        const skillResponse = await processSkillCommand(message);
        await simulateTyping(skillResponse.text);
        
        setIsProcessing(false);
        return { 
          shouldSpeak: skillResponse.shouldSpeak, 
          text: skillResponse.text,
          data: skillResponse.data,
          skillType: skillResponse.skillType
        };
      }
      
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const response = await generateAssistantResponse(
        message, 
        chatHistory, 
        activeAssistant,
        selectedLanguage
      );
      
      await simulateTyping(response);
      
      if (activeMode === 'voice' || activeMode === 'face' || inputMode === 'voice') {
        return { shouldSpeak: true, text: response };
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
    
    return { shouldSpeak: false, text: '' };
  };

  return {
    messages,
    input,
    setInput,
    isTyping,
    currentTypingText,
    isProcessing,
    selectedLanguage,
    setSelectedLanguage,
    chatEndRef,
    conversationContext,
    processUserMessage,
    scrollToBottom,
    setMessages,
    emotionalData,
  };
};
