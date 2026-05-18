import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

// Updated Midnight Luxe Theme Styles
const styles = {
  // Core styles
  container: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    color: '#e4e6eb',
    backgroundColor: '#121212',
    minHeight: '100vh',
    position: 'relative',
    paddingBottom: '60px',
  },
  contentWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    paddingTop: '80px', // Space for fixed navbar
  },
  
  // Navbar styles
  navbar: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    backgroundColor: '#1c1c2a',
    borderBottom: '1px solid #2a2a3a',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    height: '60px',
    justifyContent: 'space-between',
    zIndex: '1000',
    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
    fontSize: '20px',
    color: '#7e6ef7',
  },
  logoIcon: {
    height: '28px',
    width: '28px',
    borderRadius: '6px',
    backgroundColor: '#7e6ef7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  navbarSearch: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#252538',
    borderRadius: '20px',
    padding: '5px 15px',
    marginLeft: '20px',
    transition: 'all 0.3s',
    width: '300px',
    border: '1px solid #3a3a50',
  },
  searchIcon: {
    marginRight: '10px',
    color: '#6e6e8a',
  },
  navbarSearchInput: {
    background: 'transparent',
    border: 'none',
    color: '#e4e6eb',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  },
  navbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  navbarButton: {
    backgroundColor: '#7e6ef7',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  },
  navIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
    backgroundColor: '#252538',
    color: '#a8a9bc',
  },
  
  // Header and general controls
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  heading: {
    margin: '0',
    color: '#e4e6eb',
    fontSize: '24px',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#7e6ef7',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    boxShadow: '0 2px 5px rgba(126, 110, 247, 0.3)',
  },
  
  // Stats section
  statsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statBox: {
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    backgroundColor: '#1c1c2a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #2a2a3a',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
    fontSize: '18px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 5px 0',
  },
  statLabel: {
    fontSize: '14px',
    color: '#a8a9bc',
    margin: '0',
  },
  overdue: {
    borderTop: '4px solid #ff6b6b',
  },
  dueToday: {
    borderTop: '4px solid #ffa638',
  },
  upcoming: {
    borderTop: '4px solid #3498db',
  },
  completed: {
    borderTop: '4px solid #4cd964',
  },
  
  // Filters
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #2a2a3a',
    background: '#1c1c2a',
    color: '#a8a9bc',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
  },
  activeFilter: {
    backgroundColor: '#7e6ef7',
    color: 'white',
    border: '1px solid #7e6ef7',
  },
  
  // Search box
  searchBox: {
    padding: '12px 16px',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    marginBottom: '24px',
    width: '100%',
    fontSize: '14px',
    backgroundColor: '#1c1c2a',
    color: '#e4e6eb',
  },
  
  // Task list
  taskList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '16px',
  },
  taskItem: {
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'all 0.3s',
    backgroundColor: '#1c1c2a',
    border: '1px solid #2a2a3a',
    display: 'flex',
    flexDirection: 'column',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  taskDetails: {
    flex: '1',
  },
  taskName: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#e4e6eb',
    wordBreak: 'break-word',
  },
  taskDescription: {
    margin: '10px 0',
    color: '#a8a9bc',
    fontSize: '14px',
    lineHeight: '1.5',
    wordBreak: 'break-word',
  },
  taskDate: {
    fontSize: '14px',
    color: '#6e6e8a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  taskTags: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  priorityTag: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  typeTag: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#252538',
    color: '#a8a9bc',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  button: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    flex: '1',
  },
  editButton: {
    backgroundColor: '#7e6ef7',
    color: 'white',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    color: 'white',
  },
  completeButton: {
    backgroundColor: '#4cd964',
    color: 'white',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#a8a9bc',
    backgroundColor: '#1c1c2a',
    borderRadius: '12px',
    border: '1px dashed #2a2a3a',
    gridColumn: '1 / -1',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#7e6ef7',
  },
  
  // Modal
  modal: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000',
    backdropFilter: 'blur(5px)',
  },
  modalContent: {
    backgroundColor: '#1c1c2a',
    padding: '24px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #2a2a3a',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    borderBottom: '1px solid #2a2a3a',
    paddingBottom: '16px',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    margin: '0',
    fontSize: '20px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: '#a8a9bc',
    fontSize: '24px',
    cursor: 'pointer',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#a8a9bc',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#252538',
    color: '#e4e6eb',
  },
  select: {
    width: '100%',
    padding: '12px',
    boxSizing: 'border-box',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#252538',
    color: '#e4e6eb',
    appearance: 'none',
    background: `#252538 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a8a9bc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center`,
    backgroundSize: '16px',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    backgroundColor: '#252538',
    color: '#a8a9bc',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#7e6ef7',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  
  // Notification
  notification: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px 20px',
    backgroundColor: '#1c1c2a',
    color: 'white',
    borderRadius: '8px',
    boxShadow: '0 3px 15px rgba(0,0,0,0.3)',
    zIndex: '1001',
    transition: 'transform 0.3s, opacity 0.3s',
    transform: 'translateY(100px)',
    opacity: '0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid #2a2a3a',
    maxWidth: '350px',
  },
  notificationShow: {
    transform: 'translateY(0)',
    opacity: '1',
  },
  notificationIcon: {
    width: '20px',
    height: '20px',
    backgroundColor: '#7e6ef7',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '15px 20px',
    backgroundColor: '#1c1c2a',
    borderTop: '1px solid #2a2a3a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#6e6e8a',
    fontSize: '13px',
  },
  footerLinks: {
    display: 'flex',
    gap: '15px',
  },
  footerLink: {
    color: '#a8a9bc',
    textDecoration: 'none',
    transition: 'color 0.3s',
  },
  
  // Responsive styles
  responsive: {
    '@media (max-width: 768px)': {
      navbarSearch: {
        display: 'none',
      },
      statsSection: {
        gridTemplateColumns: '1fr',
      },
      taskList: {
        gridTemplateColumns: '1fr',
      },
      header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '15px',
      },
      filters: {
        overflowX: 'auto',
        padding: '5px 0',
        maxWidth: '100%',
      },
      filterButton: {
        whiteSpace: 'nowrap',
      },
      buttons: {
        flexWrap: 'wrap',
      },
    },
  },

  // Global styles
  globalStyles: {
    body: {
      margin: '0',
      backgroundColor: '#121212',
      color: '#e4e6eb',
      fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    },
    '*': {
      boxSizing: 'border-box',
    },
  },
};

