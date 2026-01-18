
export interface PersistentKnowledge {
  id: string;
  user_id: string;
  content: string;
  type: string;
  related_tags: string[];
  last_used_at: string;
  priority_level: number;
  source_type: string;
  source_ref?: string;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  input_text: string;
  response_text?: string;
  timestamp: string;
  context_tags: string[];
  mood_context?: string;
  emotion_analysis?: any;
}

export interface VoiceInput {
  id: string;
  user_id: string;
  audio_url?: string;
  transcript_text?: string;
  intent_tag?: string;
  is_learned: boolean;
  created_at: string;
}

const KNOWLEDGE_STORAGE_KEY = 'jarvis_persistent_knowledge';
const MEMORY_STORAGE_KEY = 'jarvis_memory';
const VOICE_INPUTS_STORAGE_KEY = 'jarvis_voice_inputs';

const getStoredKnowledge = (): PersistentKnowledge[] => {
  try {
    const stored = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveKnowledge = (knowledge: PersistentKnowledge[]) => {
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(knowledge.slice(-100)));
};

const getStoredMemories = (): Memory[] => {
  try {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveMemories = (memories: Memory[]) => {
  localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories.slice(-200)));
};

const getStoredVoiceInputs = (): VoiceInput[] => {
  try {
    const stored = localStorage.getItem(VOICE_INPUTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveVoiceInputs = (inputs: VoiceInput[]) => {
  localStorage.setItem(VOICE_INPUTS_STORAGE_KEY, JSON.stringify(inputs.slice(-100)));
};

export const memoryService = {
  // Persistent Knowledge methods
  async storePersistentKnowledge(content: string, type: string = 'general', tags: string[] = []): Promise<PersistentKnowledge | null> {
    try {
      const newKnowledge: PersistentKnowledge = {
        id: Date.now().toString(),
        user_id: 'local',
        content,
        type,
        related_tags: tags,
        last_used_at: new Date().toISOString(),
        priority_level: 1,
        source_type: 'user',
        created_at: new Date().toISOString()
      };
      
      const knowledge = getStoredKnowledge();
      knowledge.push(newKnowledge);
      saveKnowledge(knowledge);
      return newKnowledge;
    } catch (error) {
      console.error('Error storing persistent knowledge:', error);
      return null;
    }
  },

  async searchKnowledge(query: string, tags?: string[]): Promise<PersistentKnowledge[]> {
    try {
      const knowledge = getStoredKnowledge();
      const lowerQuery = query.toLowerCase();
      
      let results = knowledge.filter(k => 
        k.content.toLowerCase().includes(lowerQuery)
      );
      
      if (tags && tags.length > 0) {
        results = results.filter(k => 
          tags.some(tag => k.related_tags.includes(tag))
        );
      }
      
      return results
        .sort((a, b) => b.priority_level - a.priority_level)
        .slice(0, 10);
    } catch (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }
  },

  async updateKnowledgePriority(id: string): Promise<void> {
    try {
      const knowledge = getStoredKnowledge();
      const index = knowledge.findIndex(k => k.id === id);
      
      if (index !== -1) {
        knowledge[index].last_used_at = new Date().toISOString();
        knowledge[index].priority_level += 1;
        saveKnowledge(knowledge);
      }
    } catch (error) {
      console.error('Error updating knowledge priority:', error);
    }
  },

  // Memory methods
  async storeMemory(inputText: string, responseText?: string, contextTags: string[] = []): Promise<Memory | null> {
    try {
      const newMemory: Memory = {
        id: Date.now().toString(),
        user_id: 'local',
        input_text: inputText,
        response_text: responseText,
        timestamp: new Date().toISOString(),
        context_tags: contextTags
      };
      
      const memories = getStoredMemories();
      memories.push(newMemory);
      saveMemories(memories);
      return newMemory;
    } catch (error) {
      console.error('Error storing memory:', error);
      return null;
    }
  },

  async getRecentMemories(limit: number = 10): Promise<Memory[]> {
    try {
      return getStoredMemories()
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching memories:', error);
      return [];
    }
  },

  async searchMemories(query: string, contextTags?: string[]): Promise<Memory[]> {
    try {
      const memories = getStoredMemories();
      const lowerQuery = query.toLowerCase();
      
      let results = memories.filter(m => 
        m.input_text.toLowerCase().includes(lowerQuery)
      );
      
      if (contextTags && contextTags.length > 0) {
        results = results.filter(m => 
          contextTags.some(tag => m.context_tags.includes(tag))
        );
      }
      
      return results
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  },

  // Voice Input methods
  async storeVoiceInput(transcriptText: string, audioUrl?: string, intentTag?: string): Promise<VoiceInput | null> {
    try {
      const newVoiceInput: VoiceInput = {
        id: Date.now().toString(),
        user_id: 'local',
        audio_url: audioUrl,
        transcript_text: transcriptText,
        intent_tag: intentTag,
        is_learned: false,
        created_at: new Date().toISOString()
      };
      
      const inputs = getStoredVoiceInputs();
      inputs.push(newVoiceInput);
      saveVoiceInputs(inputs);
      return newVoiceInput;
    } catch (error) {
      console.error('Error storing voice input:', error);
      return null;
    }
  },

  async getVoiceInputs(limit: number = 20): Promise<VoiceInput[]> {
    try {
      return getStoredVoiceInputs()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching voice inputs:', error);
      return [];
    }
  }
};
