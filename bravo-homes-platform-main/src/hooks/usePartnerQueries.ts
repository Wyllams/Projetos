import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project, Lead, Stage, CalendarEvent, Message, Client, DailyLog } from '../types';

export function usePartnerProjects() {
  return useQuery({
    queryKey: ['partner-projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return (data || []) as Project[];
    }
  });
}

export function usePartnerLeads() {
  return useQuery({
    queryKey: ['partner-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*');
      if (error) throw error;
      return (data || []) as Lead[];
    }
  });
}

export function usePartnerStages() {
  return useQuery({
    queryKey: ['partner-stages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stages').select('*');
      if (error) throw error;
      return (data || []) as Stage[];
    }
  });
}

export function usePartnerEvents() {
  return useQuery({
    queryKey: ['partner-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_events').select('*');
      if (error) throw error;
      return (data || []) as CalendarEvent[];
    }
  });
}

export function usePartnerMessages(userId?: string) {
  return useQuery({
    queryKey: ['partner-messages', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!userId
  });
}

export function useAdminUser() {
  return useQuery({
    queryKey: ['admin-user'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'admin');
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    }
  });
}

export function usePartnerClients() {
  return useQuery({
    queryKey: ['partner-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      return (data || []) as Client[];
    }
  });
}

export function usePartnerLogs() {
  return useQuery({
    queryKey: ['partner-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_logs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DailyLog[];
    }
  });
}
