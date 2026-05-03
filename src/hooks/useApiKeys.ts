import { useState, useEffect } from 'react';
import { toast } from '../components/ui/use-toast';

export interface ApiKeys {
  groqKey: string;
  elevenLabsKey: string;
}

export interface ApiKeyValidation {
  groqKeyValid: boolean;
  elevenLabsKeyValid: boolean;
  errors: {
    groqKey?: string;
    elevenLabsKey?: string;
  };
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    // Purge any previously-cached default Groq key from localStorage
    const storedGroq = localStorage.getItem('groqKey') || '';
    if (storedGroq.startsWith('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')) {
      localStorage.removeItem('groqKey');
    }
    return {
      groqKey: localStorage.getItem('groqKey') || '',
      elevenLabsKey: localStorage.getItem('elevenLabsKey') || ''
    };
  });

  // Validate API keys whenever they change
  useEffect(() => {
    const validation = validateApiKeys();
    if (validation.errors.groqKey || validation.errors.elevenLabsKey) {
      // Only show validation errors if keys are not empty (to avoid initial load errors)
      if (apiKeys.groqKey && !validation.groqKeyValid) {
        toast({
          title: "Groq API Key Error",
          description: validation.errors.groqKey,
          variant: "destructive",
        });
      }
      if (apiKeys.elevenLabsKey && !validation.elevenLabsKeyValid) {
        toast({
          title: "ElevenLabs API Key Error",
          description: validation.errors.elevenLabsKey,
          variant: "destructive",
        });
      }
    }
  }, [apiKeys]);

  // Persist API keys to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('groqKey', apiKeys.groqKey);
      localStorage.setItem('elevenLabsKey', apiKeys.elevenLabsKey);
    } catch (error) {
      console.error('Failed to save API keys to localStorage:', error);
      toast({
        title: "Storage Error",
        description: "Failed to save API keys. Please check your browser settings.",
        variant: "destructive",
      });
    }
  }, [apiKeys]);

  const updateApiKeys = (keys: Partial<ApiKeys>) => {
    try {
      setApiKeys(prev => {
        const newKeys = { ...prev, ...keys };
        return newKeys;
      });
    } catch (error) {
      console.error('Failed to update API keys:', error);
      toast({
        title: "Update Error",
        description: "Failed to update API keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateApiKeys = (): ApiKeyValidation => {
    const validation: ApiKeyValidation = {
      groqKeyValid: false,
      elevenLabsKeyValid: false,
      errors: {}
    };

    // Groq API key validation
    const groqKeyRegex = /^gsk_[a-zA-Z0-9]{48}$/;
    if (!apiKeys.groqKey) {
      validation.errors.groqKey = "Groq API key is required";
    } else if (!groqKeyRegex.test(apiKeys.groqKey)) {
      validation.errors.groqKey = "Invalid Groq API key format. Should start with 'gsk_' followed by 48 characters";
    } else {
      validation.groqKeyValid = true;
    }

    // ElevenLabs API key validation
    const elevenLabsKeyRegex = /^[a-zA-Z0-9]{32}$/;
    if (!apiKeys.elevenLabsKey) {
      validation.errors.elevenLabsKey = "ElevenLabs API key is required";
    } else if (!elevenLabsKeyRegex.test(apiKeys.elevenLabsKey)) {
      validation.errors.elevenLabsKey = "Invalid ElevenLabs API key format. Should be 32 characters long";
    } else {
      validation.elevenLabsKeyValid = true;
    }

    return validation;
  };

  const clearApiKeys = () => {
    try {
      localStorage.removeItem('groqKey');
      localStorage.removeItem('elevenLabsKey');
      setApiKeys({
        groqKey: '',
        elevenLabsKey: ''
      });
      toast({
        title: "API Keys Cleared",
        description: "All API keys have been removed from storage.",
      });
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      toast({
        title: "Error",
        description: "Failed to clear API keys. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    apiKeys,
    updateApiKeys,
    validateApiKeys,
    clearApiKeys
  };
};
