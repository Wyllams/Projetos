interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; city: string; phone: string; specialty: string; email: string; password: string };
  setForm: (form: any) => void;
}

export default function PartnerModal({ isOpen, onClose, onSubmit, form, setForm }: PartnerModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Novo Parceiro / Contratado</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">Nome Completo *</label>
                <input className="f-inp" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Marcus Johnson" />
              </div>
              <div>
                <label className="f-label">Email *</label>
                <input className="f-inp" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="parceiro@email.com" />
              </div>
              <div>
                <label className="f-label">Senha de Acesso *</label>
                <input className="f-inp" type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 6 caracteres" />
              </div>
              <div>
                <label className="f-label">Cidade</label>
                <input className="f-inp" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Orlando, FL" />
              </div>
              <div>
                <label className="f-label">Telefone</label>
                <input className="f-inp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(xxx) xxx-xxxx" />
              </div>
              <div>
                <label className="f-label">Especialidade</label>
                <input className="f-inp" value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} placeholder="Kitchen, Bathroom..." />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn gold">Criar Parceiro</button>
          </div>
        </form>
      </div>
    </div>
  );
}
