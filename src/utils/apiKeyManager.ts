/**
 * API Key Manager for JARVIS
 * 
 * This utility helps manage API keys across the application.
 * API keys are stored securely in localStorage - never hardcoded.
 */

// Define valid API service types
export type ApiServiceType = 'groq' | 'elevenlabs';

/**
 * Check if an API key exists for a service
 */
export const apiKeyExists = async (service: ApiServiceType): Promise<boolean> => {
  const key = localStorage.getItem(`${service.toLowerCase()}_api_key`);
  return !!key;
};

/**
 * Set an API key for a service
 */
export const setApiKey = async (service: ApiServiceType, value: string): Promise<void> => {
  localStorage.setItem(`${service.toLowerCase()}_api_key`, value);
};

/**
 * Get an API key for a service
 */
export const getApiKey = async (service: ApiServiceType): Promise<string | null> => {
  return localStorage.getItem(`${service.toLowerCase()}_api_key`);
};

/**
 * Validate if a Groq API key format is correct
 */
export const validateGroqApiKey = (key: string): boolean => {
  return key.startsWith('gsk_') && key.length > 20;
};

/**
 * Remove an API key for a service
 */
export const removeApiKey = async (service: ApiServiceType): Promise<void> => {
  localStorage.removeItem(`${service.toLowerCase()}_api_key`);
};

/**
 * Get voice ID for the assistant
 */
export function getVoiceId(): string {
  return 'iP95p4xoKVk53GoZ742B'; // Chris voice from ElevenLabs
}
