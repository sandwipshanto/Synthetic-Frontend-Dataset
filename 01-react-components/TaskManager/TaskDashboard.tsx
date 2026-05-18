import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  type: 'task' | 'event';
  tags?: string[];
  snoozeUntil?: Date;
  completedAt?: Date;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
}

interface NotificationPrefs {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  advanceWarning: number; // minutes
  doNotDisturb: boolean;
  doNotDisturbStart?: string;
  doNotDisturbEnd?: string;
}

interface Theme {
  id: 'midnight-luxe' | 'golden-hour' | 'ocean-breeze' | 'forest-calm';
  name: string;
  bgGradient: string;
  cardBg: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  isDark: boolean;
}

const THEMES: Theme[] = [
  {
    id: 'midnight-luxe',
    name: 'Midnight Luxe',
    bgGradient: 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black',
    cardBg: 'bg-gray-800',
    primaryColor: 'indigo',
    accentColor: 'purple',
    textColor: 'text-gray-100',
    isDark: true
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    bgGradient: 'bg-gradient-to-br from-amber-50 via-amber-100 to-orange-100',
    cardBg: 'bg-white',
    primaryColor: 'amber',
    accentColor: 'orange',
    textColor: 'text-gray-800',
    isDark: false
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    bgGradient: 'bg-gradient-to-br from-cyan-100 via-blue-100 to-sky-100',
    cardBg: 'bg-white',
    primaryColor: 'blue',
    accentColor: 'cyan',
    textColor: 'text-gray-800',
    isDark: false
  },
  {
    id: 'forest-calm',
    name: 'Forest Calm',
    bgGradient: 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900',
    cardBg: 'bg-gray-800',
    primaryColor: 'emerald',
    accentColor: 'green',
    textColor: 'text-gray-100',
    isDark: true
  }
];

// Get priority styling - moved outside component to be available globally
const getPriorityStyle = (priority: 'low' | 'medium' | 'high', isDark: boolean) => {
  const baseStyles = "rounded-full flex items-center justify-center";
  switch (priority) {
    case 'high':
      return `${baseStyles} ${isDark ? 'bg-red-700' : 'bg-red-500'}`;
    case 'medium':
      return `${baseStyles} ${isDark ? 'bg-amber-600' : 'bg-amber-500'}`;
    case 'low':
      return `${baseStyles} ${isDark ? 'bg-emerald-600' : 'bg-emerald-500'}`;
  }
};

const TaskEventManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as const,
    type: 'task' as const,
    tags: [] as string[],
    recurrence: null as Task['recurrence'],
  });
  const [activeView, setActiveView] = useState<'dashboard' | 'overdue' | 'today' | 'upcoming' | 'completed' | 'add' | 'settings'>('dashboard');
  const [notifications, setNotifications] = useState<{ id: string; task: Task; message: string }[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    enabled: true,
    sound: true,
    vibrate: true,
    advanceWarning: 60,
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
  });
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'notifications' | 'appearance' | 'preferences'>('notifications');
  
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Simulate loading effect
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  // ...existing notification and settings useEffect code...

  // Check if current time is within Do Not Disturb hours
  const isInDoNotDisturbMode = useCallback(() => {
    if (!prefs.doNotDisturb) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const [startHour, startMinute] = prefs.doNotDisturbStart?.split(':').map(Number) || [22, 0];
    const [endHour, endMinute] = prefs.doNotDisturbEnd?.split(':').map(Number) || [8, 0];
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    // Handle overnight periods
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    
    // Handle same-day periods
    return currentTime >= startTime && currentTime <= endTime;
  }, [prefs]);

  const checkNotifications = useCallback(() => {
    if (!prefs.enabled || isInDoNotDisturbMode()) return;
    
    const now = new Date();
    tasks.forEach(task => {
      if (task.snoozeUntil && task.snoozeUntil > now) return;
      
      if (!task.completed && !isOverdue(task.dueDate)) {
        const timeDiff = task.dueDate.getTime() - now.getTime();
        const warningMs = prefs.advanceWarning * 60000;
        if (timeDiff > 0 && timeDiff <= warningMs) {
          showNotification(task, `Due in ${Math.round(timeDiff / 60000)} minutes`);
        }
      }
    });
  }, [tasks, prefs, isInDoNotDisturbMode]);

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only apply shortcuts when not typing in an input
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      switch(e.key.toLowerCase()) {
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsAddFormOpen(true);
            setActiveView('add');
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
          break;
        case 'escape':
          if (isAddFormOpen) {
            setIsAddFormOpen(false);
            setActiveView('today');
          }
          break;
        case '1': 
          if (e.altKey) setActiveView('overdue');
          break;
        case '2': 
          if (e.altKey) setActiveView('today');
          break;
        case '3': 
          if (e.altKey) setActiveView('upcoming');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddFormOpen]);

  // Effect for interval notification checking
  useEffect(() => {
    const interval = setInterval(checkNotifications, 10000); // Changed from 30000 to 10000
    return () => clearInterval(interval);
  }, [checkNotifications]);

  // Show notification with premium styling
  const showNotification = (task: Task, message: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, task, message }]);
    
    if (Notification.permission === 'granted') {
      new Notification(task.title, { 
        body: message, 
        tag: task.id,
        icon: '/favicon.ico', // Placeholder for app icon
      });
    }
    
    if (prefs.sound) {
      const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
      audio.volume = 0.7; // Slightly quieter for better UX
      audio.play();
    }
    
    if (prefs.vibrate && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Gentler vibration pattern
    }
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  // Smart date suggestions for new tasks
  const getSmartDateSuggestions = () => {
    const suggestions = [];
    const now = new Date();
    
    // Today
    const today = new Date();
    suggestions.push({
      label: 'Today',
      value: new Date(today.setHours(18, 0, 0, 0)).toISOString().slice(0, 16)
    });
    
    // Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    suggestions.push({
      label: 'Tomorrow morning',
      value: tomorrow.toISOString().slice(0, 16)
    });
    
    // This weekend
    const daysToWeekend = 6 - now.getDay(); // 6 is Saturday
    const weekend = new Date();
    weekend.setDate(weekend.getDate() + daysToWeekend);
    weekend.setHours(10, 0, 0, 0);
    suggestions.push({
      label: 'This weekend',
      value: weekend.toISOString().slice(0, 16)
    });
    
    // Next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);
    suggestions.push({
      label: 'Next week',
      value: nextWeek.toISOString().slice(0, 16)
    });
    
    return suggestions;
  };

  // Snooze a task
  const snoozeTask = (taskId: string, duration: number) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const snoozeUntil = new Date();
        snoozeUntil.setMinutes(snoozeUntil.getMinutes() + duration);
        return { ...task, snoozeUntil };
      }
      return task;
    }));
    
    setNotifications(prev => prev.filter(n => n.task.id !== taskId));
  };

  // Add new task with enhanced functionality
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;
    
    // Create the task object with proper date handling
    const dueDate = new Date(newTask.dueDate);
    console.log("New task due date:", dueDate);
    
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      dueDate: dueDate,
      priority: newTask.priority,
      completed: false,
      type: newTask.type,
      tags: newTask.tags,
      recurrence: newTask.recurrence,
      completedAt: undefined,
      snoozeUntil: undefined,
    };
    
    // Reset form state first to prevent any state inconsistencies
    setNewTask({ 
      title: '', 
      description: '', 
      dueDate: '', 
      priority: 'medium', 
      type: 'task',
      tags: [],
      recurrence: null
    });
    
    // Change navigation state to dashboard instead of today
    setActiveView('dashboard');
    setIsAddFormOpen(false);
    
    // Then update the tasks array
    setTasks(prev => [...prev, task]);
    
    // Create success notification
    const successToast = { 
      id: crypto.randomUUID(), 
      task, 
      message: 'Task added successfully!' 
    };
    
    // Show brief loading and notification - with reduced timing
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setNotifications(prev => [...prev, successToast]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== successToast.id));
      }, 3000);
    }, 300);
  };

  const toggleComplete = useCallback((id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        const completedAt = completed ? new Date() : undefined;
        
        // Handle recurring tasks
        if (completed && task.recurrence) {
          // Create next occurrence
          const nextDueDate = new Date(task.dueDate);
          switch(task.recurrence) {
            case 'daily':
              nextDueDate.setDate(nextDueDate.getDate() + 1);
              break;
            case 'weekly':
              nextDueDate.setDate(nextDueDate.getDate() + 7);
              break;
            case 'monthly':
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
              break;
          }
          
          // Add the next occurrence as a new task
          const nextTask: Task = {
            ...task,
            id: crypto.randomUUID(),
            dueDate: nextDueDate,
            completed: false,
            completedAt: undefined,
          };
          
          setTimeout(() => setTasks(prev => [...prev, nextTask]), 500);
        }
        
        return { ...task, completed, completedAt };
      }
      return task;
    }));
  }, [tasks]);

  // Delete task
  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Utility functions
  const isOverdue = (dueDate: Date) => dueDate < new Date() && !isToday(dueDate);
  
  // Fixed isToday function to correctly handle date comparisons
  const isToday = (dueDate: Date) => {
    const today = new Date();
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  };
  
  const isTomorrow = (dueDate: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      dueDate.getDate() === tomorrow.getDate() &&
      dueDate.getMonth() === tomorrow.getMonth() &&
      dueDate.getFullYear() === tomorrow.getFullYear()
    );
  };

  // Get priority styling - use the global function now
  const getPriorityStyleWithTheme = (priority: Task['priority']) => {
    return getPriorityStyle(priority, selectedTheme.isDark);
  };

  // Format date for display
  const formatTaskDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Filter tasks based on current view and search query
  const filteredTasks = {
    overdue: tasks.filter(task => !task.completed && isOverdue(task.dueDate)),
    today: tasks.filter(task => !task.completed && isToday(task.dueDate)),
    upcoming: tasks.filter(task => !task.completed && !isOverdue(task.dueDate) && !isToday(task.dueDate)),
    completed: tasks.filter(task => task.completed)
  };
  
  // Apply search filter across all categories if search query exists
  const searchedTasks = searchQuery 
    ? Object.fromEntries(
        Object.entries(filteredTasks).map(([key, tasksList]) => [
          key,
          tasksList.filter(task => 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        ])
      )
    : filteredTasks;

  // Effect to check for and update overdue tasks
  useEffect(() => {
    // Check every minute if any today's tasks have become overdue
    const interval = setInterval(() => {
      const now = new Date();
      const updatedTasks = tasks.map(task => {
        // If task is not completed and due date is passed
        if (!task.completed && task.dueDate < now && !task.snoozeUntil) {
          // This will cause task to appear in overdue section
          console.log(`Task "${task.title}" is now overdue`);
          return task; // No need to change anything as isOverdue() function handles this
        }
        return task;
      });
      
      // No need to update tasks state unless something changed
      if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
        setTasks(updatedTasks);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [tasks]);

  return (
    <div className={`h-screen flex flex-col ${selectedTheme.bgGradient} font-sans overflow-hidden`}>
      {/* Tailwind CSS CDN */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      {/* Viewport Meta for Mobile Responsiveness */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

      {/* Mobile Responsive Styles */}
      <style jsx global>{`
        html {
          font-size: 16px;
        }
        
        @media (max-width: 640px) {
          html {
            font-size: 18px;
          }
          
          .input, .button, .select {
            font-size: 1rem;
            height: auto;
            padding: 0.75rem;
          }
          
          .task-item {
            padding: 1rem;
          }
        }
        
        /* Better touch targets on mobile */
        @media (hover: none) {
          button, a, input[type="checkbox"], input[type="radio"], select, .clickable {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="shimmer-container">
            <div className="shimmer-line"></div>
            <div className="shimmer-line"></div>
            <div className="shimmer-line"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`${selectedTheme.isDark ? 'bg-gray-900' : 'bg-white'} shadow-lg sticky top-0 z-20`}>
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${selectedTheme.isDark ? 'bg-indigo-600' : 'bg-indigo-500'} rounded-lg flex items-center justify-center`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className={`text-xl md:text-2xl font-extrabold ${selectedTheme.isDark ? 'text-white' : 'text-indigo-700'} tracking-tight`}>TaskMad</h1>
          </div>
          
          <div className="relative flex-1 max-w-md mx-4 hidden md:block">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 px-4 ${selectedTheme.isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${selectedTheme.isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button 
                className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery('')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="hidden md:flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
              onClick={() => {
                setIsAddFormOpen(true);
                setActiveView('add');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
              onClick={() => setIsSettingsOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${selectedTheme.isDark ? 'text-gray-300' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 px-4 ${selectedTheme.isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {searchQuery ? (
                <button 
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchQuery('')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${selectedTheme.isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${selectedTheme.textColor} pb-16`}>
        {activeView === 'add' ? (
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={addTask} className={`${selectedTheme.cardBg} p-5 md:p-6 rounded-2xl shadow-xl space-y-5`}>
              <h2 className={`text-xl font-bold ${selectedTheme.textColor} mb-4`}>Add New Task</h2>
              
              <div>
                <input
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className={`w-full p-3 md:p-4 text-lg ${selectedTheme.isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  autoFocus
                />
              </div>
              
              <div>
                <textarea
                  placeholder="Add details (optional)"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className={`w-full p-3 md:p-4 text-lg ${selectedTheme.isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'} border rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${selectedTheme.textColor}`}>Due Date</label>
                <input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className={`w-full p-3 md:p-4 ${selectedTheme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                />
                
                {/* Smart Date Suggestions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSmartDateSuggestions().map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`px-3 py-1 text-xs rounded-full ${selectedTheme.isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                      onClick={() => setNewTask({ ...newTask, dueDate: suggestion.value })}
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${selectedTheme.textColor}`}>Priority</label>
                <div className="flex space-x-3">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`flex-1 p-3 rounded-xl font-medium ${
                        newTask.priority === p 
                          ? `${getPriorityStyle(p, selectedTheme.isDark)} text-white ring-2 ring-offset-2 ${selectedTheme.isDark ? 'ring-gray-800' : 'ring-white'}` 
                          : `${selectedTheme.isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`
                      } hover:opacity-90 transition-all transform active:scale-95`}
                      onClick={() => setNewTask({ ...newTask, priority: p })}
                    >
                      {p === 'high' && '🔴 '}
                      {p === 'medium' && '🟠 '}
                      {p === 'low' && '🟢 '}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${selectedTheme.textColor}`}>Type</label>
                  <select
                    value={newTask.type}
                    onChange={e => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                    className={`w-full p-3 ${selectedTheme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  >
                    <option value="task">📌 Task</option>
                    <option value="event">📅 Event</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${selectedTheme.textColor}`}>Repeat</label>
                  <select
                    value={newTask.recurrence || ''}
                    onChange={e => setNewTask({ ...newTask, recurrence: e.target.value as Task['recurrence'] || null })}
                    className={`w-full p-3 ${selectedTheme.isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  >
                    <option value="">No Repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button" 
                  className={`flex-1 p-3 rounded-xl font-medium border ${
                    selectedTheme.isDark 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                  onClick={() => {
                    setActiveView('today');
                    setIsAddFormOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all transform active:scale-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="container mx-auto px-4 pt-4 pb-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-xl font-bold ${selectedTheme.textColor}`}>
                  {activeView === 'dashboard' && '📋 Dashboard'}
                  {activeView === 'overdue' && '⚠️ Overdue'}
                  {activeView === 'today' && '📅 Today'}
                  {activeView === 'upcoming' && '🔮 Upcoming'}
                  {activeView === 'completed' && '✅ Completed'}
                </h2>
                {searchQuery && (
                  <div className="text-sm text-gray-500">
                    Showing results for "{searchQuery}"
                  </div>
                )}
              </div>
              
              {activeView === 'dashboard' ? (
                <div className="space-y-6">
                  {['overdue', 'today', 'upcoming'].map(view => (
                    <div key={view}>
                      <h3 className={`text-lg font-semibold ${selectedTheme.textColor} mb-2`}>
                        {view === 'overdue' && '⚠️ Overdue'}
                        {view === 'today' && '📅 Today'}
                        {view === 'upcoming' && '🔮 Upcoming'}
                      </h3>
                      {searchedTasks[view].length === 0 ? (
                        <div className={`${selectedTheme.cardBg} rounded-xl p-4 text-center space-y-3 animate-fade-in shadow-md`}>
                          <div className="inline-block p-3 rounded-full bg-gray-100">
                            {view === 'overdue' && '🎉'}
                            {view === 'today' && '🌤️'}
                            {view === 'upcoming' && '📭'}
                          </div>
                          <p className={`text-lg font-medium ${selectedTheme.textColor}`}>
                            {view === 'overdue' && "No overdue tasks!"}
                            {view === 'today' && "You're all caught up!"}
                            {view === 'upcoming' && "Nothing planned yet"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {view === 'overdue' && "Great job staying on top of things"}
                            {view === 'today' && "Enjoy the rest of your day"}
                            {view === 'upcoming' && "Click + to add your first task"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {searchedTasks[view].map(task => (
                            <TaskItem 
                              key={task.id} 
                              task={task} 
                              toggleComplete={toggleComplete} 
                              deleteTask={deleteTask}
                              snoozeTask={snoozeTask}
                              theme={selectedTheme}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                searchedTasks[activeView].length === 0 ? (
                  <div className={`${selectedTheme.cardBg} rounded-xl p-8 text-center space-y-3 animate-fade-in shadow-md`}>
                    <div className="inline-block p-3 rounded-full bg-gray-100">
                      {activeView === 'overdue' && '🎉'}
                      {activeView === 'today' && '🌤️'}
                      {activeView === 'upcoming' && '📭'}
                      {activeView === 'completed' && '👏'}
                    </div>
                    <p className={`text-lg font-medium ${selectedTheme.textColor}`}>
                      {activeView === 'overdue' && "No overdue tasks!"}
                      {activeView === 'today' && "You're all caught up!"}
                      {activeView === 'upcoming' && "Nothing planned yet"}
                      {activeView === 'completed' && "No completed tasks yet"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activeView === 'overdue' && "Great job staying on top of things"}
                      {activeView === 'today' && "Enjoy the rest of your day"}
                      {activeView === 'upcoming' && "Click + to add your first task"}
                      {activeView === 'completed' && "Completed tasks will appear here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {searchedTasks[activeView].map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        toggleComplete={toggleComplete} 
                        deleteTask={deleteTask}
                        snoozeTask={snoozeTask}
                        theme={selectedTheme}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className={`${selectedTheme.isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t shadow-2xl p-2 flex justify-around items-center sticky bottom-0 z-20 md:hidden`}>
        <button
          className={`p-3 rounded-full flex flex-col items-center ${activeView === 'dashboard' ? 'bg-indigo-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
          onClick={() => setActiveView('dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M3 12h18M3 21h18" />
          </svg>
          <span className="text-xs mt-1">Dashboard</span>
        </button>
        
        <button
          className={`p-3 rounded-full flex flex-col items-center ${activeView === 'overdue' ? 'bg-red-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
          onClick={() => setActiveView('overdue')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs mt-1">Overdue</span>
          {searchedTasks.overdue.length > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
              {searchedTasks.overdue.length}
            </span>
          )}
        </button>
        
        <button
          className={`p-3 rounded-full flex flex-col items-center ${activeView === 'today' ? 'bg-indigo-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
          onClick={() => setActiveView('today')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs mt-1">Today</span>
          {searchedTasks.today.length > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 bg-indigo-500 text-white text-xs flex items-center justify-center rounded-full">
              {searchedTasks.today.length}
            </span>
          )}
        </button>
        
        <button
          className={`w-14 h-14 -mt-5 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center shadow-lg hover:bg-indigo-700 transition-all transform active:scale-95`}
          onClick={() => {
            setIsAddFormOpen(true);
            setActiveView('add');
          }}
          aria-label="Add task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        
        <button
          className={`p-3 rounded-full flex flex-col items-center ${activeView === 'upcoming' ? 'bg-emerald-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
          onClick={() => setActiveView('upcoming')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs mt-1">Upcoming</span>
          {searchedTasks.upcoming.length > 0 && (
            <span className="absolute top-1 right-1 h-5 w-5 bg-emerald-500 text-white text-xs flex items-center justify-center rounded-full">
              {searchedTasks.upcoming.length}
            </span>
          )}
        </button>
        
        <button
          className={`p-3 rounded-full flex flex-col items-center ${activeView === 'completed' ? 'bg-gray-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
          onClick={() => setActiveView('completed')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs mt-1">Done</span>
        </button>
      </nav>

      {/* Desktop Side Navigation */}
      <div className="hidden md:block fixed left-4 top-1/2 transform -translate-y-1/2 z-20">
        <div className={`${selectedTheme.isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-2 flex flex-col space-y-2`}>
          <button
            className={`p-3 rounded-lg ${activeView === 'dashboard' ? 'bg-indigo-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90 relative`}
            onClick={() => setActiveView('dashboard')}
            title="Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M3 12h18M3 21h18" />
            </svg>
          </button>
          
          <button
            className={`p-3 rounded-lg ${activeView === 'overdue' ? 'bg-red-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90 relative`}
            onClick={() => setActiveView('overdue')}
            title="Overdue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {searchedTasks.overdue.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                {searchedTasks.overdue.length}
              </span>
            )}
          </button>
          
          <button
            className={`p-3 rounded-lg ${activeView === 'today' ? 'bg-indigo-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90 relative`}
            onClick={() => setActiveView('today')}
            title="Today"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {searchedTasks.today.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-500 text-white text-xs flex items-center justify-center rounded-full">
                {searchedTasks.today.length}
              </span>
            )}
          </button>
          
          <button
            className={`p-3 rounded-lg ${activeView === 'upcoming' ? 'bg-emerald-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90 relative`}
            onClick={() => setActiveView('upcoming')}
            title="Upcoming"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {searchedTasks.upcoming.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 text-white text-xs flex items-center justify-center rounded-full">
                {searchedTasks.upcoming.length}
              </span>
            )}
          </button>
          
          <button
            className={`p-3 rounded-lg ${activeView === 'completed' ? 'bg-gray-500 text-white' : `${selectedTheme.textColor} hover:bg-gray-100 dark:hover:bg-gray-800`} transition-all transform active:scale-90`}
            onClick={() => setActiveView('completed')}
            title="Completed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end md:items-center justify-center animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
          <div
            ref={settingsRef}
            className={`${selectedTheme.isDark ? 'bg-gray-900' : 'bg-white'} w-full max-w-md p-6 md:rounded-2xl rounded-t-3xl shadow-2xl space-y-4 animate-slide-up max-h-[80vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}
            onTouchStart={(e) => {
              const startY = e.touches[0].clientY;
              const handleTouchMove = (moveE: TouchEvent) => {
                if (moveE.touches[0].clientY - startY > 100) setIsSettingsOpen(false);
              };
              document.addEventListener('touchmove', handleTouchMove);
              document.addEventListener('touchend', () => document.removeEventListener('touchmove', handleTouchMove), { once: true });
            }}
          >
            {/* Modal handle for mobile */}
            <div className="flex justify-center md:hidden mb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="flex justify-between items-center">
              <h2 className={`text-xl font-bold ${selectedTheme.textColor}`}>Settings</h2>
              <button 
                className={`p-2 ${selectedTheme.isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-all`} 
                onClick={() => setIsSettingsOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Settings tabs */}
            <div className="flex border-b border-gray-200">
              {['notifications', 'appearance', 'preferences'].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeSettingsTab === tab 
                      ? `${selectedTheme.isDark ? 'text-indigo-400 border-indigo-400' : 'text-indigo-600 border-indigo-600'} border-b-2` 
                      : `${selectedTheme.isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  } transition-colors`}
                  onClick={() => setActiveSettingsTab(tab as any)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Settings content */}
            {activeSettingsTab === 'notifications' && (
              <div className="space-y-4 py-2">
                <label className={`flex items-center justify-between ${selectedTheme.textColor}`}>
                  <span>Enable Notifications</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={prefs.enabled}
                      onChange={e => setPrefs({ ...prefs, enabled: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full ${prefs.enabled ? 'bg-indigo-500' : 'bg-gray-300'} transition-colors`}
                    />
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transform transition-transform ${prefs.enabled ? 'translate-x-6' : ''}`}
                    />
                  </div>
                </label>
                
                <label className={`flex items-center justify-between ${selectedTheme.textColor}`}>
                  <span>Sound</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={prefs.sound}
                      onChange={e => setPrefs({ ...prefs, sound: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full ${prefs.sound ? 'bg-indigo-500' : 'bg-gray-300'} transition-colors`}
                    />
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transform transition-transform ${prefs.sound ? 'translate-x-6' : ''}`}
                    />
                  </div>
                </label>
                
                <label className={`flex items-center justify-between ${selectedTheme.textColor}`}>
                  <span>Vibration</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={prefs.vibrate}
                      onChange={e => setPrefs({ ...prefs, vibrate: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full ${prefs.vibrate ? 'bg-indigo-500' : 'bg-gray-300'} transition-colors`}
                    />
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transform transition-transform ${prefs.vibrate ? 'translate-x-6' : ''}`}
                    />
                  </div>
                </label>
                
                <label className={`flex items-center justify-between ${selectedTheme.textColor}`}>
                  <span>Do Not Disturb</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={prefs.doNotDisturb}
                      onChange={e => setPrefs({ ...prefs, doNotDisturb: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-6 rounded-full ${prefs.doNotDisturb ? 'bg-indigo-500' : 'bg-gray-300'} transition-colors`}
                    />
                    <div
                      className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transform transition-transform ${prefs.doNotDisturb ? 'translate-x-6' : ''}`}
                    />
                  </div>
                </label>
                
                {prefs.doNotDisturb && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${selectedTheme.textColor}`}>From</label>
                      <input
                        type="time"
                        value={prefs.doNotDisturbStart}
                        onChange={e => setPrefs({ ...prefs, doNotDisturbStart: e.target.value })}
                        className={`w-full p-2 ${selectedTheme.isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${selectedTheme.textColor}`}>To</label>
                      <input
                        type="time"
                        value={prefs.doNotDisturbEnd}
                        onChange={e => setPrefs({ ...prefs, doNotDisturbEnd: e.target.value })}
                        className={`w-full p-2 ${selectedTheme.isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg`}
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${selectedTheme.textColor}`}>Advance Warning (minutes)</label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={prefs.advanceWarning}
                    onChange={e => setPrefs({ ...prefs, advanceWarning: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>5 min</span>
                    <span>{prefs.advanceWarning} min</span>
                    <span>2 hrs</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeSettingsTab === 'appearance' && (
              <div className="space-y-4 py-2">
                <h3 className={`text-lg font-medium ${selectedTheme.textColor}`}>Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      className={`p-3 rounded-xl ${theme.bgGradient} border-2 ${selectedTheme.id === theme.id ? 'border-indigo-500' : 'border-transparent'} transition-all hover:shadow-lg`}
                      onClick={() => setSelectedTheme(theme)}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-full h-12 rounded-lg mb-2 ${theme.cardBg}`}></div>
                        <span className={`text-sm font-medium ${theme.textColor}`}>{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeSettingsTab === 'preferences' && (
              <div className="space-y-4 py-2">
                <h3 className={`text-lg font-medium ${selectedTheme.textColor}`}>Keyboard Shortcuts</h3>
                <div className={`${selectedTheme.isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3`}>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className={selectedTheme.textColor}>Add new task</span>
                    <span className={`font-mono ${selectedTheme.isDark ? 'text-indigo-300' : ''}`}>Ctrl/⌘ + N</span>
                    
                    <span className={selectedTheme.textColor}>Search</span>
                    <span className={`font-mono ${selectedTheme.isDark ? 'text-indigo-300' : ''}`}>Ctrl/⌘ + F</span>
                    
                    <span className={selectedTheme.textColor}>Overdue tasks</span>
                    <span className={`font-mono ${selectedTheme.isDark ? 'text-indigo-300' : ''}`}>Alt + 1</span>
                    
                    <span className={selectedTheme.textColor}>Today's tasks</span>
                    <span className={`font-mono ${selectedTheme.isDark ? 'text-indigo-300' : ''}`}>Alt + 2</span>
                    
                    <span className={selectedTheme.textColor}>Upcoming tasks</span>
                    <span className={`font-mono ${selectedTheme.isDark ? 'text-indigo-300' : ''}`}>Alt + 3</span>
                  </div>
                </div>
                
                <h3 className={`text-lg font-medium ${selectedTheme.textColor} mt-4`}>About TaskMad</h3>
                <p className="text-sm text-gray-500">
                  Version 1.0.0 • April 2025<br/>
                  A premium task & event manager
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Toast Notifications */}
      <div className="fixed bottom-20 md:bottom-10 right-4 space-y-3 z-40 max-w-xs w-full">
        {notifications.map(({ id, task, message }) => (
          <div
            key={id}
            className={`${selectedTheme.isDark ? 'bg-gray-800' : 'bg-gray-900'} text-white p-4 rounded-xl shadow-2xl max-w-xs animate-toast-in flex items-center space-x-4 overflow-hidden`}
          >
            <div className={`w-2 self-stretch ${getPriorityStyle(task.priority, selectedTheme.isDark)}`}></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{task.title}</p>
              <p className="text-xs text-gray-300 mt-1">{message}</p>
            </div>
            <div className="flex space-x-1">
              <button
                className="p-2 bg-emerald-600 rounded-full hover:bg-emerald-700 transition-all transform active:scale-90"
                onClick={() => {
                  toggleComplete(task.id);
                  setNotifications(prev => prev.filter(n => n.id !== id));
                }}
                aria-label="Complete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              {snoozeTask && (
                <button
                  className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-all transform active:scale-90"
                  onClick={() => {
                    snoozeTask(task.id, 60);
                    setNotifications(prev => prev.filter(n => n.id !== id));
                  }}
                  aria-label="Snooze task"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
              <button
                className="p-2 bg-gray-600 rounded-full hover:bg-gray-700 transition-all transform active:scale-90"
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== id))}
                aria-label="Close notification"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Accessibility announcement for screen readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {activeView === 'overdue' && `Viewing overdue tasks. ${searchedTasks.overdue.length} tasks found.`}
        {activeView === 'today' && `Viewing today's tasks. ${searchedTasks.today.length} tasks found.`}
        {activeView === 'upcoming' && `Viewing upcoming tasks. ${searchedTasks.upcoming.length} tasks found.`}
        {activeView === 'completed' && `Viewing completed tasks. ${searchedTasks.completed.length} tasks found.`}
        {searchQuery && `Filtered by search term: ${searchQuery}`}
      </div>
    </div>
  );
};

const TaskItem: React.FC<{
  task: Task;
  toggleComplete: (id: string) => void;
  deleteTask?: (id: string) => void;
  snoozeTask?: (id: string, duration: number) => void;
  theme?: Theme;
}> = ({ task, toggleComplete, deleteTask, snoozeTask, theme = THEMES[0] }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const startXRef = useRef(0);
  const swipeThreshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Only allow right swipe for snoozing and left swipe for completing
    if ((diff > 0 && diff < swipeThreshold) || (diff < 0 && diff > -swipeThreshold)) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > swipeThreshold/2 && snoozeTask) {
      snoozeTask(task.id, 60); // Snooze for 1 hour by default
    } else if (swipeOffset < -swipeThreshold/2) {
      toggleComplete(task.id);
    }
    
    // Reset swipe position with animation
    setSwipeOffset(0);
  };

  // Calculate due indicator classes
  const getDueIndicator = () => {
    if (task.completed) return "text-gray-400";
    if (isOverdue(task.dueDate)) return "text-red-500";
    if (isToday(task.dueDate)) return "text-amber-500";
    return "text-emerald-500";
  };

  // Format tags for display
  const renderTags = () => {
    if (!task.tags || task.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {task.tags.map(tag => (
          <span 
            key={tag} 
            className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>
    );
  };

  // Get appropriate icon based on task type and completion status
  const getTaskIcon = () => {
    if (task.completed) return "✓";
    
    switch(task.type) {
      case 'event': return "📅";
      default: return "📌";
    }
  };

  return (
    <div className="relative task-item">
      <div 
        className={`bg-${task.completed ? 'gray-200' : 'white'} rounded-2xl shadow-md overflow-hidden transition-all duration-300 transform ${isExpanded ? 'scale-102' : ''}`}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe indicators */}
        <div className="flex items-stretch absolute inset-0 pointer-events-none">
          <div className={`w-1/2 bg-emerald-500 opacity-${swipeOffset > 0 ? Math.min(Math.floor(swipeOffset/10), 30) : 0}`} />
          <div className={`w-1/2 bg-blue-500 opacity-${swipeOffset < 0 ? Math.min(Math.floor(Math.abs(swipeOffset)/10), 30) : 0}`} />
        </div>
        
        <div 
          className="flex items-center p-4 md:p-5 clickable"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={`w-10 h-10 ${getPriorityStyle(task.priority, theme.isDark)} mr-4 flex-shrink-0`}>
            <span className="text-white text-base m-auto">{getTaskIcon()}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className={`font-semibold text-base md:text-lg ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'} truncate`}>
                {task.title}
              </h3>
              <span className={`text-xs md:text-sm font-medium ml-2 flex-shrink-0 ${getDueIndicator()}`}>
                {formatTaskDate(task.dueDate)}
              </span>
            </div>
            
            {(task.description || (task.tags && task.tags.length > 0)) && (
              <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-40' : 'max-h-8'}`}>
                {task.description && (
                  <p className={`text-sm md:text-base mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                    {task.description}
                  </p>
                )}
                {renderTags()}
              </div>
            )}
            
            {task.recurrence && (
              <div className="flex items-center mt-1">
                <span className="text-xs md:text-sm text-indigo-600 font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Repeats {task.recurrence}
                </span>
              </div>
            )}
          </div>
          
          <button 
            className="ml-3 w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 focus:outline-none transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(task.id);
            }}
          >
            {task.completed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3 border-t border-gray-100">
            {snoozeTask && !task.completed && (
              <button 
                className="py-2 px-4 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  snoozeTask(task.id, 60);
                }}
              >
                Snooze 1h
              </button>
            )}
            {deleteTask && (
              <button 
                className="py-2 px-4 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(task.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Swipe action hints */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-2 pointer-events-none">
        <div className={`bg-blue-500 text-white rounded-full p-2 transition-opacity ${swipeOffset < -swipeThreshold/2 ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-2 pointer-events-none">
        <div className={`bg-emerald-500 text-white rounded-full p-2 transition-opacity ${swipeOffset > swipeThreshold/2 ? 'opacity-100' : 'opacity-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const isOverdue = (dueDate: Date) => dueDate < new Date() && !isToday(dueDate);

// Fixed isToday function to correctly handle date comparisons
const isToday = (dueDate: Date) => {
  const today = new Date();
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  );
};

const isTomorrow = (dueDate: Date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    dueDate.getDate() === tomorrow.getDate() &&
    dueDate.getMonth() === tomorrow.getMonth() &&
    dueDate.getFullYear() === tomorrow.getFullYear()
  );
};

// Format date for display with elegant formatting
const formatTaskDate = (date: Date) => {
  if (isToday(date)) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return date.toLocaleDateString([], { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
};

// Custom Animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slide-up {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes toast-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes shimmer {
    0% { background-position: -468px 0; }
    100% { background-position: 468px 0; }
  }
  
  .shimmer-container {
    width: 80%;
    max-width: 300px;
  }
  
  .shimmer-line {
    height: 16px;
    margin: 10px 0;
    background: linear-gradient(to right, rgba(255,255,255,0.1) 8%, rgba(255,255,255,0.2) 18%, rgba(255,255,255,0.1) 33%);
    background-size: 800px 104px;
    border-radius: 8px;
    animation: shimmer 2s infinite linear;
  }
  
  .shimmer-line:nth-child(2) {
    width: 85%;
  }
  
  .shimmer-line:nth-child(3) {
    width: 70%;
  }
  
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .animate-slide-up { animation: slide-up 0.3s ease-out; }
  .animate-fade-in { animation: fade-in 0.3s ease; }
  .animate-toast-in { animation: toast-in 0.3s ease-out; }
  
  /* Touch-friendly controls */
  @media (hover: none) {
    button, a {
      min-height: 44px;
      min-width: 44px;
    }
  }
  
  @media (min-width: 768px) {
    .max-w-md { max-width: 28rem; }
  }
  
  /* Dark mode overrides */
  .dark .shimmer-line {
    background: linear-gradient(to right, rgba(30,30,30,0.1) 8%, rgba(60,60,60,0.2) 18%, rgba(30,30,30,0.1) 33%);
  }
`;
document.head.appendChild(styleSheet);

export default TaskEventManager;