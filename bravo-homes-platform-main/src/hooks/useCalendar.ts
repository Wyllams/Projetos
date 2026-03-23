import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent, EditingEvent, GoogleEvent } from '../types';

export function useCalendar() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ lead_id: '', date: '', time: '00:00', title: '' });
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);

  const fetchCalendarEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*');
    if (data) setCalendarEvents(data);
    return data;
  };

  const createEvent = async (eventData: any) => {
    const { error } = await supabase.from('calendar_events').insert([eventData]);
    if (!error) await fetchCalendarEvents();
    return { error };
  };

  const updateEvent = async (id: string, updates: any) => {
    const { error } = await supabase.from('calendar_events').update(updates).eq('id', id);
    if (!error) await fetchCalendarEvents();
    return { error };
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) setCalendarEvents(prev => prev.filter(e => e.id !== id));
    return { error };
  };

  const fetchGoogleEvents = async (token: string) => {
    try {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data.items || []);
      }
    } catch (err) {
      console.warn('Google Calendar sync failed:', err);
    }
  };

  return {
    calendarEvents, setCalendarEvents,
    isEventModalOpen, setIsEventModalOpen,
    eventForm, setEventForm,
    editingEvent, setEditingEvent,
    googleEvents, setGoogleEvents,
    isGoogleLinked, setIsGoogleLinked,
    fetchCalendarEvents, createEvent, updateEvent, deleteEvent, fetchGoogleEvents,
  };
}
