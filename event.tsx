import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Add font styles to document head
const addFontStyles = () => {
    // Add Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Add custom typography CSS
    const style = document.createElement('style');
    style.textContent = `
    :root {
      --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-heading: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --line-height-normal: 1.5;
      --line-height-heading: 1.2;
      --font-weight-normal: 400;
      --font-weight-medium: 500;
      --font-weight-semibold: 600;
      --font-weight-bold: 700;
      --letter-spacing-tight: -0.025em;
      --letter-spacing-wide: 0.025em;
    }
    
    body {
      font-family: var(--font-primary);
      font-weight: var(--font-weight-normal);
      line-height: var(--line-height-normal);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    h1, h2, h3, h4, h5, h6, .heading {
      font-family: var(--font-heading);
      font-weight: var(--font-weight-semibold);
      line-height: var(--line-height-heading);
      letter-spacing: var(--letter-spacing-tight);
    }
    
    .prose {
      max-width: 65ch;
      line-height: 1.6;
    }
    
    .prose p {
      margin-bottom: 1.25em;
    }
    
    .prose ul, .prose ol {
      margin-top: 1em;
      margin-bottom: 1em;
      padding-left: 1.5em;
    }
    
    .card-title {
      font-size: 1.125rem;
      font-weight: var(--font-weight-semibold);
      margin-bottom: 0.5rem;
    }
    
    .text-balance {
      text-wrap: balance;
    }
    
    .text-pretty {
      text-wrap: pretty;
    }
    
    .text-label {
      font-size: 0.875rem;
      font-weight: var(--font-weight-medium);
    }
    
    .text-caption {
      font-size: 0.75rem;
      color: #6b7280;
    }
  `;
    document.head.appendChild(style);
};

// Initialize typography on load
if (typeof window !== 'undefined') {
    addFontStyles();
}

