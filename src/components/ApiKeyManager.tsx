import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from './ui/use-toast';
import { apiKeyExists, setApiKey, ApiServiceType } from '../utils/apiKeyManager';

interface ApiKeyManagerProps {
  serviceName: string;
  onApiKeySet?: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ serviceName, onApiKeySet }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKeyValue] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // Only check for ElevenLabs now (Hugging Face is server-side)
    if (serviceName.toLowerCase() === 'elevenlabs') {
      const serviceType = serviceName.toLowerCase() as ApiServiceType;
      const exists = await apiKeyExists(serviceType);
      setHasKey(exists);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // Only allow ElevenLabs keys to be stored locally
    if (serviceName.toLowerCase() !== 'elevenlabs') {
      toast({
        title: "Not Allowed",
        description: "This API key is managed on the server.",
        variant: "destructive",
      });
      return;
    }

    const serviceType = serviceName.toLowerCase() as ApiServiceType;
    await setApiKey(serviceType, apiKey);
    setIsOpen(false);
    setApiKeyValue('');
    setHasKey(true);
    
    toast({
      title: "Success",
      description: `${serviceName} API key has been updated`,
    });

    if (onApiKeySet) {
      onApiKeySet();
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setApiKeyValue('');
    }
  };

  return (
    <>
      <Button
        variant={hasKey ? "outline" : "default"}
        onClick={() => setIsOpen(true)}
        className="w-full mb-4"
      >
        {hasKey ? `Update ${serviceName} API Key` : `Set ${serviceName} API Key`}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasKey ? `Update ${serviceName} API Key` : `Set ${serviceName} API Key`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input 
                id="apiKey" 
                type="password"
                placeholder="Enter your API key" 
                value={apiKey} 
                onChange={(e) => setApiKeyValue(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-muted-foreground">
                Your API key will be stored securely in your browser's local storage.
              </p>
            </div>
            <DialogFooter>
              <Button type="submit">Save API Key</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiKeyManager;
