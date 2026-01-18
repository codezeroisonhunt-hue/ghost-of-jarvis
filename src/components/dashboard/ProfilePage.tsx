
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Calendar, Activity } from 'lucide-react';

interface ActivityLog {
  id: string;
  activity: string;
  timestamp: string;
}

const ACTIVITY_STORAGE_KEY = 'jarvis_activity_logs';

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (user) {
      fetchActivityLogs();
    }
  }, [user]);

  const fetchActivityLogs = () => {
    try {
      const storedLogs = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      if (storedLogs) {
        setActivityLogs(JSON.parse(storedLogs));
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">User ID</p>
                  <p className="text-white font-mono text-xs">{user?.id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={signOut}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No activity logged yet</p>
          ) : (
            <div className="space-y-3">
              {activityLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex justify-between items-center p-3 bg-gray-900/20 rounded border border-blue-500/20"
                >
                  <span className="text-white">{log.activity}</span>
                  <span className="text-gray-400 text-sm">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
