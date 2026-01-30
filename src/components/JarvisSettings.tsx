import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ApiKeyManager from "./ApiKeyManager";
import { Key, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const JarvisSettings: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              JARVIS AI service configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Hugging Face AI Connected</AlertTitle>
              <AlertDescription className="text-muted-foreground">
                JARVIS is powered by Meta Llama 3.1 via Hugging Face. The API key is securely stored on the server.
              </AlertDescription>
            </Alert>
            
            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">ElevenLabs (Optional for voice)</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Add an ElevenLabs API key to enable voice responses.
              </p>
              <ApiKeyManager serviceName="ElevenLabs" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JarvisSettings;
