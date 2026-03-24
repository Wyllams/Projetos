import React from 'react';
import { usePartnerProjects } from '../../hooks/usePartnerQueries';

interface PartnerProjectsTabProps {
  handleCreateProject: () => void;
  setSelectedProject: (proj: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function PartnerProjectsTab({
  handleCreateProject, setSelectedProject, setActiveTab
}: PartnerProjectsTabProps) {
  const { data: projects = [], isLoading } = usePartnerProjects();

  return (
    <div className="page active">
      <div className="u-section-header">
        <div><div className="u-mono-label-xs">{projects.length} projetos em andamento</div><div className="u-syne-title u-mt-3">Meus Projetos Ativos</div></div>
        <button className="btn gold" onClick={handleCreateProject}>Novo Projeto</button>
      </div>
      
      {projects.length === 0 && !isLoading && (
        <div className="empty-state" style={{padding: '20px', textAlign: 'center'}}>Nenhum projeto encontrado.</div>
      )}
      
      {projects.map((p: any) => (
        <div className="proj-card" key={p.id} onClick={() => { setSelectedProject(p); setActiveTab('stages'); }}>
          <div className="proj-header">
            <div><div className="proj-name">{p.name || 'Projeto sem nome'}</div><div className="proj-service">{p.service_type || 'Serviço'}</div></div>
            <span className={`status-badge ${p.status === 'active' ? 'active' : 'pending'}`}>{p.status || 'Ativo'}</span>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div>
          <div className="prog-info"><span>Progresso</span><span style={{color:'var(--gold)'}}>{p.progress || 0}%</span></div>
          <div className="proj-meta"><span>📅 Início: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/D'}</span><span>🏁 Entrega: {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/D'}</span><span style={{color:'var(--green)'}}>💰 ${p.contract_value ? Number(p.contract_value).toLocaleString() : '0'}</span></div>
        </div>
      ))}
    </div>
  );
}
