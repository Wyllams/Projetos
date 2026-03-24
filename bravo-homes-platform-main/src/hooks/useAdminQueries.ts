import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Project, Lead, LandingPage, Client, Partner, CalendarEvent } from '../types';

export const adminKeys = {
  all: ['admin'] as const,
  projects: () => [...adminKeys.all, 'projects'] as const,
  leads: () => [...adminKeys.all, 'leads'] as const,
  landingPages: () => [...adminKeys.all, 'landing_pages'] as const,
  clients: () => [...adminKeys.all, 'clients'] as const,
  partners: () => [...adminKeys.all, 'partners'] as const,
  calendarEvents: () => [...adminKeys.all, 'calendar_events'] as const,
};

export function useAdminProjects() {
  return useQuery({
    queryKey: adminKeys.projects(),
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*');
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useAdminLeads() {
  return useQuery({
    queryKey: adminKeys.leads(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useAdminLandingPages() {
  return useQuery({
    queryKey: adminKeys.landingPages(),
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_pages').select('*');
      if (error) throw error;
      return data as LandingPage[];
    },
  });
}

export function useAdminClients() {
  return useQuery({
    queryKey: adminKeys.clients(),
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (error) throw error;
      return data as Client[];
    },
  });
}

export function useAdminPartners() {
  return useQuery({
    queryKey: adminKeys.partners(),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'parceiro');
      if (error) throw error;
      return data as Partner[];
    },
  });
}

export function useAdminCalendarEvents() {
  return useQuery({
    queryKey: adminKeys.calendarEvents(),
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_events').select('*');
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

// Mutations

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.projects() });
    },
  });
}

export function useDeleteLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lpId: string) => {
      const { error } = await supabase.from('landing_pages').delete().eq('id', lpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.landingPages() });
    },
  });
}