// Mobile viewport utility
const MobileViewportMeta = () => {
    useEffect(() => {
        // Add proper viewport meta tag for mobile devices
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return null;
};

// Types
interface Guest {
    id: number;
    name: string;
    email: string;
    rsvp: 'yes' | 'no' | 'pending';
    invitationSent: boolean;
    lastReminderSent?: string; // Track when last reminder was sent
}

interface EventDetails {
    id?: number;
    title: string;
    date: string;
    time: string;
    location: string;
    agenda: string[];
    reminderSchedule?: ReminderSchedule;
    lastUpdated?: string; // Track when event was last updated
    updates?: EventUpdate[]; // Track event updates history
}

interface ReminderSchedule {
    oneWeekBefore: boolean;
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    dayOf: boolean;
}

interface EventUpdate {
    date: string;
    field: string;
    oldValue: string;
    newValue: string;
}

// Email Service Mock
const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
    console.log(`Sending email to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // Simulate API call with a delay
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 95% success rate
            const success = Math.random() < 0.95;
            console.log(`Email to ${to} ${success ? 'sent successfully' : 'failed'}`);
            resolve(success);
        }, 800);
    });
};

// Generate iCalendar (.ics) format for calendar integration
const generateICalString = (event: EventDetails): string => {
    // Format date and time for iCal format
    const formatDate = (dateStr: string, timeStr: string): string => {
        const [year, month, day] = dateStr.split('-');
        const [hour, minute] = timeStr.split(':');
        // Format as YYYYMMDDTHHmmssZ
        return `${year}${month}${day}T${hour}${minute}00`;
    }
    
    const startDate = formatDate(event.date, event.time);
    
    // Calculate end date (assuming 1 hour event if not specified)
    const endHour = parseInt(event.time.split(':')[0]) + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:${event.time.split(':')[1]}`;
    const endDate = formatDate(event.date, endTime);
    
    // Construct iCal string
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Eventify//Event Management App//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${event.location}
DESCRIPTION:${event.agenda.join('\\n')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

// Function to trigger calendar file download
const downloadCalendarFile = (event: EventDetails): void => {
    const icalContent = generateICalString(event);
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    
    // Create download link
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
}

// Google Calendar URL generator
const generateGoogleCalendarURL = (event: EventDetails): string => {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
    
    const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
        location: event.location,
        details: `Agenda:\n${event.agenda.join('\n')}`,
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Outlook Calendar URL generator
const generateOutlookCalendarURL = (event: EventDetails): string => {
    const startDate = new Date(`${event.date}T${event.time}`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
    
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.title,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString(),
        location: event.location,
        body: `Agenda:\n${event.agenda.join('\n')}`
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

// Export Chart.js configuration for bundling
export const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                font: {
                    family: "'Inter', sans-serif",
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                precision: 0
            }
        }
    }
};

// Main App Component
const EventManagementApp: React.FC = () => {
    const [eventDetails, setEventDetails] = useState<EventDetails>({
        title: '',
        date: '',
        time: '',
        location: '',
        agenda: [],
    });
    const [guests, setGuests] = useState<Guest[]>([]);
    const [newGuest, setNewGuest] = useState({ name: '', email: '' });
    const [newAgendaItem, setNewAgendaItem] = useState('');
    const [notification, setNotification] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [events, setEvents] = useState<EventDetails[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [sendingEmails, setSendingEmails] = useState(false);
    const [emailProgress, setEmailProgress] = useState(0);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedEventForInvite, setSelectedEventForInvite] = useState<EventDetails | null>(null);
    const [emailResults, setEmailResults] = useState<{
        success: string[];
        failed: string[];
    }>({ success: [], failed: [] });
    const [selectedGuests, setSelectedGuests] = useState<Record<number, boolean>>({});
    const [newRecipientEmail, setNewRecipientEmail] = useState('');

    // New state for reminders and notifications
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedEventForReminder, setSelectedEventForReminder] = useState<EventDetails | null>(null);
    const [reminderSchedule, setReminderSchedule] = useState<ReminderSchedule>({
        oneWeekBefore: true,
        threeDaysBefore: true,
        oneDayBefore: true,
        dayOf: true,
    });
    const [showEventUpdateModal, setShowEventUpdateModal] = useState(false);
    const [selectedEventToUpdate, setSelectedEventToUpdate] = useState<EventDetails | null>(null);
    const [eventUpdates, setEventUpdates] = useState<EventUpdate[]>([]);

    // New state for calendar integration
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedEventForCalendar, setSelectedEventForCalendar] = useState<EventDetails | null>(null);

    // Open reminder scheduling modal
    const openReminderModal = (event: EventDetails) => {
        setSelectedEventForReminder(event);
        // Initialize with existing reminder settings or defaults
        setReminderSchedule(event.reminderSchedule || {
            oneWeekBefore: true,
            threeDaysBefore: true,
            oneDayBefore: true,
            dayOf: true
        });
        setShowReminderModal(true);
    };

    // Save reminder schedule for an event
    const saveReminderSchedule = () => {
        if (!selectedEventForReminder) return;

        // Update the event with the reminder schedule
        setEvents(events.map(event =>
            event.id === selectedEventForReminder.id
                ? { ...event, reminderSchedule: reminderSchedule }
                : event
        ));

        setNotification("Reminder schedule saved successfully!");
        setTimeout(() => setNotification(null), 3000);
        setShowReminderModal(false);
    };

    // Check for and send reminders based on schedule
    useEffect(() => {
        const reminderCheck = setInterval(() => {
            const now = new Date();

            events.forEach(event => {
                if (!event.reminderSchedule) return;

                const eventDate = new Date(event.date);
                const daysDifference = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // Find pending RSVPs
                const pendingGuests = guests.filter(g => g.rsvp === 'pending');
                if (pendingGuests.length === 0) return;

                // Check if we need to send reminders based on schedule
                let shouldSendReminder = false;

                if (event.reminderSchedule.oneWeekBefore && daysDifference === 7) {
                    shouldSendReminder = true;
                } else if (event.reminderSchedule.threeDaysBefore && daysDifference === 3) {
                    shouldSendReminder = true;
                } else if (event.reminderSchedule.oneDayBefore && daysDifference === 1) {
                    shouldSendReminder = true;
                } else if (event.reminderSchedule.dayOf && daysDifference === 0) {
                    shouldSendReminder = true;
                }

                // Send automated reminders if needed
                if (shouldSendReminder) {
                    console.log(`Sending automated reminders for ${event.title}`);

                    // Send reminder emails in the background
                    pendingGuests.forEach(guest => {
                        const currentDate = new Date().toISOString().split('T')[0];
                        // Only send reminder if we haven't sent one today
                        if (guest.lastReminderSent !== currentDate) {
                            sendEmail(
                                guest.email,
                                `Reminder: ${event.title} is coming soon!`,
                                `Dear ${guest.name},
                
This is a friendly reminder that "${event.title}" is happening ${daysDifference === 0 ? 'today' : `in ${daysDifference} day${daysDifference > 1 ? 's' : ''}`}.

Date: ${new Date(event.date).toLocaleDateString()}
Time: ${event.time}
Location: ${event.location}

Please let us know if you can attend by responding to this email.

Best regards,
Event Organizer`
                            ).then(success => {
                                if (success) {
                                    // Update the last reminder date
                                    setGuests(guests.map(g =>
                                        g.id === guest.id
                                            ? { ...g, lastReminderSent: currentDate }
                                            : g
                                    ));
                                }
                            });
                        }
                    });
                }
            });
        }, 30000); // Check every 30 seconds (in practice would be daily)

        return () => clearInterval(reminderCheck);
    }, [events, guests]);

    // Handle event updates and track changes
    const updateEvent = (eventId: number | undefined, updatedEvent: EventDetails) => {
        if (!eventId) return;

        // Find the original event
        const originalEvent = events.find(e => e.id === eventId);
        if (!originalEvent) return;

        // Track what fields changed
        const updates: EventUpdate[] = [];
        const fields: Array<keyof EventDetails> = ['title', 'date', 'time', 'location'];

        fields.forEach(field => {
            const oldValue = originalEvent[field] as string;
            const newValue = updatedEvent[field] as string;

            if (oldValue !== newValue) {
                updates.push({
                    date: new Date().toISOString(),
                    field: field,
                    oldValue,
                    newValue
                });
            }
        });

        // Update the event with changes and update history
        const now = new Date().toISOString();
        const updatedEventWithHistory = {
            ...updatedEvent,
            lastUpdated: now,
            updates: [...(originalEvent.updates || []), ...updates]
        };

        setEvents(events.map(event =>
            event.id === eventId ? updatedEventWithHistory : event
        ));

        // Notify guests about changes if there were any updates
        if (updates.length > 0) {
            notifyGuestsOfChanges(originalEvent, updatedEventWithHistory, updates);
        }
    };

    // Send notifications to guests about event changes
    const notifyGuestsOfChanges = (
        originalEvent: EventDetails,
        updatedEvent: EventDetails,
        changes: EventUpdate[]
    ) => {
        // Only notify guests who have RSVP'd yes
        const confirmedGuests = guests.filter(g => g.rsvp === 'yes');

        if (confirmedGuests.length === 0) return;

        // Create update message
        let updateMessage = `
Dear [Guest Name],

There have been changes to the event "${updatedEvent.title}" you're attending:

`;

        changes.forEach(change => {
            switch (change.field) {
                case 'title':
                    updateMessage += `- The event name has changed from "${change.oldValue}" to "${change.newValue}"\n`;
                    break;
                case 'date':
                    updateMessage += `- The date has changed from ${new Date(change.oldValue).toLocaleDateString()} to ${new Date(change.newValue).toLocaleDateString()}\n`;
                    break;
                case 'time':
                    updateMessage += `- The time has changed from ${change.oldValue} to ${change.newValue}\n`;
                    break;
                case 'location':
                    updateMessage += `- The location has changed from ${change.oldValue} to ${change.newValue}\n`;
                    break;
            }
        });

        updateMessage += `
All other details remain the same. Please let us know if you cannot attend with these new arrangements.

Best regards,
Event Organizer
`;

        // Send notifications to confirmed guests
        confirmedGuests.forEach(guest => {
            sendEmail(
                guest.email,
                `Important Update: Changes to "${updatedEvent.title}"`,
                updateMessage.replace('[Guest Name]', guest.name)
            );
        });

        setNotification(`Update notifications sent to ${confirmedGuests.length} confirmed guests`);
        setTimeout(() => setNotification(null), 3000);
    };

    // Simulate sending invites and reminders
    const sendInvites = async () => {
        if (!selectedEventForInvite) {
            setNotification('Please select an event before sending invitations.');
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        // Check if any guests are selected
        const selectedGuestCount = Object.values(selectedGuests).filter(Boolean).length;
        if (selectedGuestCount === 0) {
            setNotification('Please select at least one guest to send invitations to.');
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setSendingEmails(true);
        setEmailProgress(0);
        const successEmails: string[] = [];
        const failedEmails: string[] = [];

        // Get selected guests
        const guestsToEmail = guests.filter(g => selectedGuests[g.id]);

        for (let i = 0; i < guestsToEmail.length; i++) {
            const guest = guestsToEmail[i];
            const success = await sendEmail(
                guest.email,
                emailSubject,
                emailBody.replace('Dear Guest,', `Dear ${guest.name},`)
            );

            if (success) {
                successEmails.push(guest.email);
            } else {
                failedEmails.push(guest.email);
            }

            setEmailProgress(Math.round(((i + 1) / guestsToEmail.length) * 100));
        }

        setEmailResults({ success: successEmails, failed: failedEmails });

        // Update guests with invitation sent status
        setGuests(guests.map(g =>
            successEmails.includes(g.email) ? { ...g, invitationSent: true } : g
        ));

        setSendingEmails(false);
        setNotification(`Invitations sent: ${successEmails.length} successful, ${failedEmails.length} failed.`);
        setTimeout(() => setNotification(null), 5000);

        // Reset selected guests
        setSelectedGuests({});

        // Close the modal after sending
        if (failedEmails.length === 0) {
            setTimeout(() => setShowEmailModal(false), 2000);
        }
    };

    const sendReminders = () => {
        const pendingGuests = guests.filter((g) => g.rsvp === 'pending');
        console.log('Sending reminders to:', pendingGuests);
        setNotification('Reminders sent to pending guests!');
        setTimeout(() => setNotification(null), 3000);
    };

    // Handle guest addition
    const addGuest = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newGuest.name && newGuest.email) {
            setGuests([
                ...guests,
                {
                    id: Date.now(),
                    name: newGuest.name,
                    email: newGuest.email,
                    rsvp: 'pending',
                    invitationSent: false
                },
            ]);
            setNewGuest({ name: '', email: '' });
        }
    };

    // Handle RSVP update
    const updateRSVP = (id: number, rsvp: 'yes' | 'no') => {
        setGuests(guests.map((g) => (g.id === id ? { ...g, rsvp } : g)));
        setNotification(`RSVP updated for ${guests.find((g) => g.id === id)?.name}`);
        setTimeout(() => setNotification(null), 3000);
    };

    // Handle agenda addition
    const addAgendaItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAgendaItem) {
            setEventDetails({ ...eventDetails, agenda: [...eventDetails.agenda, newAgendaItem] });
            setNewAgendaItem('');
        }
    };

    // Handle calendar integration
    const addToCalendar = (event?: EventDetails) => {
        const eventToAdd = event || eventDetails;

        if (!eventToAdd.title || !eventToAdd.date || !eventToAdd.time || !eventToAdd.location) {
            setNotification('Please fill in all event details before adding to calendar!');
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setSelectedEventForCalendar(eventToAdd);
        setShowCalendarModal(true);
    };

    // Download event as iCalendar file
    const downloadAsICS = () => {
        if (!selectedEventForCalendar) return;

        downloadCalendarFile(selectedEventForCalendar);
        setNotification('Event downloaded as calendar file (.ics)!');
        setTimeout(() => setNotification(null), 3000);
        setShowCalendarModal(false);
    };

    // Add to Google Calendar
    const addToGoogleCalendar = () => {
        if (!selectedEventForCalendar) return;

        const url = generateGoogleCalendarURL(selectedEventForCalendar);
        window.open(url, '_blank');
        setNotification('Opening Google Calendar...');
        setTimeout(() => setNotification(null), 3000);
    };

    // Add to Outlook Calendar
    const addToOutlookCalendar = () => {
        if (!selectedEventForCalendar) return;

        const url = generateOutlookCalendarURL(selectedEventForCalendar);
        window.open(url, '_blank');
        setNotification('Opening Outlook Calendar...');
        setTimeout(() => setNotification(null), 3000);
    };

    // Simulate calendar integration
    const addToCalendarLegacy = () => {
        console.log('Adding to calendar:', eventDetails);
        setNotification('Event added to calendar!');
        setTimeout(() => setNotification(null), 3000);
    };

    // Handle event creation
    const createEvent = () => {
        if (eventDetails.title && eventDetails.date && eventDetails.time && eventDetails.location) {
            // Add the new event to events list
            setEvents([...events, { ...eventDetails }]);

            // Reset event details form
            setEventDetails({
                title: '',
                date: '',
                time: '',
                location: '',
                agenda: [],
            });

            setNotification('Event created successfully!');
            setTimeout(() => setNotification(null), 3000);
        } else {
            setNotification('Please fill in all event details!');
            setTimeout(() => setNotification(null), 3000);
        }
    };

    // Generate email content based on event details
    const generateEmailContent = (event: EventDetails) => {
        const subject = `Invitation: ${event.title}`;
        const body = `
Dear Guest,

You are cordially invited to ${event.title}!

Date: ${new Date(event.date).toLocaleDateString()}
Time: ${event.time}
Location: ${event.location}

${event.agenda.length > 0 ? `
Agenda:
${event.agenda.map(item => `• ${item}`).join('\n')}
` : ''}

Please RSVP by clicking on the link below:
[RSVP Link - This would be a real link in a production app]

We look forward to seeing you there!

Best regards,
Event Organizer
    `;

        setEmailSubject(subject);
        setEmailBody(body);
    };

    // Open the email invitation modal
    const openInvitationModal = (event: EventDetails) => {
        // Reset previous states
        setEmailResults({ success: [], failed: [] });

        // Pre-select all guests who have not received invitations yet
        const initialSelectedGuests: Record<number, boolean> = {};
        guests.forEach(guest => {
            initialSelectedGuests[guest.id] = !guest.invitationSent;
        });

        setSelectedGuests(initialSelectedGuests);
        setSelectedEventForInvite(event);
        generateEmailContent(event);
        setShowEmailModal(true);
    };

    // RSVP Chart Data
    const rsvpData = {
        labels: ['Yes', 'No', 'Pending'],
        datasets: [
            {
                label: 'RSVP Status',
                data: [
                    guests.filter((g) => g.rsvp === 'yes').length,
                    guests.filter((g) => g.rsvp === 'no').length,
                    guests.filter((g) => g.rsvp === 'pending').length,
                ],
                backgroundColor: ['#34d399', '#ef4444', '#fbbf24'], // teal-400, red-500, amber-400
            },
        ],
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-teal-50 font-sans flex flex-col">
            <MobileViewportMeta />
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-indigo-600 text-white shadow-md z-10">
                <div className="flex justify-between items-center h-16 px-4 max-w-3xl mx-auto">
                    <div className="flex items-center space-x-2">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <div className="text-xl font-bold font-heading">Eventify</div>
                    </div>
                    <button
                        className="p-2 rounded-md hover:bg-indigo-700 transition"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="bg-indigo-700 px-4 py-2 shadow-lg max-w-3xl mx-auto">
                        <button
                            className="w-full text-left p-3 rounded-md hover:bg-indigo-600 transition mt-1 flex items-center gap-2"
                            onClick={() => {
                                setIsMenuOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                            </svg>
                            <span>Back to Top</span>
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="px-4 pt-20 pb-6 max-w-3xl mx-auto flex-grow">
                <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center tracking-tight font-heading">
                    Event Management
                </h1>

                {/* Event Details Form */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4 font-heading tracking-tight">
                        Create New Event
                    </h2>
                    <form className="space-y-3">
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Event Title</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="text"
                                placeholder="Enter event title"
                                value={eventDetails.title}
                                onChange={(e) => setEventDetails({ ...eventDetails, title: e.target.value })}
                                aria-label="Event Title"
                            />
                        </div>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Date</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="date"
                                value={eventDetails.date}
                                onChange={(e) => setEventDetails({ ...eventDetails, date: e.target.value })}
                                aria-label="Event Date"
                            />
                        </div>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Time</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="time"
                                value={eventDetails.time}
                                onChange={(e) => setEventDetails({ ...eventDetails, time: e.target.value })}
                                aria-label="Event Time"
                            />
                        </div>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Location</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="text"
                                placeholder="Enter location"
                                value={eventDetails.location}
                                onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                                aria-label="Event Location"
                            />
                        </div>
                        <button
                            className="w-full p-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
                            type="button"
                            onClick={() => addToCalendar()}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Add to Calendar
                        </button>
                        <button
                            className="w-full p-2.5 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition"
                            type="button"
                            onClick={createEvent}
                        >
                            Create Event
                        </button>
                    </form>
                </section>

                {/* Events Dashboard */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4 font-heading tracking-tight">
                        Events Dashboard
                    </h2>
                    {events.length === 0 ? (
                        <div className="p-6 bg-gray-100 rounded-md text-center text-gray-500 font-medium">
                            No events created yet. Add an event above to get started!
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {events.map((event, index) => (
                                <div key={index} className="p-5 bg-white rounded-md shadow-md">
                                    <h3 className="card-title text-indigo-600 text-balance text-lg">{event.title}</h3>
                                    <div className="space-y-3 mb-4 prose prose-sm">
                                        <p className="text-gray-700 flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}
                                        </p>
                                        <p className="text-gray-700 flex items-center">
                                            <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span className="font-medium">Time:</span> {event.time}
                                        </p>
                                        <p className="text-gray-700 flex items-start">
                                            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            </svg>
                                            <span className="font-medium">Location:</span> <span className="break-words">{event.location}</span>
                                        </p>
                                        {event.agenda.length > 0 && (
                                            <div>
                                                <p className="font-medium text-gray-700 flex items-center">
                                                    <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                                    </svg>
                                                    Agenda:
                                                </p>
                                                <ul className="list-disc ml-6 text-gray-600 text-pretty">
                                                    {event.agenda.map((item, i) => (
                                                        <li key={i} className="mb-1 break-words">{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        <button
                                            className="w-full p-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
                                            onClick={() => openInvitationModal(event)}
                                        >
                                            Send Invitations
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className="p-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center justify-center"
                                                onClick={() => openReminderModal({ ...event, id: index })}
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <span>Reminders</span>
                                            </button>
                                            <button
                                                className="p-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition flex items-center justify-center"
                                                onClick={() => {
                                                    setSelectedEventToUpdate({ ...event, id: index });
                                                    setShowEventUpdateModal(true);
                                                }}
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                                <span>Update</span>
                                            </button>
                                        </div>
                                        <button
                                            className="w-full p-3 bg-cyan-600 text-white font-medium rounded-md hover:bg-cyan-700 transition flex items-center justify-center"
                                            onClick={() => addToCalendar(event)}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            Add to Calendar
                                        </button>
                                        {event.reminderSchedule && (
                                            <div className="text-caption flex items-center text-green-600 pl-1">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Automated Reminders Set
                                            </div>
                                        )}
                                        {event.lastUpdated && (
                                            <div className="text-caption text-blue-600 pl-1">
                                                Last updated: {new Date(event.lastUpdated).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Agenda Management */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4 font-heading tracking-tight">
                        Event Agenda
                    </h2>
                    <form className="space-y-3" onSubmit={addAgendaItem}>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">New Agenda Item</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="text"
                                placeholder="Add agenda item"
                                value={newAgendaItem}
                                onChange={(e) => setNewAgendaItem(e.target.value)}
                                aria-label="Agenda Item"
                            />
                        </div>
                        <button
                            className="w-full p-2.5 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 transition"
                            type="submit"
                        >
                            Add Item
                        </button>
                    </form>
                    {eventDetails.agenda.length > 0 ? (
                        <ul className="mt-4 space-y-2">
                            {eventDetails.agenda.map((item, index) => (
                                <li key={index} className="p-3 text-sm bg-gray-100 rounded-md text-pretty">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-center text-gray-500 text-sm italic">
                            No agenda items added yet.
                        </p>
                    )}
                </section>

                {/* Guest Management */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4 font-heading tracking-tight">
                        Guest List
                    </h2>
                    <form className="space-y-3" onSubmit={addGuest}>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Guest Name</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="text"
                                placeholder="Enter guest name"
                                value={newGuest.name}
                                onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                aria-label="Guest Name"
                            />
                        </div>
                        <div>
                            <label className="block text-label text-gray-700 mb-1">Guest Email</label>
                            <input
                                className="w-full p-2.5 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                                type="email"
                                placeholder="Enter guest email"
                                value={newGuest.email}
                                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                                aria-label="Guest Email"
                            />
                        </div>
                        <button
                            className="w-full p-2.5 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 transition"
                            type="submit"
                        >
                            Add Guest
                        </button>
                    </form>

                    {guests.length > 0 ? (
                        <ul className="mt-4 space-y-3">
                            {guests.map((guest) => (
                                <li
                                    key={guest.id}
                                    className="p-4 bg-white rounded-md shadow-sm"
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium text-gray-900">
                                                    {guest.name}
                                                </span>
                                                <div className="text-caption text-gray-500">
                                                    {guest.email}
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className={`text-sm px-2 py-1 rounded-full ${guest.rsvp === 'yes' ? 'bg-green-100 text-green-800' :
                                                        guest.rsvp === 'no' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {guest.rsvp === 'yes' ? 'Attending' :
                                                        guest.rsvp === 'no' ? 'Not Attending' :
                                                            'Awaiting Response'}
                                                </span>
                                            </div>
                                        </div>
                                        {guest.invitationSent && (
                                            <div className="text-caption flex items-center text-green-600 mt-1">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Invitation Sent
                                            </div>
                                        )}
                                        {guest.lastReminderSent && (
                                            <div className="text-caption flex items-center text-blue-600 mt-1">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                Last reminded: {new Date(guest.lastReminderSent).toLocaleDateString()}
                                            </div>
                                        )}
                                        <div className="flex gap-3 mt-2">
                                            <button
                                                className="flex-1 p-3 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 transition flex items-center justify-center"
                                                onClick={() => updateRSVP(guest.id, 'yes')}
                                                aria-label={`RSVP Yes for ${guest.name}`}
                                            >
                                                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Yes
                                            </button>
                                            <button
                                                className="flex-1 p-3 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition flex items-center justify-center"
                                                onClick={() => updateRSVP(guest.id, 'no')}
                                                aria-label={`RSVP No for ${guest.name}`}
                                            >
                                                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-center text-gray-500 text-sm italic">
                            No guests added yet. Add your first guest above.
                        </p>
                    )}
                </section>

                {/* RSVP Chart */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-indigo-700 mb-4 font-heading tracking-tight">
                        RSVP Tracking
                    </h2>
                    <div className="p-5 bg-white rounded-md shadow-sm">
                        <div className="w-full h-64">
                            <Bar data={rsvpData} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        labels: {
                                            font: {
                                                family: "'Inter', sans-serif",
                                                size: 12
                                            }
                                        }
                                    },
                                    title: {
                                        display: true,
                                        text: 'Guest Response Summary',
                                        font: {
                                            family: "'Poppins', sans-serif",
                                            size: 16,
                                            weight: 'bold'
                                        }
                                    }
                                }
                            }} />
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <div className="font-medium text-lg text-gray-800">
                                    {guests.filter((g) => g.rsvp === 'yes').length}
                                </div>
                                <div className="text-sm text-green-600">Confirmed</div>
                            </div>
                            <div>
                                <div className="font-medium text-lg text-gray-800">
                                    {guests.filter((g) => g.rsvp === 'no').length}
                                </div>
                                <div className="text-sm text-red-600">Declined</div>
                            </div>
                            <div>
                                <div className="font-medium text-lg text-gray-800">
                                    {guests.filter((g) => g.rsvp === 'pending').length}
                                </div>
                                <div className="text-sm text-amber-600">Awaiting Response</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Email Invitation Modal */}
                {showEmailModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
                            <div className="sticky top-0 p-4 border-b border-gray-200 bg-white z-10">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Send Email Invitations
                                    </h3>
                                    <button
                                        onClick={() => setShowEmailModal(false)}
                                        className="text-gray-400 hover:text-gray-600 p-2"
                                        aria-label="Close"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Event: {selectedEventForInvite?.title}
                                </p>
                            </div>

                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        className="w-full p-3 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Message
                                    </label>
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        rows={8}
                                        className="w-full p-3 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                    ></textarea>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Select Guests
                                        </label>
                                        <span className="text-xs text-indigo-600">
                                            {Object.values(selectedGuests).filter(Boolean).length} selected
                                        </span>
                                    </div>
                                    
                                    {guests.length === 0 ? (
                                        <div className="p-3 border border-dashed border-gray-300 rounded-md text-center text-sm text-gray-500">
                                            No guests added yet. Add guests below.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-2 flex justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newSelectedGuests = { ...selectedGuests };
                                                        guests.forEach(guest => {
                                                            newSelectedGuests[guest.id] = true;
                                                        });
                                                        setSelectedGuests(newSelectedGuests);
                                                    }}
                                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedGuests({})}
                                                    className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                                                <ul className="divide-y divide-gray-200">
                                                    {guests.map((guest) => (
                                                        <li key={guest.id} className="p-2 hover:bg-gray-50">
                                                            <label 
                                                                htmlFor={`guest-${guest.id}`}
                                                                className="flex items-center py-1 cursor-pointer w-full"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    id={`guest-${guest.id}`}
                                                                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-3"
                                                                    checked={selectedGuests[guest.id] || false}
                                                                    onChange={(e) =>
                                                                        setSelectedGuests({
                                                                            ...selectedGuests,
                                                                            [guest.id]: e.target.checked,
                                                                        })
                                                                    }
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm text-gray-700">{guest.name}</div>
                                                                    <div className="text-xs text-gray-500 truncate">{guest.email}</div>
                                                                </div>
                                                                {guest.invitationSent && (
                                                                    <span className="ml-1 flex-shrink-0 text-green-500 text-xs flex items-center">
                                                                        <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                        Invited
                                                                    </span>
                                                                )}
                                                            </label>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Add New Recipient
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Enter name"
                                            className="w-full p-3 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                            value={newGuest.name}
                                            onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                        />
                                        <div className="flex space-x-2">
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                className="flex-1 p-3 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                                                value={newGuest.email}
                                                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md"
                                                onClick={addGuest}
                                                disabled={!newGuest.name || !newGuest.email}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {sendingEmails && (
                                    <div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                            <div
                                                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                                style={{ width: `${emailProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-center text-gray-600">
                                            Sending... {emailProgress}%
                                        </p>
                                    </div>
                                )}

                                {emailResults.success.length > 0 && (
                                    <div className="text-sm text-green-500 bg-green-50 p-3 rounded">
                                        <p className="font-medium">Successfully sent to {emailResults.success.length} recipients!</p>
                                    </div>
                                )}

                                {emailResults.failed.length > 0 && (
                                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                                        <p className="font-medium">Failed to send to {emailResults.failed.length} recipients:</p>
                                        <ul className="list-disc ml-5 mt-1">
                                            {emailResults.failed.map((email, i) => (
                                                <li key={i}>{email}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
                                <button
                                    className="px-4 py-3 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md w-full sm:w-auto font-medium"
                                    onClick={() => setShowEmailModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-3 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto font-medium"
                                    onClick={sendInvites}
                                    disabled={sendingEmails || Object.values(selectedGuests).filter(Boolean).length === 0}
                                >
                                    {sendingEmails ? 'Sending...' : 'Send Invitations'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification */}
                {notification && (
                    <div className="fixed top-16 right-2 p-3 bg-teal-500 text-white text-sm rounded-md shadow-lg max-w-xs">
                        {notification}
                    </div>
                )}

                {/* Reminder Schedule Modal */}
                {showReminderModal && selectedEventForReminder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
                            <div className="sticky top-0 p-4 border-b border-gray-200 bg-white z-10">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Schedule Reminders
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Event: {selectedEventForReminder.title}
                                </p>
                            </div>

                            <div className="p-4 space-y-4">
                                <p className="text-sm text-gray-700">
                                    Set automated reminders for guests who have not RSVP'd yet. Reminders will be sent automatically at the selected times.
                                </p>

                                <div className="space-y-3">
                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={reminderSchedule.oneWeekBefore}
                                            onChange={(e) => setReminderSchedule({
                                                ...reminderSchedule,
                                                oneWeekBefore: e.target.checked
                                            })}
                                        />
                                        <span className="text-sm text-gray-700">1 week before the event</span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={reminderSchedule.threeDaysBefore}
                                            onChange={(e) => setReminderSchedule({
                                                ...reminderSchedule,
                                                threeDaysBefore: e.target.checked
                                            })}
                                        />
                                        <span className="text-sm text-gray-700">3 days before the event</span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={reminderSchedule.oneDayBefore}
                                            onChange={(e) => setReminderSchedule({
                                                ...reminderSchedule,
                                                oneDayBefore: e.target.checked
                                            })}
                                        />
                                        <span className="text-sm text-gray-700">1 day before the event</span>
                                    </label>

                                    <label className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={reminderSchedule.dayOf}
                                            onChange={(e) => setReminderSchedule({
                                                ...reminderSchedule,
                                                dayOf: e.target.checked
                                            })}
                                        />
                                        <span className="text-sm text-gray-700">Day of the event</span>
                                    </label>
                                </div>
                            </div>

                            <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white flex justify-end space-x-3">
                                <button
                                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                    onClick={() => setShowReminderModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                    onClick={saveReminderSchedule}
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Update Modal */}
                {showEventUpdateModal && selectedEventToUpdate && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
                      <div className="sticky top-0 p-4 border-b border-gray-200 bg-white z-10">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Update Event
                          </h3>
                          <button 
                            onClick={() => setShowEventUpdateModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Close"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Any changes will be automatically notified to confirmed guests
                        </p>
                      </div>
                      
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Title
                          </label>
                          <input
                            type="text"
                            value={selectedEventToUpdate.title}
                            onChange={(e) => setSelectedEventToUpdate({
                              ...selectedEventToUpdate,
                              title: e.target.value
                            })}
                            className="w-full p-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={selectedEventToUpdate.date}
                            onChange={(e) => setSelectedEventToUpdate({
                              ...selectedEventToUpdate,
                              date: e.target.value
                            })}
                            className="w-full p-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time
                          </label>
                          <input
                            type="time"
                            value={selectedEventToUpdate.time}
                            onChange={(e) => setSelectedEventToUpdate({
                              ...selectedEventToUpdate,
                              time: e.target.value
                            })}
                            className="w-full p-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={selectedEventToUpdate.location}
                            onChange={(e) => setSelectedEventToUpdate({
                              ...selectedEventToUpdate,
                              location: e.target.value
                            })}
                            className="w-full p-2.5 text-sm rounded-md border border-gray-300 bg-white text-gray-900"
                          />
                        </div>

                        {selectedEventToUpdate.updates && selectedEventToUpdate.updates.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Update History
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                              {selectedEventToUpdate.updates.map((update, i) => (
                                <div key={i} className="text-xs p-2 mb-1 border-b border-gray-200 last:border-0 last:mb-0">
                                  <div className="text-gray-500">{new Date(update.date).toLocaleString()}</div>
                                  <div className="text-gray-700 mt-1 font-medium">
                                    {update.field === 'title' && <span>Title changed from "{update.oldValue}" to "{update.newValue}"</span>}
                                    {update.field === 'date' && <span>Date changed from {new Date(update.oldValue).toLocaleDateString()} to {new Date(update.newValue).toLocaleDateString()}</span>}
                                    {update.field === 'time' && <span>Time changed from {update.oldValue} to {update.newValue}</span>}
                                    {update.field === 'location' && <span>Location changed from {update.oldValue} to {update.newValue}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-2 space-y-reverse sm:space-y-0">
                        <button
                          className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md w-full sm:w-auto"
                          onClick={() => setShowEventUpdateModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2.5 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 w-full sm:w-auto"
                          onClick={() => {
                            updateEvent(selectedEventToUpdate.id, selectedEventToUpdate);
                            setShowEventUpdateModal(false);
                          }}
                        >
                          Save Changes & Notify
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Calendar Integration Modal */}
                {showCalendarModal && selectedEventForCalendar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Add to Calendar
                                    </h3>
                                    <button
                                        onClick={() => setShowCalendarModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                        aria-label="Close"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    Event: {selectedEventForCalendar.title}
                                </p>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                                    <p>Choose your preferred calendar provider to add this event:</p>
                                </div>
                                
                                <button
                                    className="w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-md mb-3 flex items-center justify-center"
                                    onClick={addToGoogleCalendar}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0 12 0zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
                                    </svg>
                                    Add to Google Calendar
                                </button>
                                
                                <button
                                    className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md mb-3 flex items-center justify-center"
                                    onClick={addToOutlookCalendar}
                                >
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7.88 12L5 9.12 5 14.88M8 8L5 8 5 8 8 8 8 8zM16.12 12L19 9.12 19 14.88M16 8L19 8 19 8 16 8 16 8z"/>
                                        <rect x="8" y="8" width="8" height="8" fill="currentColor"/>
                                    </svg>
                                    Add to Outlook Calendar
                                </button>
                                
                                <button
                                    className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center"
                                    onClick={downloadAsICS}
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                    </svg>
                                    Download Calendar File (.ics)
                                </button>
                                
                                <p className="text-xs text-gray-500 mt-4 text-center">
                                    Calendar file can be imported to Apple Calendar, Outlook, and other calendar apps
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-indigo-700 text-white py-6 mt-8">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-6">
                        <div className="mb-4 sm:mb-0">
                            <div className="flex items-center space-x-2 mb-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <h3 className="text-lg font-semibold font-heading">Eventify</h3>
                            </div>
                            <p className="text-indigo-200 text-sm text-pretty">
                                Simplifying event management since 2025. Create, organize, and manage your events with ease.
                            </p>
                        </div>
                        <div className="mb-4 sm:mb-0">
                            <h3 className="text-lg font-semibold mb-3 font-heading">Quick Links</h3>
                            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                <li><a href="#" className="text-indigo-200 hover:text-white text-sm py-1 inline-block">Documentation</a></li>
                                <li><a href="#" className="text-indigo-200 hover:text-white text-sm py-1 inline-block">Privacy Policy</a></li>
                                <li><a href="#" className="text-indigo-200 hover:text-white text-sm py-1 inline-block">Terms of Service</a></li>
                                <li><a href="#" className="text-indigo-200 hover:text-white text-sm py-1 inline-block">Support</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-3 font-heading">Connect With Us</h3>
                            <div className="flex space-x-4 mb-4">
                                <a href="#" className="text-indigo-200 hover:text-white p-2 bg-indigo-800/50 rounded-full" aria-label="Twitter">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                                    </svg>
                                </a>
                                <a href="#" className="text-indigo-200 hover:text-white p-2 bg-indigo-800/50 rounded-full" aria-label="LinkedIn">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                                    </svg>
                                </a>
                                <a href="#" className="text-indigo-200 hover:text-white p-2 bg-indigo-800/50 rounded-full" aria-label="GitHub">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                                    </svg>
                                </a>
                            </div>
                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <a href="mailto:info@eventify.app" className="text-sm text-indigo-200 hover:text-white">info@eventify.app</a>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                    <a href="tel:+1234567890" className="text-sm text-indigo-200 hover:text-white">+1 (234) 567-890</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-indigo-600 text-center">
                        <p className="text-sm text-indigo-300">© {new Date().getFullYear()} Eventify. All rights reserved.</p>
                        <div className="flex justify-between items-center mt-2 text-xs text-indigo-400">
                            <span>Version 1.2.3</span>
                            <button 
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="flex items-center text-indigo-300 hover:text-white"
                                aria-label="Back to top"
                            >
                                <span>Back to top</span>
                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Export the app
export { EventManagementApp };
export default EventManagementApp;