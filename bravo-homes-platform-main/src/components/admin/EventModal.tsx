import type { Lead } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  eventForm: { lead_id: string; date: string; time: string; title: string };
  setEventForm: (form: any) => void;
  leads: Lead[];
  selectedLead: Lead | null;
}

export default function EventModal({ isOpen, onClose, onSubmit, eventForm, setEventForm, leads, selectedLead }: EventModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{eventForm.lead_id && selectedLead ? `Agendar Vistoria: ${selectedLead.clients?.name || selectedLead.name}` : 'Criar Novo Agendamento'}</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">Lead Associado (Opcional)</label>
                <select className="f-inp" value={eventForm.lead_id} onChange={e => setEventForm({...eventForm, lead_id: e.target.value})}>
                  <option value="">— Nenhum Lead —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.clients?.name || l.name} — {l.service_type}</option>)}
                </select>
              </div>
              <div>
                <label className="f-label">Título do Evento</label>
                <input className="f-inp" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="Ex: Vistoria Inicial" />
              </div>
              <div>
                <label className="f-label">Data</label>
                <input className="f-inp" type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
              </div>
              <div>
                <label className="f-label">Horário</label>
                <input className="f-inp" type="time" required value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn gold">Criar Agendamento</button>
          </div>
        </form>
      </div>
    </div>
  );
}
