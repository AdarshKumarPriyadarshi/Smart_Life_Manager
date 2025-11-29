import { useState } from 'react';
import { Trash2, FileText, CheckSquare, Bell, Cloud } from 'lucide-react';
import { tasksApi, notesApi, remindersApi, weatherApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ConfirmDialog';
import { motion } from 'framer-motion';

export default function ClearReset() {
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleClearTasks = async () => {
    try {
      await tasksApi.clearAll();
      toast.success('All tasks cleared!');
    } catch (error) {
      toast.error('Failed to clear tasks');
    }
  };

  const handleClearNotes = async () => {
    try {
      await notesApi.clearAll();
      toast.success('All notes cleared!');
    } catch (error) {
      toast.error('Failed to clear notes');
    }
  };

  const handleClearReminders = async () => {
    try {
      await remindersApi.clearAll();
      toast.success('All reminders cleared!');
    } catch (error) {
      toast.error('Failed to clear reminders');
    }
  };

  const handleResetWeather = async () => {
    try {
      await weatherApi.resetHistory();
      toast.success('Weather history reset!');
    } catch (error) {
      toast.error('Failed to reset weather history');
    }
  };

  const actions = [
    {
      id: 'tasks',
      title: 'Clear All Tasks',
      description: 'Delete all tasks from your task manager',
      icon: CheckSquare,
      color: 'from-primary to-primary/70',
      action: handleClearTasks,
    },
    {
      id: 'notes',
      title: 'Clear All Notes',
      description: 'Delete all notes from your notes manager',
      icon: FileText,
      color: 'from-accent to-accent/70',
      action: handleClearNotes,
    },
    {
      id: 'reminders',
      title: 'Clear All Reminders',
      description: 'Delete all reminders from your reminders',
      icon: Bell,
      color: 'from-success to-success/70',
      action: handleClearReminders,
    },
    {
      id: 'weather',
      title: 'Reset Weather History',
      description: 'Clear your weather search history',
      icon: Cloud,
      color: 'from-warning to-warning/70',
      action: handleResetWeather,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Clear & Reset</h1>
        <p className="text-muted-foreground">Manage your data with bulk actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl shadow-card hover:shadow-hover transition-all p-8 cursor-pointer h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-6 shadow-card group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{action.title}</h3>
                <p className="text-muted-foreground mb-6">{action.description}</p>
                <Button
                  onClick={() => setConfirmAction(action.id)}
                  variant="destructive"
                  className="w-full rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {action.title}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirm Dialogs */}
      {actions.map((action) => (
        <ConfirmDialog
          key={action.id}
          open={confirmAction === action.id}
          onOpenChange={() => setConfirmAction(null)}
          title={action.title}
          description={`Are you sure you want to ${action.title.toLowerCase()}? This action cannot be undone.`}
          onConfirm={() => {
            action.action();
            setConfirmAction(null);
          }}
          confirmText={action.title}
          variant="destructive"
        />
      ))}
    </motion.div>
  );
}
