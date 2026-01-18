
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const TASKS_STORAGE_KEY = 'jarvis_tasks';
const ACTIVITY_STORAGE_KEY = 'jarvis_activity_logs';

const TaskManager: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = () => {
    try {
      const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const saveTasks = (tasksToSave: Task[]) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const logActivity = (activityText: string) => {
    try {
      const storedLogs = localStorage.getItem(ACTIVITY_STORAGE_KEY);
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      const newLog = {
        id: Date.now().toString(),
        activity: activityText,
        timestamp: new Date().toISOString()
      };
      const updatedLogs = [newLog, ...logs].slice(0, 50);
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || loading || !user) return;

    setLoading(true);

    try {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedTasks = [newTask, ...tasks];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      logActivity(`Created task: ${newTaskTitle.trim()}`);
      setNewTaskTitle('');
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, completed: !completed, updated_at: new Date().toISOString() }
          : task
      );
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      logActivity(`${!completed ? 'Completed' : 'Uncompleted'} a task`);
      toast.success(`Task ${!completed ? 'completed' : 'marked as incomplete'}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string, title: string) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
      logActivity(`Deleted task: ${title}`);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createTask} className="flex space-x-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title..."
              className="flex-1 bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-400"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !newTaskTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-blue-400">
              Pending Tasks ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No pending tasks</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-gray-900/20 rounded border border-blue-500/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id, task.completed)}
                      />
                      <span className="text-white">{task.title}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => deleteTask(task.id, task.title)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-green-400">
              <CheckCircle className="h-5 w-5 inline mr-2" />
              Completed Tasks ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No completed tasks</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-gray-900/20 rounded border border-green-500/20"
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id, task.completed)}
                      />
                      <span className="text-gray-300 line-through">{task.title}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => deleteTask(task.id, task.title)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default TaskManager;
