import React, { useState } from 'react';
import { useAdminLeads, useUpdateLeadStatus } from '../../hooks/useAdminQueries';
import { Button } from '../ui/Button';

interface AdminPipelineTabProps {
  setIsNewLeadOpen: (val: boolean) => void;
  setSelectedLead: (lead: any) => void;
}

export default function AdminPipelineTab({ setIsNewLeadOpen, setSelectedLead }: AdminPipelineTabProps) {
  const { data: leads = [], isLoading } = useAdminLeads();
  const updateStatus = useUpdateLeadStatus();

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    try {
      await updateStatus.mutateAsync({ leadId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Carregando pipeline...</div>;
  }

  const activeLeadsCount = leads.length;

  return (
    <div className="page active">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--t3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
            {activeLeadsCount} leads ativos
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>Pipeline de Leads</div>
        </div>
        <Button variant="gold" onClick={() => setIsNewLeadOpen(true)}>+ Novo Lead</Button>
      </div>
      
      <div className="kanban">
        {['new', 'contacted', 'scheduling', 'proposal', 'closed'].map(statusGroup => {
          const statusTitles: Record<string, string> = {
            'new': 'Novos',
            'contacted': 'Em Contato',
            'scheduling': 'Agendamento / Visita',
            'proposal': 'Proposta',
            'closed': 'Fechados ✓'
          };
          const colLeads = leads.filter(l => l.status === statusGroup);
          
          return (
            <div 
              className="kol" 
              key={statusGroup}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusGroup)}
            >
              <div className="kol-h">
                {statusTitles[statusGroup]}
                <span className="kol-n" style={statusGroup === 'closed' ? { background: 'var(--green)', color: '#fff' } : {}}>
                  {colLeads.length}
                </span>
              </div>
              
              {colLeads.map((l: any) => (
                <div 
                  className="lead-c" 
                  draggable 
                  key={l.id}
                  onDragStart={(e) => handleDragStart(e, l.id)}
                  onClick={() => setSelectedLead(l)}
                >
                  <div className="lc-name">{l.clients?.name || l.name || 'Lead s/ Nome'}</div>
                  <div className="lc-srv">{l.service_type || 'Serviço G'} · {l.city || 'Local ND'}</div>
                  <div className="lc-foot">
                    <span className="lc-val">{l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : 'Valor tbd'}</span>
                    {l.urgency === 'hot' && <span className="urg hot" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--red)' }}>QUENTE</span>}
                    {l.urgency === 'warm' && <span className="urg warm" style={{ background: 'rgba(230,126,34,0.15)', color: 'var(--orange)' }}>MORNO</span>}
                    {l.urgency === 'cool' && <span className="urg cool" style={{ background: 'rgba(52,152,219,0.15)', color: 'var(--blue)' }}>FRIO</span>}
                  </div>
                </div>
              ))}
              
              {colLeads.length === 0 && <div className="empty-state" style={{ fontSize: '0.8rem', padding: '10px' }}>Vazio</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
