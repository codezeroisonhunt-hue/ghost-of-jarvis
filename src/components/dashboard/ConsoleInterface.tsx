
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ConsoleLog {
  id: string;
  command: string;
  created_at: string;
}

const CONSOLE_STORAGE_KEY = 'jarvis_console_logs';

const ConsoleInterface: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [output, setOutput] = useState<string[]>(['JARVIS Console initialized...', 'Type "help" for available commands.']);
  const [loading, setLoading] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConsoleLogs();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [output]);

  const fetchConsoleLogs = () => {
    try {
      const storedLogs = localStorage.getItem(CONSOLE_STORAGE_KEY);
      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error('Error fetching console logs:', error);
      toast.error('Failed to load console history');
    }
  };

  const saveLogs = (newLogs: ConsoleLog[]) => {
    try {
      localStorage.setItem(CONSOLE_STORAGE_KEY, JSON.stringify(newLogs.slice(-50)));
    } catch (error) {
      console.error('Error saving logs:', error);
    }
  };

  const processCommand = (command: string): string => {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case 'help':
        return `Available commands:
- help: Show this help message
- status: Show system status
- clear: Clear console output
- time: Show current time
- user: Show user information
- files: List uploaded files
- tasks: Show task summary
- version: Show JARVIS version`;
      
      case 'status':
        return `JARVIS System Status:
- Core: Online
- Database: Connected
- User: Authenticated
- Security: Active`;
      
      case 'clear':
        setOutput(['Console cleared.']);
        return '';
      
      case 'time':
        return `Current time: ${new Date().toLocaleString()}`;
      
      case 'user':
        return `User Information:
- ID: ${user?.id}
- Email: ${user?.email}
- Status: Authenticated`;
      
      case 'version':
        return 'JARVIS v2.0 - Just A Rather Very Intelligent System';
      
      default:
        if (cmd.startsWith('echo ')) {
          return cmd.substring(5);
        }
        return `Command not recognized: ${command}
Type "help" for available commands.`;
    }
  };

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCommand.trim() || loading || !user) return;

    setLoading(true);
    const command = currentCommand.trim();

    try {
      // Add command to output
      const commandOutput = `> ${command}`;
      setOutput(prev => [...prev, commandOutput]);

      // Process command
      const result = processCommand(command);
      if (result) {
        setOutput(prev => [...prev, result]);
      }

      // Save to localStorage
      const newLog: ConsoleLog = {
        id: Date.now().toString(),
        command: command,
        created_at: new Date().toISOString()
      };
      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      saveLogs(updatedLogs);

      setCurrentCommand('');
    } catch (error) {
      console.error('Error executing command:', error);
      setOutput(prev => [...prev, 'Error: Failed to execute command']);
      toast.error('Failed to execute command');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    outputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (created_at: string) => {
    return new Date(created_at).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Console Output */}
      <div className="lg:col-span-2">
        <Card className="bg-black/60 border-blue-500/30 backdrop-blur-lg h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              JARVIS Console
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            {/* Output Area */}
            <div className="flex-1 overflow-y-auto bg-black p-4 rounded font-mono text-sm">
              {output.map((line, index) => (
                <div 
                  key={index} 
                  className={`${
                    line.startsWith('>') 
                      ? 'text-blue-400' 
                      : 'text-green-300'
                  } whitespace-pre-wrap`}
                >
                  {line}
                </div>
              ))}
              <div ref={outputRef} />
            </div>

            {/* Command Input */}
            <form onSubmit={executeCommand} className="flex space-x-2">
              <div className="flex-1 flex items-center bg-black rounded px-3">
                <span className="text-blue-400 font-mono mr-2">$</span>
                <Input
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  placeholder="Enter command..."
                  className="border-0 bg-transparent text-white placeholder-gray-400 focus:ring-0 font-mono"
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading || !currentCommand.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Command History */}
      <div>
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-blue-400">Command History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No commands executed yet</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-2 bg-gray-900/20 rounded border border-blue-500/20"
                  >
                    <p className="text-white font-mono text-sm">{log.command}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(log.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsoleInterface;
