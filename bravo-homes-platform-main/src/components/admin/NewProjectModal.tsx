import type { Client } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; service_type: string; contract_value: string; deadline: string; start_date: string; client_id: string };
  setForm: (form: any) => void;
  editingProjectId: string | null;
  clients: Client[];
  projectClientMode: 'existing' | 'new';
  setProjectClientMode: (mode: 'existing' | 'new') => void;
  newClientName: string;
  setNewClientName: (name: string) => void;
}

export default function NewProjectModal({
  isOpen, onClose, onSubmit, form, setForm,
  editingProjectId, clients, projectClientMode,
  setProjectClientMode, newClientName, setNewClientName
}: NewProjectModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{editingProjectId ? 'Editar Projeto' : 'Criar Novo Projeto'}</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">Nome do Projeto *</label>
                <input className="f-inp" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Reforma Cozinha Johnson" />
              </div>
              <div>
                <label className="f-label">Tipo de Serviço</label>
                <select className="f-inp" value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                  <option>Reforma</option>
                  <option>Reforma Residencial</option>
                  <option>Kitchen Remodel</option>
                  <option>Bathroom Remodel</option>
                  <option>Full Renovation</option>
                  <option>Custom Home</option>
                </select>
              </div>
              <div>
                <label className="f-label">Valor do Contrato ($)</label>
                <input className="f-inp" type="number" value={form.contract_value} onChange={e => setForm({...form, contract_value: e.target.value})} placeholder="25000" />
              </div>
              <div>
                <label className="f-label">Prazo Final</label>
                <input className="f-inp" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div>
                <label className="f-label">Data de Início</label>
                <input className="f-inp" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="f-label">Cliente</label>
                <div style={{display:'flex', gap:'6px', marginBottom:'4px'}}>
                  <button type="button" className={`btn ${projectClientMode === 'existing' ? 'gold' : 'ghost'}`} style={{fontSize:'0.7rem',padding:'4px 10px'}} onClick={() => setProjectClientMode('existing')}>Existente</button>
                  <button type="button" className={`btn ${projectClientMode === 'new' ? 'gold' : 'ghost'}`} style={{fontSize:'0.7rem',padding:'4px 10px'}} onClick={() => setProjectClientMode('new')}>Novo</button>
                </div>
                {projectClientMode === 'existing' ? (
                  <select className="f-inp" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                    <option value="">— Nenhum —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input className="f-inp" value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do novo cliente" />
                )}
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn gold">{editingProjectId ? 'Salvar Alterações' : 'Criar Projeto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
