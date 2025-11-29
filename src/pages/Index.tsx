import { Link } from 'react-router-dom';
import { CheckSquare, FileText, Bell, Cloud, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Task Manager',
    description: 'Organize tasks with priorities and due dates',
    icon: CheckSquare,
    color: 'from-primary to-primary/70',
    path: '/tasks',
  },
  {
    title: 'Notes',
    description: 'Capture your thoughts and ideas',
    icon: FileText,
    color: 'from-accent to-accent/70',
    path: '/notes',
  },
  {
    title: 'Reminders',
    description: 'Never miss important dates',
    icon: Bell,
    color: 'from-success to-success/70',
    path: '/reminders',
  },
  {
    title: 'Weather',
    description: 'Check weather for any city',
    icon: Cloud,
    color: 'from-warning to-warning/70',
    path: '/weather',
  },
];

export default function Index() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Smart Life Manager
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your all-in-one solution for tasks, notes, reminders, and weather tracking
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={feature.path} className="group block h-full">
                <div className="bg-card rounded-3xl shadow-card hover:shadow-hover transition-all p-8 h-full">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-card group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                    Get started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-3xl shadow-card p-8 border-2 border-destructive/30"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive flex items-center justify-center shadow-card">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Clear & Reset</h3>
              <p className="text-muted-foreground">Manage your data with bulk actions</p>
            </div>
          </div>
          <Link to="/clear-reset">
            <Button variant="destructive" className="rounded-xl">
              Open Clear/Reset
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>

            {/* Footer */}
            <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-8 mb-4"
      >
        <p className="text-sm text-muted-foreground">
          © 2025 Smart Life Manager. All rights reserved.
        </p>
      </motion.div>

    </div>
  );
}
