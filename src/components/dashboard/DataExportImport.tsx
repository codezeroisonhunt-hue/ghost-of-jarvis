
import React, { useState } from 'react';
import { Download, Upload, Database, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const DataExportImport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportJarvisData = async () => {
    setIsExporting(true);
    
    try {
      const jarvisData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        data: {
          chatHistory: JSON.parse(localStorage.getItem('jarvis-chat-history') || '[]'),
          notes: JSON.parse(localStorage.getItem('jarvis-notes') || '[]'),
          tasks: JSON.parse(localStorage.getItem('jarvis-tasks') || '[]'),
          events: JSON.parse(localStorage.getItem('jarvis-events') || '[]'),
          expenses: JSON.parse(localStorage.getItem('jarvis-expenses') || '[]'),
          activityLogs: JSON.parse(localStorage.getItem('jarvis-activity-logs') || '[]'),
          passwords: JSON.parse(localStorage.getItem('jarvis-passwords') || '[]'),
          recurringTasks: JSON.parse(localStorage.getItem('jarvis-recurring-tasks') || '[]'),
          settings: {
            voicePhrase: localStorage.getItem('jarvis-voice-phrase'),
            theme: localStorage.getItem('jarvis-theme') || 'dark',
            sleepMode: localStorage.getItem('jarvis-sleep-mode') || '5'
          }
        }
      };

      const dataStr = JSON.stringify(jarvisData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jarvis-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported Successfully",
        description: "Your Jarvis data has been exported to a JSON file.",
        duration: 4000
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Could not export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const importJarvisData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (!importedData.version || !importedData.data) {
          throw new Error('Invalid Jarvis backup file format');
        }

        const confirmed = confirm('This will replace all your current Jarvis data. Are you sure you want to continue?');
        
        if (confirmed) {
          // Import all data
          const data = importedData.data;
          
          if (data.chatHistory) localStorage.setItem('jarvis-chat-history', JSON.stringify(data.chatHistory));
          if (data.notes) localStorage.setItem('jarvis-notes', JSON.stringify(data.notes));
          if (data.tasks) localStorage.setItem('jarvis-tasks', JSON.stringify(data.tasks));
          if (data.events) localStorage.setItem('jarvis-events', JSON.stringify(data.events));
          if (data.expenses) localStorage.setItem('jarvis-expenses', JSON.stringify(data.expenses));
          if (data.activityLogs) localStorage.setItem('jarvis-activity-logs', JSON.stringify(data.activityLogs));
          if (data.passwords) localStorage.setItem('jarvis-passwords', JSON.stringify(data.passwords));
          if (data.recurringTasks) localStorage.setItem('jarvis-recurring-tasks', JSON.stringify(data.recurringTasks));
          
          if (data.settings) {
            if (data.settings.voicePhrase) localStorage.setItem('jarvis-voice-phrase', data.settings.voicePhrase);
            if (data.settings.theme) localStorage.setItem('jarvis-theme', data.settings.theme);
            if (data.settings.sleepMode) localStorage.setItem('jarvis-sleep-mode', data.settings.sleepMode);
          }

          toast({
            title: "Data Imported Successfully",
            description: `Imported data from ${new Date(importedData.exportDate).toLocaleDateString()}. Please refresh the page.`,
            duration: 6000
          });
          
          // Refresh page after 2 seconds
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Import Failed",
          description: "Invalid file format or corrupted data.",
          variant: "destructive"
        });
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <Card className="bg-gray-900/50 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={exportJarvisData}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importJarvisData}
              className="hidden"
              id="import-file"
              disabled={isImporting}
            />
            <Button
              asChild
              disabled={isImporting}
              className="bg-green-600 hover:bg-green-700 text-white w-full"
            >
              <label htmlFor="import-file" className="cursor-pointer">
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </label>
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-black/20 p-3 rounded">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-400 mb-1">Export includes:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Chat history and conversations</li>
                <li>Notes, tasks, and events</li>
                <li>Expense records and activity logs</li>
                <li>Passwords and security settings</li>
                <li>Auto-task patterns and preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportImport;
