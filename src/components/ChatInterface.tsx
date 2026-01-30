import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Terminal, Heart, Brain, Camera, Globe, Calendar, Mail, VolumeX, Volume2 } from 'lucide-react';
import { SecureApiClient } from '../utils/secureApiClient';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'jarvis';
  timestamp: Date;
};

type JarvisMode = 'assistant' | 'hacker' | 'girlfriend' | 'translator' | 'vision';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0, 
      text: "Hello, I'm JARVIS. How can I assist you today?", 
      sender: 'jarvis',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [jarvisMode, setJarvisMode] = useState<JarvisMode>('assistant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hackerOutput, setHackerOutput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsSpeaking(false);
    };
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Update audio volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hackerOutput]);

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const inputLower = input.toLowerCase();

    // Handle play YouTube command
    if (inputLower.startsWith("play ")) {
      const query = inputLower.replace("play", "").trim();
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      window.open(url, "_blank");
      setInput('');
      return;
    }

    const newUserMessage: Message = {
      id: messages.length,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, newUserMessage]);
    processUserInput(input);
    setInput('');
  };

  const processUserInput = async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      // Use secure API client instead of direct API calls
      const chatMessages = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Add current user input
      chatMessages.push({
        role: 'user',
        content: userInput
      });

      const response = await SecureApiClient.sendChatMessage(chatMessages);
      
      if (response.success && response.message) {
        const jarvisResponse: Message = {
          id: messages.length + 1,
          text: response.message,
          sender: 'jarvis',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, jarvisResponse]);
        speakText(response.message);
      } else {
        throw new Error('Invalid response from AI service');
      }
      
    } catch (error) {
      console.error('Error processing user input:', error);
      
      // Fallback response for security
      let fallbackResponse = '';
      
      if (jarvisMode === 'assistant') {
        fallbackResponse = `I'm currently experiencing technical difficulties. Your request "${userInput}" has been noted, but I cannot process it right now. Please try again later.`;
      } else if (jarvisMode === 'hacker') {
        setHackerOutput(`> Error: Unable to execute command: ${userInput}\n> System temporarily unavailable\n> Please try again later.`);
        fallbackResponse = `Hacker mode is temporarily unavailable. Security protocols are active.`;
      } else if (jarvisMode === 'girlfriend') {
        fallbackResponse = `Oh no, I'm having some technical issues right now! 💔 I heard what you said about "${userInput}" but I can't respond properly. Can you try again in a moment?`;
      } else if (jarvisMode === 'translator') {
        fallbackResponse = `Translation services are temporarily unavailable. I cannot process "${userInput}" right now.`;
      } else if (jarvisMode === 'vision') {
        fallbackResponse = `Vision analysis is temporarily unavailable. Cannot process your request about "${userInput}".`;
      }

      const errorResponse: Message = {
        id: messages.length + 1,
        text: fallbackResponse,
        sender: 'jarvis',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (isMuted) return;
    
    // Simulate text-to-speech
    setIsSpeaking(true);
    
    setTimeout(() => {
      setIsSpeaking(false);
    }, 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileMessage: Message = {
      id: messages.length,
      text: `I've uploaded a file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([...messages, fileMessage]);
    
    // Simulate file processing response
    setTimeout(() => {
      let responseText = `I've received your file "${file.name}". `;
      
      if (file.name.endsWith('.pdf')) {
        responseText += 'I can analyze and summarize this PDF for you.';
      } else if (file.name.endsWith('.jpg') || file.name.endsWith('.png')) {
        responseText += jarvisMode === 'vision' 
          ? 'I can detect objects in this image and extract any text.' 
          : 'I can extract text from this image or analyze its content.';
      } else if (file.name.endsWith('.dng')) {
        responseText += 'I can process this DNG file into an HDR image.';
      } else if (file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        responseText += 'I can transcribe this audio file for you.';
      } else {
        responseText += 'I can analyze this file for you.';
      }
      
      const jarvisResponse: Message = {
        id: messages.length + 1,
        text: responseText,
        sender: 'jarvis',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, jarvisResponse]);
      speakText(responseText);
    }, 1500);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isSpeaking && !isMuted) {
      setIsSpeaking(false);
    }
  };

  const renderModeIcon = () => {
    switch (jarvisMode) {
      case 'assistant': return <Brain className="h-5 w-5" />;
      case 'hacker': return <Terminal className="h-5 w-5" />;
      case 'girlfriend': return <Heart className="h-5 w-5" />;
      case 'translator': return <Globe className="h-5 w-5" />;
      case 'vision': return <Camera className="h-5 w-5" />;
    }
  };

  const suggestedCommands = [
    { text: "Tell me a joke", mode: "assistant" },
    { text: "Scan the network", mode: "hacker" },
    { text: "How's my day going?", mode: "girlfriend" },
    { text: "Translate to Spanish", mode: "translator" },
    { text: "Check my calendar", mode: "assistant" }
  ].filter(cmd => cmd.mode === jarvisMode);

  return (
    <div className="flex flex-col h-screen bg-jarvis-dark text-white font-sans">
      {/* Header with mode selection */}
      <header className="p-4 glass-card border-b border-jarvis/30 flex justify-between items-center">
        <h1 className="text-xl font-bold jarvis-logo">JARVIS</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setJarvisMode('assistant')}
            className={`p-2 rounded-lg transition-all ${jarvisMode === 'assistant' ? 'bg-jarvis/20 text-jarvis shadow-jarvis-glow' : 'bg-black/20 text-gray-400 hover:bg-black/30'}`}
          >
            <Brain size={18} />
          </button>
          <button 
            onClick={() => setJarvisMode('hacker')}
            className={`p-2 rounded-lg transition-all ${jarvisMode === 'hacker' ? 'bg-jarvis/20 text-jarvis shadow-jarvis-glow' : 'bg-black/20 text-gray-400 hover:bg-black/30'}`}
          >
            <Terminal size={18} />
          </button>
          <button 
            onClick={() => setJarvisMode('girlfriend')}
            className={`p-2 rounded-lg transition-all ${jarvisMode === 'girlfriend' ? 'bg-jarvis-purple/20 text-jarvis-purple shadow-purple-glow' : 'bg-black/20 text-gray-400 hover:bg-black/30'}`}
          >
            <Heart size={18} />
          </button>
          <button 
            onClick={() => setJarvisMode('translator')}
            className={`p-2 rounded-lg transition-all ${jarvisMode === 'translator' ? 'bg-jarvis/20 text-jarvis shadow-jarvis-glow' : 'bg-black/20 text-gray-400 hover:bg-black/30'}`}
          >
            <Globe size={18} />
          </button>
          <button 
            onClick={() => setJarvisMode('vision')}
            className={`p-2 rounded-lg transition-all ${jarvisMode === 'vision' ? 'bg-jarvis/20 text-jarvis shadow-jarvis-glow' : 'bg-black/20 text-gray-400 hover:bg-black/30'}`}
          >
            <Camera size={18} />
          </button>
        </div>
      </header>

      {/* Main chat area or hacker terminal */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-neon-grid bg-[length:30px_30px]">
        {jarvisMode === 'hacker' && hackerOutput && (
          <div className="terminal-text text-sm bg-black/70 p-4 rounded-xl border border-jarvis/20 shadow-jarvis-glow mb-4">
            <pre>{hackerOutput}</pre>
          </div>
        )}
        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[80%] p-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02]
                ${message.sender === 'user' 
                  ? 'glass-card border-white/20' 
                  : jarvisMode === 'assistant' || jarvisMode === 'translator' || jarvisMode === 'vision'
                    ? 'glass-card border-jarvis/30 shadow-jarvis-glow' 
                    : jarvisMode === 'hacker'
                      ? 'bg-black/70 text-jarvis border border-jarvis/30'
                      : 'glass-card border-jarvis-purple/30 shadow-purple-glow'
                }
              `}
            >
              <div className="break-words">{message.text}</div>
              <div className="text-xs opacity-60 mt-1 text-right">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="glass-card p-3 max-w-[80%] border-jarvis/30">
              <div className="flex space-x-2">
                <div className="h-2 w-2 bg-jarvis rounded-full animate-bounce"></div>
                <div className="h-2 w-2 bg-jarvis rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="h-2 w-2 bg-jarvis rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Suggested commands */}
        {!isProcessing && suggestedCommands.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {suggestedCommands.map((cmd, index) => (
              <button 
                key={index}
                className="command-suggestion"
                onClick={() => {
                  setInput(cmd.text);
                  handleSendMessage();
                }}
              >
                {cmd.text}
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input area - Text only, no microphone */}
      <div className="p-4 glass-card border-t border-jarvis/30 flex flex-col">
        {/* Voice status */}
        {isSpeaking && (
          <div className="mb-2 px-3 py-1 bg-jarvis/10 text-jarvis text-sm rounded-lg flex items-center">
            <div className="h-2 w-2 bg-jarvis rounded-full mr-2 animate-pulse"></div>
            Speaking...
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleMute}
            className="p-2 text-gray-400 hover:text-jarvis transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-jarvis transition-colors"
          >
            <Upload size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-grow p-2 glass-card border-jarvis/20 text-white placeholder-gray-400 focus:outline-none focus:border-jarvis/50 focus:shadow-jarvis-glow"
          />
          
          <button 
            onClick={handleSendMessage}
            disabled={input.trim() === ''}
            className="bg-jarvis/20 text-jarvis p-2 rounded-lg hover:bg-jarvis/30 transition disabled:opacity-50 disabled:cursor-not-allowed border border-jarvis/30 hover:shadow-jarvis-glow"
          >
            <Send size={20} />
          </button>
        </div>
        
        {/* Mode indicator */}
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{jarvisMode.charAt(0).toUpperCase() + jarvisMode.slice(1)} Mode</span>
          <span>{isSpeaking ? "Speaking..." : "Text only"}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
