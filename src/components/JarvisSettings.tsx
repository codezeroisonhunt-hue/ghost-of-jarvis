import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import ApiKeyManager from "./ApiKeyManager";
import { Key } from "lucide-react";

const JarvisSettings: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Configure API keys for JARVIS AI services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Groq AI (Required for chat)</h4>
              <ApiKeyManager serviceName="Groq" />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">ElevenLabs (Optional for voice)</h4>
              <ApiKeyManager serviceName="ElevenLabs" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JarvisSettings;
