
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  created_at: string;
}

const NOTES_STORAGE_KEY = 'jarvis_notes';

const NotesManager: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = () => {
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    }
  };

  const saveNotesToStorage = (notesToSave: Note[]) => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesToSave));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || loading || !user) return;

    setLoading(true);

    try {
      const newNoteObj: Note = {
        id: Date.now().toString(),
        content: newNote.trim(),
        created_at: new Date().toISOString()
      };

      const updatedNotes = [newNoteObj, ...notes];
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      setNewNote('');
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id: string) => {
    if (!editingContent.trim() || !user) return;

    try {
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, content: editingContent.trim() } : note
      );
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      setEditingId(null);
      setEditingContent('');
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      saveNotesToStorage(updatedNotes);
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent('');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400">Create New Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveNote} className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write your note or command here..."
              rows={4}
              className="bg-gray-900/50 border-blue-500/30 text-white placeholder-gray-400"
            />
            <Button 
              type="submit" 
              disabled={loading || !newNote.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Note'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-blue-500/30 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-blue-400">Your Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No notes yet. Create your first note above!</p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 bg-gray-900/20 rounded border border-blue-500/20"
                >
                  {editingId === note.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="bg-gray-900/50 border-blue-500/30 text-white"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => updateNote(note.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button 
                          size="sm"
                          onClick={cancelEditing}
                          variant="outline"
                          className="border-gray-500"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-xs">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => startEditing(note)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{note.content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotesManager;
