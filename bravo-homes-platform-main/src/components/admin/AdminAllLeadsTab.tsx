import React from 'react';
import { useAdminLeads, useDeleteLead } from '../../hooks/useAdminQueries';
import { useToast } from './Toast';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface AdminAllLeadsTabProps {
  setIsNewLeadOpen: (val: boolean) => void;
  setSelectedLead: (lead: any) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
}

export default function AdminAllLeadsTab({ setIsNewLeadOpen, setSelectedLead, showConfirm }: AdminAllLeadsTabProps) {
  const { data: leads = [], isLoading } = useAdminLeads();
  const deleteLeadMutation = useDeleteLead();
  const { showToast } = useToast();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Carregando leads...</div>;
  }

  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">Todos os Leads</div>
        <Button variant="gold" onClick={() => setIsNewLeadOpen(true)}>+ Novo Lead</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Lead / Cliente</th>
                <th>Serviço / Cidade</th>
                <th>Valor</th>
                <th>Temperatura</th>
                <th>Status</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="u-cursor-pointer" onClick={() => setSelectedLead(l)}>
                  <td><b>{l.clients?.name || l.name || 'Lead s/ Nome'}</b></td>
                  <td>{l.service_type} • {l.city}</td>
                  <td className="u-text-gold">${l.estimated_value ? Number(l.estimated_value).toLocaleString() : 'N/D'}</td>
                  <td>
                    {l.urgency === 'hot' && <span className="urg hot">QUENTE</span>}
                    {l.urgency === 'warm' && <span className="urg warm">MORNO</span>}
                    {l.urgency === 'cool' && <span className="urg cool">FRIO</span>}
                  </td>
                  <td><span className="status-b sb-draft">{l.status}</span></td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
                      {new Date(l.created_at || '').toLocaleDateString('pt-BR')}
                      <br />
                      <span style={{ color: 'var(--t2)' }}>
                        {new Date(l.created_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      className="px-2 py-1 text-[.85rem] text-danger border-transparent" 
                      onClick={() => {
                        showConfirm(`Deseja excluir o lead "${l.clients?.name || l.name}"?`, async () => {
                          try {
                            await deleteLeadMutation.mutateAsync(l.id);
                            showToast('Lead excluído com sucesso!');
                          } catch (err: any) {
                            showToast('Erro: ' + err.message);
                          }
                        });
                      }}
                    >
                      🗑️
                    </Button>
                  </td>
                </tr>
              ))}
              
              {leads.length === 0 && (
                <tr><td colSpan={7} className="text-center p-4 text-gray-400">Nenhum lead encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
