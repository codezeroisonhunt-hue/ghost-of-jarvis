import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Bot, Check, Copy, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";

const AgentConnection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const mcpUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      toast({ title: "Copied", description: "MCP server URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please select and copy the URL manually.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-foreground p-4 md:p-8">
      <Helmet>
        <title>JARVIS - Agent Connection</title>
        <meta name="description" content="Connect ChatGPT, Claude, or other AI assistants to your JARVIS MCP server." />
      </Helmet>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 border border-primary/60 mb-2 animate-orb-pulse">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight neon-text">Connect an AI Assistant</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Link ChatGPT, Claude, or any MCP-compatible client to your JARVIS account. Your data stays protected by your sign-in.
          </p>
        </div>

        <Card className="glass-panel border-primary/30 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              MCP Server URL
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Paste this URL into your AI assistant's connector settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-primary/20 font-mono text-sm break-all">
              <span className="flex-1">{mcpUrl}</span>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-primary/40 hover:bg-primary/10"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only md:not-sr-only md:ml-2">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This endpoint is OAuth-protected. You will be asked to approve each assistant before it can access your JARVIS tools.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-primary/30 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-primary">Connect</CardTitle>
            <CardDescription className="text-muted-foreground">
              Step-by-step instructions for supported assistants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</span>
                ChatGPT
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground pl-2">
                <li>Open <a href="https://chatgpt.com/#settings/Connectors/Advanced" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">ChatGPT Connectors <ExternalLink className="h-3 w-3" /></a> and enable Developer mode.</li>
                <li>In the chat composer's "+" menu, turn on Developer mode.</li>
                <li>Click "Add sources", then "Connect more".</li>
                <li>Name the connector "JARVIS" and paste the MCP URL above.</li>
                <li>Approve the OAuth prompt, then ask ChatGPT to use JARVIS.</li>
              </ol>
            </section>

            <div className="border-t border-primary/20" />

            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</span>
                Claude
              </h3>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground pl-2">
                <li>Open <a href="https://claude.ai/customize/connectors?modal=add-custom-connector" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Claude Connectors <ExternalLink className="h-3 w-3" /></a>.</li>
                <li>Name the connector "JARVIS" and paste the MCP URL above.</li>
                <li>Approve the OAuth prompt when Claude asks to connect.</li>
                <li>Enable the connector from the chat composer, then ask Claude to use JARVIS.</li>
              </ol>
            </section>
          </CardContent>
        </Card>

        <Card className="glass-panel border-primary/30 bg-black/40 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <RefreshCw className="h-5 w-5" />
              Refresh after the app changes
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Connected assistants cache the tool list. Refresh the connector after JARVIS ships new tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">ChatGPT</h4>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Open ChatGPT's app preferences and pick JARVIS under "Enabled apps".</li>
                <li>Next to "Information", click "Refresh".</li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Start a new chat and ask ChatGPT to use JARVIS.</li>
              </ol>
            </div>
            <div className="border-t border-primary/20" />
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Claude</h4>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Open the Connectors page and select the JARVIS connector.</li>
                <li>Refresh or update the connector's tools.</li>
                <li>If the URL changed, paste the latest URL from above.</li>
                <li>Ask Claude to use JARVIS.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentConnection;
