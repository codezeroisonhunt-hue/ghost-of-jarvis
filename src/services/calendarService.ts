
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  location?: string;
  reminder_time?: string;
  created_at: string;
}

const EVENTS_STORAGE_KEY = 'jarvis_calendar_events';

const getStoredEvents = (): CalendarEvent[] => {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveEvents = (events: CalendarEvent[]) => {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
};

export const calendarService = {
  async createEvent(event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at'>): Promise<CalendarEvent | null> {
    try {
      const newEvent: CalendarEvent = {
        ...event,
        id: Date.now().toString(),
        user_id: 'local',
        created_at: new Date().toISOString()
      };
      
      const events = getStoredEvents();
      events.push(newEvent);
      saveEvents(events);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  },

  async getEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    try {
      let events = getStoredEvents();
      
      if (startDate) {
        events = events.filter(e => e.start_time >= startDate);
      }
      if (endDate) {
        events = events.filter(e => e.start_time <= endDate);
      }
      
      return events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    try {
      const events = getStoredEvents();
      const index = events.findIndex(e => e.id === id);
      
      if (index === -1) return null;
      
      events[index] = { ...events[index], ...updates };
      saveEvents(events);
      return events[index];
    } catch (error) {
      console.error('Error updating event:', error);
      return null;
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const events = getStoredEvents();
      const filtered = events.filter(e => e.id !== id);
      saveEvents(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  },

  async getUpcomingEvents(limit: number = 10): Promise<CalendarEvent[]> {
    try {
      const now = new Date().toISOString();
      const events = getStoredEvents()
        .filter(e => e.start_time >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, limit);
      
      return events;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  }
};
