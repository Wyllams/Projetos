import React from 'react';
import { useAdminLandingPages, useDeleteLandingPage } from '../../hooks/useAdminQueries';
import { useToast } from './Toast';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface AdminLandingPagesTabProps {
  setIsLPOpen: (val: boolean) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
}

export default function AdminLandingPagesTab({ setIsLPOpen, showConfirm }: AdminLandingPagesTabProps) {
  const { data: landingPages = [], isLoading } = useAdminLandingPages();
  const deleteLPMutation = useDeleteLandingPage();
  const { showToast } = useToast();

  const toggleLPStatus = (lp: any) => {
    // Left as a placeholder, the original file had this logic inline but incomplete
    showToast('Ação atualizar status será vinculada ao React Query');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Carregando Landing Pages...</div>;
  }

  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">Landing Pages</div>
        <Button variant="gold" onClick={() => setIsLPOpen(true)}>+ Nova LP</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Página (Cidade)</th>
                <th style={{ width: '12%' }}>Status</th>
                <th style={{ width: '14%' }}>Visitantes</th>
                <th style={{ width: '14%' }}>Leads Gerados</th>
                <th style={{ width: '14%' }}>Conversão</th>
                <th style={{ width: '28%', textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {landingPages.length === 0 && (
                <tr><td colSpan={6} className="u-empty-state">Nenhuma LP encontrada.</td></tr>
              )}
              {landingPages.map(lp => {
                const convRate = (lp.visitors ?? 0) > 0 ? Math.round(((lp.leads_count ?? 0) / (lp.visitors ?? 1)) * 100) : 0;
                return (
                  <tr key={lp.id}>
                    <td>
                      <b>{lp.name}</b>
                      <div style={{ fontSize: '0.7rem', color: 'var(--t2)' }}>{lp.city}</div>
                    </td>
                    <td>
                      <span 
                        className={`status-b ${lp.status === 'live' ? 'sb-live' : 'sb-draft'}`} 
                        style={{ cursor: 'pointer' }} 
                        title="Clique para alternar o status" 
                        onClick={() => toggleLPStatus(lp)}
                      >
                        {(lp.status || 'draft').toUpperCase()}
                      </span>
                    </td>
                    <td>{lp.visitors || 0}</td>
                    <td>{lp.leads_count || 0}</td>
                    <td><div style={{ fontFamily: "'DM Mono',monospace", color: 'var(--green)' }}>{convRate}%</div></td>
                    <td>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                        <Button 
                          variant="ghost" 
                          className="px-3.5 py-1.5 text-[.75rem]" 
                          onClick={() => {
                            navigator.clipboard.writeText(`https://bravohomes.com/lp/${(lp.city || '').toLowerCase().replace(/\s+/g, '-')}`);
                            showToast('Link da LP copiado para a área de transferência!');
                          }}
                        >
                          Link
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="px-3.5 py-1.5 text-[.75rem]" 
                          onClick={() => showToast('Construtor visual de LP em breve!')}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="px-3.5 py-1.5 text-[0.95rem] text-danger border-transparent" 
                          onClick={() => {
                            showConfirm(`Deseja excluir a LP "${lp.name}"?`, async () => {
                              try {
                                await deleteLPMutation.mutateAsync(lp.id);
                                showToast('Landing Page excluída com sucesso!');
                              } catch (err: any) {
                                showToast('Erro: ' + err.message);
                              }
                            });
                          }}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
