import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Send, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Extend window with SpeechRecognition for TypeScript
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

type Section = "tasks" | "notes" | "reminders" | "weather" | "clear";

const API_BASE = "http://127.0.0.1:8000";
const LLM_API_KEY = "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"; // Replace with your actual key
const LLM_BASE = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are Sara, AI Smart Assistant for Smart Life Manager.
Always respond as Sara and never reveal service identity.
You assist with Tasks, Notes, Reminders, Weather, Clear operations.

Confirm actions with ✅ or ❌.
Give friendly, helpful, concise responses.`;

export default function Sara() {
  const navigate = useNavigate();

  // Chat messages per section to persist history on tab switch
  const [messagesBySection, setMessagesBySection] = useState<Record<Section, Message[]>>({
    tasks: [],
    notes: [],
    reminders: [],
    weather: [],
    clear: [],
  });

  // Current visible chat section
  const [activeSection, setActiveSection] = useState<Section>("tasks");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);
  const recognitionContinuousRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); // ✅ ADD THIS LINE


  // Form state for add/edit/delete for each manager category
  type FormType =
    | "addTask"
    | "editTask"
    | "deleteTask"
    | "addNote"
    | "editNote"
    | "deleteNote"
    | "addReminder"
    | "editReminder"
    | "deleteReminder"
    | "weatherSearch"
    | "clearAll";

  const [currentForm, setCurrentForm] = useState<FormType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formStep, setFormStep] = useState<number>(0);

  // Initialize speech recognition states
  useEffect(() => {
    if (
      "webkitSpeechRecognition" in window ||
      "SpeechRecognition" in window
    ) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      // Single phrase recognition for tap-hold
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        addUserMessageAndProcess(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      // Continuous recognition for long press
      const contRecog = new SpeechRecognition();
      contRecog.continuous = true;
      contRecog.interimResults = false;
      contRecog.lang = "en-US";

      contRecog.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            addUserMessageAndProcess(transcript);
          }
        }
      };

      contRecog.onend = () => {
        setIsListening(false);
      };

      recognitionContinuousRef.current = contRecog;
    }
  }, []);  // ← Speech recognition ends

  // ✅ AUTO SCROLL useEffect
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ FIXED setSection
  const setSection = (section: Section) => {
    setMessagesBySection((prev) => ({ ...prev, [activeSection]: messages }));
    setMessages(messagesBySection[section] || []);
    setActiveSection(section);
    resetForm();
    setShowCommands(false);
    setTimeout(scrollToBottom, 200);
  };
 // ← Ends here
    

  // Add message both to state and current section storage
  const addMessage = (role: "user" | "sara", content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
    setMessagesBySection((prev) => ({
      ...prev,
      [activeSection]: [...(prev[activeSection] || []), message],
    }));
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Helper to add user message and auto process command
  const addUserMessageAndProcess = (text: string) => {
    addMessage("user", text);
    processCommand(text);
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw new Error("Backend not running on port 8000");
    }
  };

  // Voice button logic for tap and hold continuous recognition
  const voiceButtonHandlers = {
    onMouseDown: () => {
      if (!recognitionRef.current) {
        addMessage("sara", "🎤 Use Chrome or Edge for voice.");
        return;
      }
      // Start single phrase recognition
      setIsListening(true);
      recognitionRef.current.start();
      voiceButtonHandlers._holdTimeout = window.setTimeout(() => {
        // Switch to continuous recognition after 3 seconds
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (recognitionContinuousRef.current) {
          recognitionContinuousRef.current.start();
        }
      }, 3000);
    },
    onMouseUp: () => {
      clearTimeout(voiceButtonHandlers._holdTimeout);
      if (recognitionContinuousRef.current) {
        recognitionContinuousRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    },
    _holdTimeout: 0 as number,
  };

  // Main command processor ruling operations vs LLM fallback
  const processCommand = async (cmd: string) => {
    if (isProcessing) return; // Prevent re-entrancy
    setIsProcessing(true);
    const lowerCmd = cmd.toLowerCase().trim();

    try {
      // Greeting handling
      const greetingKeywords = [
        "hey sara",
        "hi sara",
        "hello sara",
        "how are you",
        "hey",
        "hi",
        "hello",
        "good morning", 
        "good afternoon", 
        "good evening",
      ];
      if (greetingKeywords.some((kw) => lowerCmd.includes(kw))) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "sara" && lastMessage.content.includes("I'm Sara")) {
          addMessage("sara", "What can I help you with? Try \"Add task milk\" or \"Weather Bangalore\".");
        } else {
          addMessage("sara", "👋 Hey! I'm Sara, your AI Smart Assistant.\nHow can I help you today? 🎤");
        }
      
        setIsProcessing(false);  // ✅ ADD THIS LINE HERE
      
        return;
      }
      

      // Check if current form is open; handle step inputs in form
      if (currentForm) {
        if (currentForm.startsWith("add")) {
          await handleTaskNoteReminderWeatherFormInputs(cmd);
          return;
        }
        if (currentForm.startsWith("edit")) {
          await handleTaskNoteReminderWeatherFormInputs(cmd);
          return;
        }
        if (
          currentForm === "deleteTask" ||
          currentForm === "deleteNote" ||
          currentForm === "deleteReminder"
        ) {
          await handleTaskNoteReminderWeatherFormInputs(cmd);
          return;
        }
        if (currentForm === "clearAll") {
          await handleClearAllForm(cmd);
          return;
        }
      }

      // Determine if command matches project operations keywords
      const opsKeywords = [
        "task",
        "add task",
        "edit task",
        "delete task",
        "clear all tasks",
        "sort tasks",
        "note",
        "add note",
        "edit note",
        "delete note",
        "clear all notes",
        "reminder",
        "add reminder",
        "edit reminder",
        "delete reminder",
        "clear all reminders",
        "show reminders",
        "weather",
        "weather history",
        "clear weather history",
        "reset weather history",
        "go to",
        "open",
        "clear",
        "reset",
      ];

      const containsOpsKeyword = opsKeywords.some((keyword) => lowerCmd.includes(keyword));

      if (containsOpsKeyword) {
        await handleProjectOperations(cmd, lowerCmd);
        return;
      }

      // No project keyword: fallback to LLM for chat
      const response = await fetch(LLM_BASE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LLM_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8081",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: cmd },
          ],
          max_tokens: 150,
        }),
      });

      const data = await response.json();
      if (response.ok && data.choices?.[0]?.message?.content) {
        addMessage("sara", data.choices[0].message.content);
      } else {
        addMessage("sara", "Sorry, I couldn't get a good answer right now.");
      }
    } catch (error) {
      console.error("LLM call failed:", error);
      addMessage("sara", "Sorry, I'm having trouble connecting to the assistant.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ COMPLETE Handlers for ALL project ops forms
const handleTaskNoteReminderWeatherFormInputs = async (input: string) => {
  // ============ TASKS ============
  if (currentForm === "addTask") {
    if (formStep === 0) {
      setFormData({ ...formData, title: input });
    } else if (formStep === 1) {
      setFormData({ ...formData, description: input });
    } else if (formStep === 2) {
      setFormData({ ...formData, due_date: input });
    } else if (formStep === 3) {
      setFormData({ ...formData, priority: Number(input) || 1 });
    }

    if (formStep < 3) {
      setFormStep(formStep + 1);
    } else {
      try {
        await apiCall("/tasks", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        addMessage("sara", `✅ Task "${formData.title}" added successfully!`);
      } catch (error) {
        console.error("Failed to add task:", error);
        addMessage("sara", "❌ Failed to add task.");
      }
      resetForm();
    }
  }

  // ✅ EDIT TASK
  else if (currentForm === "editTask") {
    if (formStep === 0) {
      setFormData({ ...formData, taskId: input });
      setFormStep(1);
    } else {
      // Submit edit
      try {
        const updateBody: any = {};
        if (formData.title) updateBody.title = formData.title;
        if (formData.due_date) updateBody.due_date = formData.due_date;
        updateBody.description = "Updated via Sara";
        updateBody.priority = formData.priority || 1;
        
        await apiCall(`/tasks/${formData.taskId}`, {
          method: "PUT",
          body: JSON.stringify(updateBody),
        });
        addMessage("sara", `✅ Task ${formData.taskId} updated successfully!`);
      } catch (error) {
        console.error("Failed to update task:", error);
        addMessage("sara", "❌ Failed to update task.");
      }
      resetForm();
    }
  }

  // ✅ DELETE TASK
  else if (currentForm === "deleteTask") {
    try {
      await apiCall(`/tasks/${input}`, { method: "DELETE" });
      addMessage("sara", `✅ Task ${input} deleted successfully!`);
    } catch (error) {
      console.error("Failed to delete task:", error);
      addMessage("sara", "❌ Failed to delete task.");
    }
    resetForm();
  }

  // ============ NOTES ============
  else if (currentForm === "addNote") {
    if (formStep === 0) {
      setFormData({ ...formData, title: input });
    } else {
      // Submit note
      try {
        await apiCall("/notes", {
          method: "POST",
          body: JSON.stringify({ title: formData.title, content: input }),
        });
        addMessage("sara", `✅ Note "${formData.title}" added!`);
      } catch (error) {
        console.error("Failed to add note:", error);
        addMessage("sara", "❌ Failed to add note.");
      }
      resetForm();
    }
  }

  else if (currentForm === "editNote") {
    if (formStep === 0) {
      setFormData({ ...formData, noteId: input });
      setFormStep(1);
    } else {
      try {
        await apiCall(`/notes/${formData.noteId}`, {
          method: "PUT",
          body: JSON.stringify({ content: input }),
        });
        addMessage("sara", `✅ Note ${formData.noteId} updated!`);
      } catch (error) {
        addMessage("sara", "❌ Failed to update note.");
      }
      resetForm();
    }
  }

  else if (currentForm === "deleteNote") {
    try {
      await apiCall(`/notes/${input}`, { method: "DELETE" });
      addMessage("sara", `✅ Note ${input} deleted!`);
    } catch (error) {
      addMessage("sara", "❌ Failed to delete note.");
    }
    resetForm();
  }

  // ============ REMINDERS ============
  else if (currentForm === "addReminder") {
    if (formStep === 0) {
      setFormData({ ...formData, title: input });
    } else if (formStep === 1) {
      setFormData({ ...formData, due_date: input });
    } else {
      try {
        await apiCall("/reminders", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        addMessage("sara", `✅ Reminder "${formData.title}" added!`);
      } catch (error) {
        addMessage("sara", "❌ Failed to add reminder.");
      }
      resetForm();
    }
  }

  else if (currentForm === "editReminder") {
    if (formStep === 0) {
      setFormData({ ...formData, reminderId: input });
      setFormStep(1);
    } else {
      try {
        await apiCall(`/reminders/${formData.reminderId}`, {
          method: "PUT",
          body: JSON.stringify({ title: input }),
        });
        addMessage("sara", `✅ Reminder ${formData.reminderId} updated!`);
      } catch (error) {
        addMessage("sara", "❌ Failed to update reminder.");
      }
      resetForm();
    }
  }

  else if (currentForm === "deleteReminder") {
    try {
      await apiCall(`/reminders/${input}`, { method: "DELETE" });
      addMessage("sara", `✅ Reminder ${input} deleted!`);
    } catch (error) {
      addMessage("sara", "❌ Failed to delete reminder.");
    }
    resetForm();
  }

  // ============ WEATHER ============
  else if (currentForm === "weatherSearch") {
    try {
      const weather = await apiCall(`/weather?city=${encodeURIComponent(input)}`);
      addMessage("sara", `🌤️ ${input}: ${weather.summary || weather.temp}°C`);
    } catch (error) {
      addMessage("sara", `❌ Weather for ${input} not available.`);
    }
    resetForm();
  }

  // ============ CLEAR ALL ============
  else if (currentForm === "clearAll") {
    await handleClearAllForm(input);
  }

  setIsProcessing(false);  // ✅ ALWAYS RESET PROCESSING
};


  // Handle Clear All form (choose what to clear)
  const handleClearAllForm = async (input: string) => {
    const section = input.toLowerCase().trim();
    try {
      switch (section) {
        case "tasks":
          await apiCall("/tasks/clear_all", { method: "DELETE" });
          addMessage("sara", "✅ All tasks cleared.");
          break;
        case "notes":
          await apiCall("/notes/clear_all", { method: "DELETE" });
          addMessage("sara", "✅ All notes cleared.");
          break;
        case "reminders":
          await apiCall("/reminders/clear_all", { method: "DELETE" });
          addMessage("sara", "✅ All reminders cleared.");
          break;
        case "weather":
        case "weather history":
          await apiCall("/weather/history/reset", { method: "DELETE" });
          addMessage("sara", "✅ Weather history reset.");
          break;
        default:
          addMessage(
            "sara",
            "⚠️ Unknown clear option. Please specify tasks, notes, reminders, or weather."
          );
          break;
      }
    } catch (error) {
      console.error("Failed to clear data:", error);
      addMessage("sara", "❌ Failed to clear specified data.");
    }
    resetForm();
  };

  // COMPLETE handleProjectOperations for ALL Smart Life Manager operations
const handleProjectOperations = async (cmd: string, lowerCmd: string) => {
  // ✅ 1. ADD TASK - Start form or parse natural input
  if (lowerCmd.includes("add task")) {
    setCurrentForm("addTask");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "📝 Add Task Form Started!\nStep 1/4: Task title?");
    return;
  }

  // ✅ 2. SMART PARSING - "Add task Gym at 7pm"
  if (lowerCmd.includes("task") && !currentForm) {
    const titleMatch = cmd.match(/task\s+(.+)/i);
    if (titleMatch) {
      setCurrentForm("addTask");
      setFormData({ title: titleMatch[1].trim() });
      setFormStep(1);
      addMessage("sara", `✅ Title: "${titleMatch[1].trim()}"\nStep 2/4: Description? (optional)`);
      return;
    }
  }

  // ✅ 3. EDIT TASK - Start form
  if (lowerCmd.includes("edit task")) {
    setCurrentForm("editTask");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "✏️ Edit Task Form Started!\nStep 1/3: Task ID?");
    return;
  }

  // ✅ 4. DELETE TASK
  if (lowerCmd.includes("delete task")) {
    setCurrentForm("deleteTask");
    setFormData({});
    addMessage("sara", "🗑️ Delete Task\nEnter Task ID to delete:");
    return;
  }

  // ✅ 5. CLEAR ALL TASKS
  if (lowerCmd.includes("clear all tasks") || lowerCmd.includes("clear tasks")) {
    try {
      await apiCall("/tasks/clear_all", { method: "DELETE" });
      addMessage("sara", "✅ All tasks cleared successfully!");
    } catch (error) {
      console.error("Failed to clear tasks:", error);
      addMessage("sara", "❌ Failed to clear tasks");
    }
    return;
  }

  // ✅ 6. SORT TASKS
  if (lowerCmd.includes("sort tasks by date") || lowerCmd.includes("sort by date")) {
    try {
      await apiCall("/tasks?sort_by=due_date");
      addMessage("sara", `📅 Tasks sorted by date. Check Tasks page.`);
    } catch (error) {
      console.error("Failed to sort tasks by date:", error);
      addMessage("sara", "❌ Failed to sort tasks by date.");
    }
    return;
  }

  if (lowerCmd.includes("sort tasks by priority") || lowerCmd.includes("sort by priority")) {
    try {
      await apiCall("/tasks?sort_by=priority");
      addMessage("sara", `⚡ Tasks sorted by priority. Check Tasks page.`);
    } catch (error) {
      console.error("Failed to sort tasks by priority:", error);
      addMessage("sara", "❌ Failed to sort tasks by priority.");
    }
    return;
  }

  // ============ NOTES OPERATIONS ============
  // ✅ 7. ADD NOTE
  if (lowerCmd.includes("add note")) {
    setCurrentForm("addNote");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "📝 Add Note Form Started!\nStep 1/2: Note title?");
    return;
  }

  // ✅ 8. EDIT NOTE
  if (lowerCmd.includes("edit note")) {
    setCurrentForm("editNote");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "✏️ Edit Note Form Started!\nStep 1/2: Note ID?");
    return;
  }

  // ✅ 9. DELETE NOTE
  if (lowerCmd.includes("delete note")) {
    setCurrentForm("deleteNote");
    setFormData({});
    addMessage("sara", "🗑️ Delete Note\nEnter Note ID to delete:");
    return;
  }

  // ✅ 10. CLEAR ALL NOTES
  if (lowerCmd.includes("clear all notes") || lowerCmd.includes("clear notes")) {
    try {
      await apiCall("/notes/clear_all", { method: "DELETE" });
      addMessage("sara", "✅ All notes cleared successfully!");
    } catch (error) {
      console.error("Failed to clear notes:", error);
      addMessage("sara", "❌ Failed to clear notes");
    }
    return;
  }

  // ============ REMINDERS OPERATIONS ============
  // ✅ 11. ADD REMINDER
  if (lowerCmd.includes("add reminder")) {
    setCurrentForm("addReminder");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "⏰ Add Reminder Form Started!\nStep 1/3: Reminder title?");
    return;
  }

  // ✅ 12. EDIT REMINDER
  if (lowerCmd.includes("edit reminder")) {
    setCurrentForm("editReminder");
    setFormData({});
    setFormStep(0);
    addMessage("sara", "✏️ Edit Reminder Form Started!\nStep 1/3: Reminder ID?");
    return;
  }

  // ✅ 13. DELETE REMINDER
  if (lowerCmd.includes("delete reminder")) {
    setCurrentForm("deleteReminder");
    setFormData({});
    addMessage("sara", "🗑️ Delete Reminder\nEnter Reminder ID to delete:");
    return;
  }

  // ✅ 14. SHOW REMINDERS
  if (lowerCmd.includes("show reminders") || lowerCmd.includes("list reminders")) {
    try {
      const reminders = await apiCall("/reminders");
      addMessage("sara", `📋 ${reminders.length} reminders found. Check Reminders page.`);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      addMessage("sara", "❌ Failed to fetch reminders.");
    }
    return;
  }

  // ✅ 15. CLEAR ALL REMINDERS
  if (lowerCmd.includes("clear all reminders") || lowerCmd.includes("clear reminders")) {
    try {
      await apiCall("/reminders/clear_all", { method: "DELETE" });
      addMessage("sara", "✅ All reminders cleared successfully!");
    } catch (error) {
      console.error("Failed to clear reminders:", error);
      addMessage("sara", "❌ Failed to clear reminders");
    }
    return;
  }

  // ============ WEATHER OPERATIONS ============
  // ✅ 16. WEATHER SEARCH
  if (lowerCmd.includes("weather")) {
    const cityMatch = cmd.match(/weather\s+(.+)/i);
    if (cityMatch) {
      setCurrentForm("weatherSearch");
      setFormData({ city: cityMatch[1].trim() });
      try {
        const weather = await apiCall(`/weather?city=${encodeURIComponent(cityMatch[1].trim())}`);
        addMessage("sara", `🌤️ Weather for ${cityMatch[1].trim()}: ${weather.summary}`);
      } catch (error) {
        addMessage("sara", "❌ Failed to fetch weather. Try again.");
      }
    } else {
      setCurrentForm("weatherSearch");
      setFormData({});
      addMessage("sara", "🌤️ Weather search\nEnter city name:");
    }
    return;
  }

  // ✅ 17. WEATHER HISTORY RESET
  if (lowerCmd.includes("clear weather history") || lowerCmd.includes("reset weather history")) {
    try {
      await apiCall("/weather/history/reset", { method: "DELETE" });
      addMessage("sara", "✅ Weather history reset successfully!");
    } catch (error) {
      console.error("Failed to reset weather history:", error);
      addMessage("sara", "❌ Failed to reset weather history.");
    }
    return;
  }

  // ✅ 18. CLEAR ALL (MULTI-OPTION)
  if (lowerCmd.includes("clear all") || lowerCmd.includes("clear everything")) {
    setCurrentForm("clearAll");
    addMessage("sara", "🧹 Clear All\nWhat to clear? (tasks/notes/reminders/weather)");
    return;
  }

  // ✅ 19. NAVIGATION
  if (lowerCmd.includes("go to tasks") || lowerCmd.includes("open tasks")) {
    setSection("tasks");
    addMessage("sara", "✅ Switched to Tasks section");
    return;
  }
  if (lowerCmd.includes("go to notes") || lowerCmd.includes("open notes")) {
    setSection("notes");
    addMessage("sara", "✅ Switched to Notes section");
    return;
  }
  if (lowerCmd.includes("go to reminders") || lowerCmd.includes("open reminders")) {
    setSection("reminders");
    addMessage("sara", "✅ Switched to Reminders section");
    return;
  }


  // ✅ 20. SHOW TASKS / LIST TASKS
if (lowerCmd.includes("show task") || lowerCmd.includes("show tasks") || lowerCmd.includes("list task") || lowerCmd.includes("list tasks")) {
  try {
    const tasks = await apiCall("/tasks");
    addMessage("sara", `📋 ${tasks.length || 0} tasks found. Check Tasks page for details.`);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    addMessage("sara", "❌ Failed to fetch tasks. Backend might be down.");
  }
  return;
}

  // Fallback message for unmatched operations
  addMessage("sara", "⚠️ Command not recognized. Try: add task, edit task, weather [city], clear all tasks");
};


  const resetForm = () => {
    setCurrentForm(null);
    setFormData({});
    setFormStep(0);
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      addMessage("sara", "🎤 Use Chrome or Edge for voice commands.");
      return;
    }
    if (isListening) {
      recognition.stop();
      if (recognitionContinuousRef.current) {
        recognitionContinuousRef.current.stop();
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  // Form submit handler for add/edit/delete forms
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentForm === "addTask") {
      if (formStep < 3) {
        setFormStep(formStep + 1);
      } else {
        // Final submit
        try {
          await apiCall("/tasks", {
            method: "POST",
            body: JSON.stringify({
              title: formData.title,
              description: formData.description || "",
              due_date: formData.due_date,
              priority: formData.priority || 1,
            }),
          });
          addMessage("sara", `✅ Task "${formData.title}" added successfully!`);
        } catch (error) {
          console.error("Failed to add task:", error);
          addMessage("sara", "❌ Failed to add task.");
        }
        resetForm();
      }
    } else if (currentForm === "editTask") {
      if (formStep === 0) {
        if (!formData.taskId) {
          addMessage("sara", "❌ Please provide a valid Task ID.");
          return;
        }
        setFormStep(1);
      } else if (formStep === 1) {
        setFormStep(2);
      } else {
        // Final submit
        try {
          const updateBody: any = {};
          if (formData.title) updateBody.title = formData.title;
          if (formData.due_date) updateBody.due_date = formData.due_date;
          updateBody.description = "Updated via Sara";
          updateBody.priority = 1;
          await apiCall(`/tasks/${formData.taskId}`, {
            method: "PUT",
            body: JSON.stringify(updateBody),
          });
          addMessage("sara", `✅ Task ${formData.taskId} updated successfully!`);
        } catch (error) {
          console.error("Failed to update task:", error);
          addMessage("sara", "❌ Failed to update task.");
        }
        resetForm();
      }
    } else if (currentForm === "deleteTask") {
      if (!formData.taskId) {
        addMessage("sara", "❌ Please provide a valid Task ID.");
        return;
      }
      try {
        await apiCall(`/tasks/${formData.taskId}`, { method: "DELETE" });
        addMessage("sara", `✅ Task ${formData.taskId} deleted successfully!`);
      } catch (error) {
        console.error("Failed to delete task:", error);
        addMessage("sara", "❌ Failed to delete task.");
      }
      resetForm();
    }
  };

  // Main input form submit handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isProcessing) return;

    addMessage("user", text);
    setInput("");
    processCommand(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Sara
          </h1>
          <p className="text-xl text-gray-600">AI Smart Assistant</p>
        </motion.div>

        <div 
          ref={chatContainerRef}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 h-96 overflow-y-auto border shadow-xl"
          style={{ scrollBehavior: 'smooth' }}
          >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              "Hey Sara" or "add task milk" 🎤
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gradient-to-r from-purple-100 to-pink-100"
                  }`}
                >
                  <p style={{ whiteSpace: "pre-line" }}>{msg.content}</p>
                  <p className="text-xs opacity-75 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start mb-4">
              <div className="bg-purple-100 px-4 py-2 rounded-2xl text-sm">
                Sara thinking... 🤔
              </div>
            </div>
          )}

          {/* Render forms for all operations */}
          {currentForm === "addTask" && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
              {formStep === 0 && (
                <>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title"
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={!formData.title}>
                    Next
                  </Button>
                </>
              )}
              {formStep === 1 && (
                <>
                  <Input
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Task description (optional)"
                    autoFocus
                  />
                  <Button type="submit">Next</Button>
                </>
              )}
              {formStep === 2 && (
                <>
                  <Input
                    type="date"
                    value={formData.due_date || ""}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={!formData.due_date}>
                    Next
                  </Button>
                </>
              )}
              {formStep === 3 && (
                <>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={formData.priority || 1}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    placeholder="Priority (1-5)"
                    required
                    autoFocus
                  />
                  <Button type="submit">Submit</Button>
                </>
              )}
            </form>
          )}

          {currentForm === "editTask" && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
              {formStep === 0 && (
                <>
                  <Input
                    value={formData.taskId || ""}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    placeholder="Task ID"
                    required
                    autoFocus
                  />
                  <Button type="submit" disabled={!formData.taskId}>
                    Next
                  </Button>
                </>
              )}
              {formStep === 1 && (
                <>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="New title (optional)"
                    autoFocus
                  />
                  <Button type="submit">Next</Button>
                </>
              )}
              {formStep === 2 && (
                <>
                  <Input
                    type="date"
                    value={formData.due_date || ""}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    placeholder="New due date (optional)"
                    autoFocus
                  />
                  <Button type="submit">Submit</Button>
                </>
              )}
            </form>
          )}

          {currentForm === "deleteTask" && (
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
              <Input
                value={formData.taskId || ""}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                placeholder="Task ID to delete"
                required
                autoFocus
              />
              <Button type="submit" disabled={!formData.taskId}>
                Delete Task
              </Button>
            </form>
          )}

          {/* Add similar forms for notes, reminders, weather search, and clear/reset steps */}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isProcessing ? "..." : "Type or speak..."}
            className="flex-1"
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmit();
              }
            }}
            ref={inputRef}
          />
          <Button type="submit" size="icon" disabled={isProcessing || !input.trim()}>
            <Send className="w-5 h-5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={isListening ? "destructive" : "default"}
            onMouseDown={voiceButtonHandlers.onMouseDown}
            onMouseUp={voiceButtonHandlers.onMouseUp}
            onTouchStart={voiceButtonHandlers.onMouseDown}
            onTouchEnd={voiceButtonHandlers.onMouseUp}
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
                {/* Insert your command list here */}
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
