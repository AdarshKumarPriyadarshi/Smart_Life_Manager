import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Edit, X } from 'lucide-react';
import { tasksApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { motion } from 'framer-motion';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: number;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 0,
  });

  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  useEffect(() => {
    fetchTasks();
  }, [sortBy]);
  

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await tasksApi.getAll();
      const data = response.data;
  
      // Case 1: backend replies with a message like "No tasks found."
      if (data.message && !data.tasks) {
        setTasks([]);           // show empty state
        // no toast here
        return;
      }
  
      // Case 2: normal success with tasks array (or empty array)
      const rawTasks = data.tasks || [];
  
      const tasksData: Task[] = rawTasks.map((task: any[]) => ({
        id: task[0],
        title: task[1],
        description: task[2],
        due_date: task[3],   // assumed YYYY-MM-DD
        priority: task[4],
      }));
  
      tasksData.sort((a, b) => {
        if (sortBy === 'date') {
          // earliest date first
          return a.due_date.localeCompare(b.due_date);
        } else {
          // higher priority (1 highest) first
          return a.priority - b.priority;
        }
      });
  
      setTasks(tasksData);
    } catch (error: any) {
      // If server returns an error but it only means "no tasks found",
      // do NOT show the toast.
      const msg = error?.response?.data?.message;
      if (msg && msg.toLowerCase().includes('no tasks found')) {
        setTasks([]);
        return;
      }
  
      // Real error (network/500/etc.)
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingTask) {
        await tasksApi.update(editingTask.id, formData);
        toast.success('Task updated successfully!');
      } else {
        await tasksApi.create(formData);
        toast.success('Task added successfully!');
      }
      fetchTasks();
      handleCloseModal();
    } catch (error) {
      toast.error(editingTask ? 'Failed to update task' : 'Failed to add task');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await tasksApi.delete(id);
      toast.success('Task deleted!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleClearAll = async () => {
    try {
      await tasksApi.clearAll();
      toast.success('All tasks cleared!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to clear tasks');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTask(null);
    setFormData({ title: '', description: '', due_date: '', priority: 0 });
  };

  const getPriorityColor = (priority: number) => {
    // 1 = Highest (red), 5 = Lowest (green)
    if (priority === 1) return 'bg-destructive text-destructive-foreground';   // Highest
    if (priority === 2) return 'bg-warning text-warning-foreground';
    if (priority === 3) return 'bg-warning/70 text-warning-foreground';
    if (priority === 4) return 'bg-success/80 text-success-foreground';
    return 'bg-success text-success-foreground';                               // 5 = Lowest
  };
  const isFormValid =
  formData.title.trim() !== '' &&
  formData.description.trim() !== '' &&
  formData.due_date.trim() !== '' &&
  formData.priority !== 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground">Organize and prioritize your tasks</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
    <Button
      onClick={() => setIsAddModalOpen(true)}
      className="rounded-xl bg-primary hover:bg-primary/90 shadow-card"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Task
    </Button>

    <Button onClick={fetchTasks} variant="outline" className="rounded-xl" disabled={loading}>
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-xl">
          Sort by: {sortBy === 'date' ? 'Date' : 'Priority'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
      <DropdownMenuItem onSelect={() => setSortBy('date')}>
  Date (earliest first)
</DropdownMenuItem>
<DropdownMenuItem onSelect={() => setSortBy('priority')}>
  Priority (1 highest)
</DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>


    <Button
      onClick={() => setConfirmClearAll(true)}
      variant="destructive"
      className="rounded-xl"
      disabled={tasks.length === 0}
    >
      <Trash2 className="w-4 h-4 mr-2" />
      Clear All
    </Button>
  </div>

      </div>

      <div className="bg-card rounded-3xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Priority</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No tasks found. Add your first task to get started!
                  </td>
                </tr>
              ) : (
                tasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`border-t border-border hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">{task.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{task.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{task.description}</td>
                    <td className="px-6 py-4 text-sm">{task.due_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-xl text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(task)} variant="outline" size="sm" className="rounded-lg">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setConfirmDelete(task.id)}
                          variant="destructive"
                          size="sm"
                          className="rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                className="rounded-xl"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Due Date</label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="rounded-xl"
              />

            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priority (1-5)</label>
              <Select
                value={formData.priority === 0 ? undefined : formData.priority.toString()}
                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value, 10) })}
                >
                <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select your priority" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((p) => (
                    <SelectItem key={p} value={p.toString()}>
                      Priority {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    {editingTask ? 'Update' : 'Add'} Task
  </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Clear All Tasks"
        description="Are you sure you want to delete all tasks? This action cannot be undone."
        onConfirm={handleClearAll}
        confirmText="Clear All"
        variant="destructive"
      />

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={() => setConfirmDelete(null)}
          title="Delete Task"
          description="Are you sure you want to delete this task?"
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
