import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Edit, X } from 'lucide-react';
import { notesApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { motion } from 'framer-motion';

interface Note {
  id: number;
  content: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [content, setContent] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await notesApi.getAll();
      const data = response.data;
  
      // Backend sends: { "message": "No notes found." } when DB is empty
      if (data.message && !data.notes) {
        setNotes([]);
        // do NOT show toast here
        return;
      }
  
      const rawNotes = data.notes || [];
  
      const notesData = rawNotes.map((note: any[]) => ({
        id: note[0],
        content: note[1],
      }));
  
      setNotes(notesData);
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      if (msg && msg.toLowerCase().includes('no notes found')) {
        setNotes([]);
        // still no toast
      } else {
        toast.error('Failed to fetch notes');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      if (editingNote) {
        await notesApi.update(editingNote.id, { content });
        toast.success('Note updated successfully!');
      } else {
        await notesApi.create({ content });
        toast.success('Note added successfully!');
      }
      fetchNotes();
      handleCloseModal();
    } catch (error) {
      toast.error(editingNote ? 'Failed to update note' : 'Failed to add note');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notesApi.delete(id);
      toast.success('Note deleted!');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleClearAll = async () => {
    try {
      await notesApi.clearAll();
      toast.success('All notes cleared!');
      fetchNotes();
    } catch (error) {
      toast.error('Failed to clear notes');
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setContent(note.content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setContent('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notes Manager</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-accent hover:bg-accent/90 shadow-card">
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
          <Button onClick={fetchNotes} variant="outline" className="rounded-xl" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setConfirmClearAll(true)}
            variant="destructive"
            className="rounded-xl"
            disabled={notes.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="bg-card rounded-3xl shadow-card p-12 text-center">
          <p className="text-muted-foreground">No notes found. Add your first note to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-3xl shadow-card hover:shadow-hover transition-all p-6 relative group"
            >
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => handleEdit(note)} variant="outline" size="sm" className="rounded-lg">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setConfirmDelete(note.id)}
                  variant="destructive"
                  size="sm"
                  className="rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">ID: {note.id}</span>
              </div>
              <div className="pr-20 max-h-48 overflow-y-auto">
                <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
            <DialogDescription>
              {editingNote ? 'Update your note content below.' : 'Create a new note to capture your thoughts.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note here..."
                className="rounded-xl min-h-[200px]"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCloseModal} variant="outline" className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="flex-1 rounded-xl bg-accent hover:bg-accent/90">
                {editingNote ? 'Update' : 'Add'} Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Clear All Notes"
        description="Are you sure you want to delete all notes? This action cannot be undone."
        onConfirm={handleClearAll}
        confirmText="Clear All"
        variant="destructive"
      />

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
          title="Delete Note"
          description="Are you sure you want to delete this note?"
          onConfirm={() => {
            handleDelete(confirmDelete);
            setConfirmDelete(null);
          }}
          confirmText="Delete"
          variant="destructive"
        />
      )}
    </motion.div>
  );
}