// Apply global styles
const applyGlobalStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    body {
      margin: 0;
      background-color: #121212;
      color: #e4e6eb;
      font-family: "Inter", "Segoe UI", "Roboto", sans-serif;
    }
    * {
      box-sizing: border-box;
    }
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #1c1c2a;
    }
    ::-webkit-scrollbar-thumb {
      background: #2a2a3a;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3a3a50;
    }
  `;
  document.head.appendChild(styleElement);

  // Add Google Font - Inter
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
  document.head.appendChild(linkElement);
};

// Types
type Priority = 'Low' | 'Medium' | 'High';
type TaskType = 'Task' | 'Event' | 'Meeting' | 'Reminder';
type Status = 'Pending' | 'In Progress' | 'Completed';
type FilterType = 'All' | 'Overdue' | 'Today' | 'Upcoming' | 'Completed';

interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: string;  // ISO string
  priority: Priority;
  type: TaskType;
  status: Status;
  createdAt: string; // ISO string
}

// Icons as separate components
const Icons = {
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  ),
  EmptyBox: () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="9" y1="9" x2="15" y2="15"></line>
      <line x1="15" y1="9" x2="9" y2="15"></line>
    </svg>
  ),
  Flag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
      <line x1="4" y1="22" x2="4" y2="15"></line>
    </svg>
  ),
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  ),
};

const TaskManager: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [navbarSearchTerm, setNavbarSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [notification, setNotification] = useState<{message: string, show: boolean}>({message: '', show: false});

  // Refs
  const notificationTimeoutRef = useRef<number | null>(null);
  const navbarSearchRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    // Apply global styles when component mounts
    applyGlobalStyles();
    
    // Save tasks to localStorage whenever they change
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Check for tasks due soon
    checkTasksForNotifications();
  }, [tasks]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Check for overdue tasks every minute
    const interval = setInterval(checkTasksForNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Apply navbar search to regular search
  useEffect(() => {
    setSearchTerm(navbarSearchTerm);
  }, [navbarSearchTerm]);

  // Helper Functions
  const checkTasksForNotifications = () => {
    const now = new Date();
    const soon = new Date(now);
    soon.setHours(now.getHours() + 1);

    for (const task of tasks) {
      if (task.status === 'Completed') continue;
      
      const dueDate = new Date(task.dueDate);
      
      // If task is due within the next hour and hasn't been completed
      if (dueDate > now && dueDate <= soon) {
        showNotification(`Task due soon: ${task.name}`);
        
        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Task Manager", {
            body: `Task due soon: ${task.name}`,
            icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzdlNmVmNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHJ4PSIxMiIgcnk9IjEyIiBmaWxsPSIjN2U2ZWY3Ii8+PHRleHQgeD0iMTIiIHk9IjE3IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+VE08L3RleHQ+PC9zdmc+",
          });
        }
        break;
      }
    }
  };

  const showNotification = (message: string) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ message, show: true });

    // Hide after 5 seconds
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const addTask = () => {
    setCurrentTask({
      id: Date.now().toString(),
      name: '',
      description: '',
      dueDate: new Date().toISOString().slice(0, 16),
      priority: 'Medium',
      type: 'Task',
      status: 'Pending',
      createdAt: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const editTask = (task: Task) => {
    setCurrentTask({
      ...task,
      dueDate: new Date(task.dueDate).toISOString().slice(0, 16)
    });
    setIsModalOpen(true);
  };

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTask || !currentTask.name.trim()) return;
    
    if (tasks.some(task => task.id === currentTask.id)) {
      // Update existing task
      setTasks(tasks.map(task => 
        task.id === currentTask.id ? currentTask : task
      ));
      showNotification('Task updated successfully!');
    } else {
      // Add new task
      setTasks([...tasks, currentTask]);
      showNotification('Task added successfully!');
    }
    
    setIsModalOpen(false);
    setCurrentTask(null);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    showNotification('Task deleted successfully!');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: task.status === 'Completed' ? 'Pending' : 'Completed' } 
        : task
    ));
  };

  const handleNavbarSearchFocus = () => {
    if (navbarSearchRef.current) {
      navbarSearchRef.current.focus();
    }
  };

  // Filters and calculations
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'Overdue':
        return taskDate < today && task.status !== 'Completed';
      case 'Today':
        return taskDate.getTime() === today.getTime() && task.status !== 'Completed';
      case 'Upcoming':
        return taskDate > today && task.status !== 'Completed';
      case 'Completed':
        return task.status === 'Completed';
      default:
        return true;
    }
  });

  // Stats calculations
  const stats = {
    overdue: tasks.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate < today && task.status !== 'Completed';
    }).length,
    dueToday: tasks.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && task.status !== 'Completed';
    }).length,
    upcoming: tasks.filter(task => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate > today && task.status !== 'Completed';
    }).length,
    completed: tasks.filter(task => task.status === 'Completed').length
  };

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return { backgroundColor: '#ff6b6b30', color: '#ff6b6b', border: '1px solid #ff6b6b50' };
      case 'Medium':
        return { backgroundColor: '#ffa63830', color: '#ffa638', border: '1px solid #ffa63850' };
      case 'Low':
        return { backgroundColor: '#3498db30', color: '#3498db', border: '1px solid #3498db50' };
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return <Icons.Flag />;
      case 'Medium':
        return <Icons.Play />;
      case 'Low':
        return null;
    }
  };

  const getTaskItemStyle = (task: Task) => {
    const baseStyle = { ...styles.taskItem };
    
    if (task.status === 'Completed') {
      return { ...baseStyle, opacity: 0.6, backgroundColor: '#1a1a28' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      // Overdue
      return { ...baseStyle, borderLeft: '4px solid #ff6b6b' };
    } else if (taskDate.getTime() === today.getTime()) {
      // Due today
      return { ...baseStyle, borderLeft: '4px solid #ffa638' };
    } else {
      // Upcoming
      return baseStyle;
    }
  };

  const formatDate = (date: string) => {
    const taskDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset time part for date comparisons
    const taskDateDay = new Date(taskDate);
    taskDateDay.setHours(0, 0, 0, 0);
    const todayDay = new Date(today);
    todayDay.setHours(0, 0, 0, 0);
    const tomorrowDay = new Date(tomorrow);
    tomorrowDay.setHours(0, 0, 0, 0);
    
    // Format time part
    const timeString = taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (taskDateDay.getTime() === todayDay.getTime()) {
      return `Today at ${timeString}`;
    } else if (taskDateDay.getTime() === tomorrowDay.getTime()) {
      return `Tomorrow at ${timeString}`;
    } else {
      return taskDate.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: taskDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      }) + ` at ${timeString}`;
    }
  };

  // Render
  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <div style={styles.navbarLeft}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>TM</div>
            <span>TaskMaster</span>
          </div>
          <div style={styles.navbarSearch} onClick={handleNavbarSearchFocus}>
            <span style={styles.searchIcon}><Icons.Search /></span>
            <input 
              type="text" 
              placeholder="Search tasks..." 
              style={styles.navbarSearchInput}
              value={navbarSearchTerm}
              onChange={(e) => setNavbarSearchTerm(e.target.value)}
              ref={navbarSearchRef}
            />
          </div>
        </div>
        <div style={styles.navbarRight}>
          <button style={styles.navbarButton} onClick={addTask}>
            <Icons.Plus /> New Task
          </button>
          <div style={styles.navIcon}>
            <Icons.Bell />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        <header style={styles.header}>
          <h1 style={styles.heading}>Dashboard</h1>
          <button 
            style={styles.addButton} 
            onClick={addTask}
          >
            <Icons.Plus /> Add New Task
          </button>
        </header>

        <div style={styles.statsSection}>
          <div style={{...styles.statBox, ...styles.overdue}}>
            <div style={{...styles.statIcon, backgroundColor: '#ff6b6b20', color: '#ff6b6b'}}>
              <Icons.Clock />
            </div>
            <div style={{...styles.statNumber, color: '#ff6b6b'}}>{stats.overdue}</div>
            <p style={styles.statLabel}>Overdue</p>
          </div>
          <div style={{...styles.statBox, ...styles.dueToday}}>
            <div style={{...styles.statIcon, backgroundColor: '#ffa63820', color: '#ffa638'}}>
              <Icons.Calendar />
            </div>
            <div style={{...styles.statNumber, color: '#ffa638'}}>{stats.dueToday}</div>
            <p style={styles.statLabel}>Due Today</p>
          </div>
          <div style={{...styles.statBox, ...styles.upcoming}}>
            <div style={{...styles.statIcon, backgroundColor: '#3498db20', color: '#3498db'}}>
              <Icons.Calendar />
            </div>
            <div style={{...styles.statNumber, color: '#3498db'}}>{stats.upcoming}</div>
            <p style={styles.statLabel}>Upcoming</p>
          </div>
          <div style={{...styles.statBox, ...styles.completed}}>
            <div style={{...styles.statIcon, backgroundColor: '#4cd96420', color: '#4cd964'}}>
              <Icons.Check />
            </div>
            <div style={{...styles.statNumber, color: '#4cd964'}}>{stats.completed}</div>
            <p style={styles.statLabel}>Completed</p>
          </div>
        </div>

        <div style={styles.filters}>
          {(['All', 'Overdue', 'Today', 'Upcoming', 'Completed'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              style={{
                ...styles.filterButton,
                ...(filter === filterType ? styles.activeFilter : {})
              }}
              onClick={() => setFilter(filterType)}
            >
              {filterType}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search tasks..."
          style={styles.searchBox}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <ul style={styles.taskList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <li key={task.id} style={getTaskItemStyle(task)}>
                <div style={styles.taskDetails}>
                  <div style={styles.taskHeader}>
                    <h3 style={{
                      ...styles.taskName, 
                      textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                    }}>
                      {task.name}
                    </h3>
                  </div>
                  
                  <div style={styles.taskTags}>
                    <span style={{...styles.priorityTag, ...getPriorityStyle(task.priority)}}>
                      {getPriorityIcon(task.priority)} {task.priority}
                    </span>
                    <span style={styles.typeTag}>
                      {task.type}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p style={styles.taskDescription}>
                      {task.description}
                    </p>
                  )}
                  
                  <p style={styles.taskDate}>
                    <Icons.Calendar /> {formatDate(task.dueDate)}
                  </p>
                </div>
                
                <div style={styles.buttons}>
                  <button
                    style={{...styles.button, ...styles.completeButton}}
                    onClick={() => toggleTaskStatus(task.id)}
                  >
                    <Icons.Check /> {task.status === 'Completed' ? 'Reopen' : 'Complete'}
                  </button>
                  <button
                    style={{...styles.button, ...styles.editButton}}
                    onClick={() => editTask(task)}
                  >
                    <Icons.Edit /> Edit
                  </button>
                  <button
                    style={{...styles.button, ...styles.deleteButton}}
                    onClick={() => deleteTask(task.id)}
                  >
                    <Icons.Trash /> Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>
                <Icons.EmptyBox />
              </div>
              <h3>No tasks found</h3>
              <p>
                {searchTerm 
                  ? "No tasks match your search criteria" 
                  : filter !== 'All' 
                    ? `No ${filter.toLowerCase()} tasks found` 
                    : "Create a new task to get started"}
              </p>
              {!searchTerm && filter === 'All' && (
                <button style={styles.navbarButton} onClick={addTask}>
                  <Icons.Plus /> Create Task
                </button>
              )}
            </div>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div>© 2025 TaskMaster. All rights reserved</div>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>Privacy Policy</a>
          <a href="#" style={styles.footerLink}>Terms of Service</a>
          <a href="#" style={styles.footerLink}>Help</a>
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{currentTask?.id ? 'Edit Task' : 'Create New Task'}</h2>
              <button 
                style={styles.closeButton}
                onClick={() => {
                  setIsModalOpen(false);
                  setCurrentTask(null);
                }}
              >
                <Icons.Close />
              </button>
            </div>
            
            <form onSubmit={saveTask}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Task Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={currentTask?.name || ''}
                  onChange={(e) => currentTask && setCurrentTask({...currentTask, name: e.target.value})}
                  required
                  placeholder="Enter task name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{...styles.input, minHeight: '100px'}}
                  value={currentTask?.description || ''}
                  onChange={(e) => currentTask && setCurrentTask({...currentTask, description: e.target.value})}
                  placeholder="Add details about this task"
                ></textarea>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Due Date</label>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={currentTask?.dueDate || ''}
                  onChange={(e) => currentTask && setCurrentTask({...currentTask, dueDate: e.target.value})}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Priority</label>
                <select
                  style={styles.select}
                  value={currentTask?.priority || 'Medium'}
                  onChange={(e) => currentTask && setCurrentTask({
                    ...currentTask, 
                    priority: e.target.value as Priority
                  })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Type</label>
                <select
                  style={styles.select}
                  value={currentTask?.type || 'Task'}
                  onChange={(e) => currentTask && setCurrentTask({
                    ...currentTask, 
                    type: e.target.value as TaskType
                  })}
                >
                  <option value="Task">Task</option>
                  <option value="Event">Event</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Reminder">Reminder</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={currentTask?.status || 'Pending'}
                  onChange={(e) => currentTask && setCurrentTask({
                    ...currentTask, 
                    status: e.target.value as Status
                  })}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div style={styles.buttonRow}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => {
                    setIsModalOpen(false);
                    setCurrentTask(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.saveButton}
                >
                  {currentTask?.id ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      <div 
        style={{
          ...styles.notification, 
          ...(notification.show ? styles.notificationShow : {})
        }}
      >
        <div style={styles.notificationIcon}>
          <Icons.Check />
        </div>
        {notification.message}
      </div>
    </div>
  );
};

// Main App component to render TaskManager
const App: React.FC = () => {
  return <TaskManager />;
};

// Render the app
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

export default App;