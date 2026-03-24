import React from 'react';
import { useAdminProjects, useDeleteProject } from '../../hooks/useAdminQueries';
import { useToast } from './Toast';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface AdminProjectsTabProps {
  handleCreateProject: () => void;
  setNewProjectForm: (form: any) => void;
  setEditingProjectId: (id: string | null) => void;
  setIsNewProjectOpen: (val: boolean) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
}

export default function AdminProjectsTab({ 
  handleCreateProject, 
  setNewProjectForm, 
  setEditingProjectId, 
  setIsNewProjectOpen,
  showConfirm 
}: AdminProjectsTabProps) {
  const { data: projects = [], isLoading } = useAdminProjects();
  const deleteProjectMutation = useDeleteProject();
  const { showToast } = useToast();

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Carregando projetos...</div>;
  }

  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">Projetos Ativos — Visão Admin</div>
        <Button variant="gold" onClick={handleCreateProject}>Novo Projeto</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Valor</th>
                <th>Progresso</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && (
                <tr><td colSpan={6} className="u-empty-state">Nenhum projeto em andamento.</td></tr>
              )}
              {projects.map((p: any) => (
                <tr key={p.id}>
                  <td><b>{p.name || 'Projeto'}</b></td>
                  <td>{p.service_type || 'Serviço'}</td>
                  <td className="u-text-gold">${p.contract_value ? Number(p.contract_value).toLocaleString() : '0'}</td>
                  <td>
                    <div className="prog-bar" style={{ width: '80px' }}>
                      <div className="prog-fill" style={{ width: `${p.progress || 0}%` }}></div>
                    </div>
                    <div style={{ fontSize: '.65rem', color: 'var(--t2)', marginTop: '3px' }}>
                      {p.progress || 0}%
                    </div>
                  </td>
                  <td><span className={`status-b ${p.status === 'active' ? 'sb-active' : ''}`}>{p.status || 'ND'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                      <Button 
                        variant="ghost" 
                        className="rounded-full px-3 py-1 text-[0.75rem]" 
                        onClick={() => {
                          setNewProjectForm({ 
                            name: p.name || '', 
                            service_type: p.service_type || '', 
                            contract_value: String(p.contract_value || ''), 
                            deadline: p.deadline || '', 
                            start_date: (p as any).start_date || '', 
                            client_id: (p as any).client_id || '' 
                          });
                          setEditingProjectId(p.id);
                          setIsNewProjectOpen(true);
                        }}
                      >
                        ✏️ Editar
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="px-2 py-1 text-[.7rem] text-danger border-transparent" 
                        onClick={() => {
                          showConfirm(`Deseja excluir o projeto "${p.name}"?`, async () => {
                            try {
                              await deleteProjectMutation.mutateAsync(p.id);
                              showToast('Projeto excluído com sucesso!');
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
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
