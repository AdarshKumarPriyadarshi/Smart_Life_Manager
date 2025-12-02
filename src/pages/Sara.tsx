import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Message = {
  id: string;
  role: "user" | "sara";
  content: string;
  timestamp: Date;
};

const API_BASE = "http://127.0.0.1:8000";
const LLM_API_KEY = "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"; // Replace with your actual key
const LLM_BASE = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are Sara, smart AI assistant for Smart Life Manager. Understand natural language and respond conversationally.

Available actions:
TASKS: "add task [title]", "clear all tasks" 
NOTES: "add note [content]", "clear all notes"
REMINDERS: "add reminder [content]", "show reminders", "clear all reminders"
WEATHER: "weather [city]", "clear weather history" 
NAVIGATION: "go to tasks/notes/reminders/weather/clear"

Fix typos and be helpful. Confirm actions with ✅ or ❌.`;

export default function Sara() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceCommand(transcript);
      };
      
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const addMessage = (role: "user" | "sara", content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      throw new Error('Backend not running on port 8000');
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    if (lower.includes("hey sara") || lower.includes("sara")) {
      addMessage("sara", "Hi! I'm Sara. What can I help with?");
      return;
    }
    addMessage("user", `🎤 ${transcript}`);
    processCommand(transcript);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isProcessing) return;
    addMessage("user", text);
    processCommand(text);
    setInput("");
  };

  const processCommand = async (cmd: string) => {
    setIsProcessing(true);
    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd.includes("show commands")) {
      setShowCommands(true);
      addMessage("sara", "Here are all the commands! 👇");
      setIsProcessing(false);
      return;
    }

    // Navigation commands
    if (lowerCmd.includes("go to tasks") || lowerCmd.includes("open tasks")) {
      navigate("/tasks");
      addMessage("sara", "→ Tasks");
      setIsProcessing(false);
      return;
    }
    if (lowerCmd.includes("go to notes") || lowerCmd.includes("open notes")) {
      navigate("/notes");
      addMessage("sara", "→ Notes");
      setIsProcessing(false);
      return;
    }
    if (lowerCmd.includes("go to reminders") || lowerCmd.includes("open reminders")) {
      navigate("/reminders");
      addMessage("sara", "→ Reminders");
      setIsProcessing(false);
      return;
    }
    if (lowerCmd.includes("go to weather") || lowerCmd.includes("open weather")) {
      navigate("/weather");
      addMessage("sara", "→ Weather");
      setIsProcessing(false);
      return;
    }
    if (lowerCmd.includes("go to clear") || lowerCmd.includes("open clear")) {
      navigate("/clear-reset");
      addMessage("sara", "→ Clear/Reset");
      setIsProcessing(false);
      return;
    }

  //All Tasks Commands ------------------------------
  //1. Add Tasks
if (lowerCmd.includes("add task") || lowerCmd.includes("task")) {
  let title = cmd.replace(/^(add\s+)?task\s*/i, '').trim() || "New Task";
  
  // REMOVE date/time from title for clean name
  title = title.replace(/\s*at\s*\d{1,2}(:\d{2})?\s*(am|pm)?/i, '').trim();
  title = title.replace(/\s*date\s*:\s*\d{1,2}\/\d{1,2}\/\d{4}/i, '').trim();
  
  // Parse date for due_date field
  let due_date = new Date().toISOString().split('T')[0];
  const dateMatch = cmd.match(/date\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) || cmd.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    const [month, day, year] = dateMatch[1].split('/').map(Number);
    due_date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }
  
  // Parse time
  const timeMatch = cmd.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (timeMatch[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12;
    if (timeMatch[3]?.toLowerCase() === 'am' && hour === 12) hour = 0;
    due_date += ` ${String(hour).padStart(2,'0')}:00:00`;
  }
  
  try {
    await apiCall("/tasks", {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),  // 👈 CLEAN TITLE
        description: "Sara AI",
        due_date,             // 👈 PARSED DATE
        priority: 1
      })
    });
    addMessage("sara", `✅ "${title.trim()}" → ${due_date}`);
  } catch {
    addMessage("sara", "❌ Task failed");
  }
  setIsProcessing(false);
  return;
}

//2. Edit Tasks
if (lowerCmd.startsWith("edit task")) {
  const idMatch = cmd.match(/edit task\s+(\d+)/i);
  const titleMatch = cmd.match(/title\s+((?:.(?!date\s+\d|$))*)/i);
  const dateMatch = cmd.match(/date\s*:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  let due_date;
  if (dateMatch) {
    const [month, day, year] = dateMatch[1].split('/').map(Number);
    due_date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  if (!idMatch) {
    addMessage("sara", "❌ Task ID not found for edit");
    setIsProcessing(false);
    return;
  }
  
  const taskId = parseInt(idMatch[1]);
  const newTitle = titleMatch ? titleMatch[1].trim() : undefined;

  try {
    await apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...(newTitle && { title: newTitle }),
        description: "Updated via Sara",
        ...(due_date && { due_date }),
        priority: 1
      })
    });
    addMessage("sara", `✅ Task ${taskId} updated successfully!`);
  } catch {
    addMessage("sara", "❌ Failed to update task");
  }
  setIsProcessing(false);
  return;
}

//3. Delete Tasks
if (lowerCmd.startsWith("delete task")) {
  const idMatch = cmd.match(/delete task\s+(\d+)/i);
  if (!idMatch) {
    addMessage("sara", "❌ Task ID not found for deletion");
    setIsProcessing(false);
    return;
  }
  const taskId = parseInt(idMatch[1]);
  try {
    await apiCall(`/tasks/${taskId}`, { method: 'DELETE' });
    addMessage("sara", `✅ Task ${taskId} deleted successfully!`);
  } catch {
    addMessage("sara", "❌ Failed to delete task");
  }
  setIsProcessing(false);
  return;
}

//4. Clear All tasks
if (lowerCmd.includes("clear all tasks")) {
  try {
    await apiCall('/tasks/clear_all', { method: 'DELETE' });
    addMessage("sara", "✅ All tasks cleared successfully!");
  } catch {
    addMessage("sara", "❌ Failed to clear tasks");
  }
  setIsProcessing(false);
  return;
}


//5. Sort tasks by date
if (lowerCmd.includes("sort tasks by date")) {
  try {
    // Assuming your backend supports sorting with query param ?sort_by=due_date
    const data = await apiCall("/tasks?sort_by=due_date");
    addMessage("sara", `📅 Tasks sorted by date. Check Tasks page.`);
  } catch {
    addMessage("sara", "❌ Failed to sort tasks by date.");
  }
  setIsProcessing(false);
  return;
}

//6. Sort tasks by priority
if (lowerCmd.includes("sort tasks by priority")) {
  try {
    // Assuming your backend supports sorting with query param ?sort_by=priority
    const data = await apiCall("/tasks?sort_by=priority");
    addMessage("sara", `⚡ Tasks sorted by priority. Check Tasks page.`);
  } catch {
    addMessage("sara", "❌ Failed to sort tasks by priority.");
  }
  setIsProcessing(false);
  return;
}


//All weather related commands
if (
  lowerCmd.includes("weather") ||
  lowerCmd.includes("reset weather") ||
  lowerCmd.includes("clear weather") ||
  lowerCmd.includes("weather history") ||
  lowerCmd.includes("reset weather history") ||
  lowerCmd.includes("clear weather history")
) {
  //1. Reset or clear weather history commands
  if (
    lowerCmd.includes("reset weather") ||
    lowerCmd.includes("clear weather") ||
    lowerCmd.includes("reset weather history") ||
    lowerCmd.includes("clear weather history")
  ) {
    try {
      await apiCall("/weather/history/reset", { method: "DELETE" });
      addMessage("sara", "✅ Weather history reset successfully!");
    } catch {
      addMessage("sara", "❌ Failed to reset weather history.");
    }
    setIsProcessing(false);
    return;
  }

  //2. Show weather history command - display as aligned plain-text table
  if (lowerCmd.includes("weather history") || lowerCmd.includes("show weather history")) {
    try {
      const data = await apiCall("/weather/history");
      if (data.history && Array.isArray(data.history) && data.history.length > 0) {
        const header = `City       | Date       | Weather\n-----------|------------|------------------------------\n`;
        const rows = data.history.map((entry: any) => {
          const city = entry.city.padEnd(10, ' ');
          const date = entry.date.padEnd(10, ' ');
          const weather = entry.weather;
          return `${city} | ${date} | ${weather}`;
        }).join("\n");
        const table = header + rows;
        addMessage("sara", `🌤️ Weather History:\n${table}`);
      } else {
        addMessage("sara", "🌤️ No weather history available.");
      }
    } catch {
      addMessage("sara", "❌ Could not fetch weather history.");
    }
    setIsProcessing(false);
    return;
  }

  // Otherwise, treat command as weather query for a city
  const cityMatch = cmd.match(/weather(?:\s+(?:for|in|at))?\s+([a-zA-Z\s]+)/i);
  let city = "Bengaluru"; // Default city
  if (cityMatch && cityMatch[1]) {
    city = cityMatch[1].trim();
  }
  try {
    const data = await apiCall(`/weather/${city}`);
    addMessage("sara", `🌤️ Weather for ${city}: ${JSON.stringify(data.weather)}`);
  } catch {
    addMessage("sara", `❌ Could not fetch weather for ${city}`);
  }
  setIsProcessing(false);
  return;
}

    // LLM fallback
    try {
      const response = await fetch(LLM_BASE, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LLM_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8081"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: cmd }
          ],
          
          max_tokens: 100
        })
      });
      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) {
        addMessage("sara", data.choices[0].message.content);
      } else {
        throw new Error(data.error?.message || 'LLM failed');
      }
    } catch (error: any) {
      console.error("LLM Error:", error);
      addMessage("sara", `🤖 "${cmd}" - Try "add task milk" or "weather Bangalore"`);
    }

    setIsProcessing(false);
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      addMessage("sara", "🎤 Use Chrome for voice");
      return;
    }
    if (isListening) recognition.stop();
    else {
      setIsListening(true);
      recognition.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Sara</h1>
          <p className="text-xl text-gray-600">AI Smart Assistant</p>
        </motion.div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 h-96 overflow-y-auto border shadow-xl">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              "Hey Sara" or "add task milk" 🎤
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-md px-4 py-2 rounded-2xl ${
                  msg.role === "user" ? "bg-blue-500 text-white" : "bg-gradient-to-r from-purple-100 to-pink-100"
                }`}>
                  <p>{msg.content}</p>
                  <p className="text-xs opacity-75 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start mb-4">
              <div className="bg-purple-100 px-4 py-2 rounded-2xl text-sm">Sara thinking... 🤔</div>
            </div>
          )}
          <div ref={inputRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessing ? "..." : "Type or speak..."}
            className="flex-1"
            disabled={isProcessing}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "default"}
            onMouseDown={toggleListening}
            onMouseUp={toggleListening}
            onTouchStart={toggleListening}
            onTouchEnd={toggleListening}
            disabled={isProcessing}
          >
            <Mic className="w-5 h-5" />
            {isListening && <span className="ml-1 animate-pulse">●</span>}
          </Button>
        </form>

        <AnimatePresence>
  {showCommands && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl p-6 border shadow-xl max-h-96 overflow-y-auto"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">📋 Sara Commands</h3>
        <Button variant="ghost" size="icon" onClick={() => setShowCommands(false)}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        
        {/* TASKS */}
        <div>
          <h4 className="font-semibold mb-3 text-purple-600 flex items-center gap-2">
            📋 <span>Tasks</span>
          </h4>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg">
              <span className="font-mono text-sm text-green-600">➕</span>
              <span>"add task buy milk"<br/>
              "task gym Date: 03/12/2025"<br/>
              "Go to gym at 7pm"</span>
            </li>
            <li className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
              <span className="font-mono text-sm text-red-600">🗑️</span>
              <span>"clear all tasks"</span>
            </li>
          </ul>
        </div>

        {/* NAVIGATION */}
        <div>
          <h4 className="font-semibold mb-3 text-indigo-600 flex items-center gap-2">
            🧭 <span>Navigation</span>
          </h4>
          <ul className="space-y-1 text-gray-700">
            <li>• "go to tasks"</li>
            <li>• "open notes"</li>
            <li>• "go to reminders"</li>
            <li>• "go to weather"</li>
            <li>• "go to clear reset"</li>
          </ul>
        </div>

        {/* WEATHER */}
        <div>
          <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2">
            🌤️ <span>Weather</span>
          </h4>
          <ul className="space-y-1 text-gray-700">
            <li>• "weather Bangalore"</li>
            <li>• "weather Bengaluru"</li>
            <li>• "weather Mumbai"</li>
          </ul>
        </div>

        {/* UTILITY */}
        <div className="md:col-span-2">
          <h4 className="font-semibold mb-3 text-gray-700 flex items-center gap-2">
            ⚙️ <span>Utility</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-green-600 block mb-1">Voice Wake</span>
              <span className="text-gray-600">"Hey Sara"</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <span className="font-mono text-emerald-600 block mb-1">This Panel</span>
              <span className="text-gray-600">"show commands"</span>
            </div>
          </div>
        </div>

      </div>
      <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
        💡 Hold mic button 🔴 for voice • Works best in Chrome
      </div>
    </motion.div>
  )}
</AnimatePresence>

      </div>
    </div>
  );
}
