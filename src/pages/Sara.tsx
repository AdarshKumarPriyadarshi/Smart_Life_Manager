import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, MessageCircle, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sara() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button - SAME as other pages */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border p-6 sticky top-0 bg-background/95 backdrop-blur"
      >
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </motion.div>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Hero Section - SAME style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
            Sara
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI Virtual Assistant
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full text-lg font-semibold border border-indigo-200">
            🚀 Coming Soon
          </div>
        </motion.div>

        {/* Features Grid - SAME style as Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Smart Conversations",
              description: "Natural language chat with context awareness",
              icon: MessageCircle,
              color: "from-indigo-500 to-blue-600",
            },
            {
              title: "Task Automation",
              description: "Auto-create tasks from conversations",
              icon: Zap,
              color: "from-purple-500 to-pink-600",
            },
            {
              title: "Privacy First",
              description: "Your data stays local, fully encrypted",
              icon: Shield,
              color: "from-emerald-500 to-teal-600",
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className={`bg-card rounded-2xl p-8 h-full shadow-card hover:shadow-hover transition-all border border-border group-hover:border-indigo-200`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-105 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section - SAME style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-12 border-t border-border"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Get Ready for Sara
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sign up for early access notifications when Sara launches
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="rounded-xl border-2 border-indigo-200">
              Notify Me
            </Button>
            <Button size="lg" className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
              Watch Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
