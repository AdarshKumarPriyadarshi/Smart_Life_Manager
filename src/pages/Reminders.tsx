import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Edit, X, Star } from 'lucide-react';
import { remindersApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { motion } from 'framer-motion';

interface Reminder {
  id: number;
  content: string;
  date: string;
}

interface TodayReminder {
  id: number;
  content: string;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [todayReminders, setTodayReminders] = useState<TodayReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({ content: '', date: '' });
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [allResponse, todayResponse] = await Promise.all([
        remindersApi.getAll(),
        remindersApi.getToday(),
      ]);
  
      const allData = allResponse.data;
      const todayData = todayResponse.data;
  
      // Handle "no reminders" from /reminders
      let allReminders: Reminder[] = [];
      if (allData.message && !allData.reminders) {
        allReminders = [];
      } else {
        const rawAll = allData.reminders || [];
        allReminders = rawAll.map((r: any[]) => ({
          id: r[0],
          content: r[1],
          date: r[2],
        }));
      }
  
      // Handle "no reminders for today" from /reminders/today
      let todayRem: TodayReminder[] = [];
      if (todayData.message && !todayData.today_reminders) {
        todayRem = [];
      } else {
        const rawToday = todayData.today_reminders || [];
        todayRem = rawToday.map((r: any[]) => ({
          id: r[0],
          content: r[1],
        }));
      }
  
      setReminders(allReminders.sort((a, b) => a.date.localeCompare(b.date)));
      setTodayReminders(todayRem);
    } catch (error: any) {
      const msgAll = error?.response?.data?.message;
      if (msgAll && msgAll.toLowerCase().includes('no reminders')) {
        // treat as empty, no toast
        setReminders([]);
        setTodayReminders([]);
      } else {
        toast.error('Failed to fetch reminders');
      }
    } finally {
      setLoading(false);
    }
  };
  

  const handleSubmit = async () => {
    if (!formData.content.trim() || !formData.date) {
      toast.error('Content and date are required');
      return;
    }

    try {
      if (editingReminder) {
        await remindersApi.update(editingReminder.id, formData);
        toast.success('Reminder updated successfully!');
      } else {
        await remindersApi.create(formData);
        toast.success('Reminder added successfully!');
      }
      fetchReminders();
      handleCloseModal();
    } catch (error) {
      toast.error(editingReminder ? 'Failed to update reminder' : 'Failed to add reminder');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remindersApi.delete(id);
      toast.success('Reminder deleted!');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleClearAll = async () => {
    try {
      await remindersApi.clearAll();
      toast.success('All reminders cleared!');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to clear reminders');
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({ content: reminder.content, date: reminder.date });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
    setFormData({ content: '', date: '' });
  };

  const isFormValid =
  formData.content.trim() !== '' &&
  formData.date.trim() !== '';


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reminders</h1>
          <p className="text-muted-foreground">Never miss an important date</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90 shadow-card">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
          <Button onClick={fetchReminders} variant="outline" className="rounded-xl" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setConfirmClearAll(true)}
            variant="destructive"
            className="rounded-xl"
            disabled={reminders.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Today's Reminders */}
      {todayReminders.length > 0 && (
        <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-3xl shadow-card p-6 border-2 border-accent/30">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-accent fill-accent" />
            <h2 className="text-xl font-bold text-foreground">Today's Reminders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-card rounded-2xl p-4 shadow-soft hover:shadow-hover transition-all"
              >
                <div className="flex justify-between items-start">
                  <p className="text-foreground font-medium flex-1">{reminder.content}</p>
                  <span className="text-xs text-muted-foreground ml-2">ID: {reminder.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Reminders */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">All Reminders</h2>
        {reminders.length === 0 ? (
          <div className="bg-card rounded-3xl shadow-card p-12 text-center">
            <p className="text-muted-foreground">No reminders found. Add your first reminder to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((reminder) => (
              <motion.div
                key={reminder.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-card rounded-3xl shadow-card hover:shadow-hover transition-all p-6 relative group"
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => handleEdit(reminder)} variant="outline" size="sm" className="rounded-lg">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setConfirmDelete(reminder.id)}
                    variant="destructive"
                    size="sm"
                    className="rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-2 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">ID: {reminder.id}</span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    {reminder.date}
                  </span>
                </div>
                <p className="text-foreground pr-20">{reminder.content}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Add New Reminder'}</DialogTitle>
            <DialogDescription>
              {editingReminder ? 'Update your reminder details below.' : 'Create a new reminder so you never miss important dates.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="What do you want to be reminded about?"
                className="rounded-xl"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="rounded-xl"
              />

            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCloseModal} variant="outline" className="flex-1 rounded-xl">
                              Cancel
                            </Button>
                            <Button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editingReminder ? 'Update' : 'Add'} Reminder
              </Button>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Clear All Reminders"
        description="Are you sure you want to delete all reminders? This action cannot be undone."
        onConfirm={handleClearAll}
        confirmText="Clear All"
        variant="destructive"
      />

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
          title="Delete Reminder"
          description="Are you sure you want to delete this reminder?"
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
