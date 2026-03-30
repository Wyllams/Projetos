import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useLanguage } from '../../lib/i18n';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; city: string; phone: string; specialty: string; email: string; password: string };
  setForm: (form: any) => void;
}

export default function PartnerModal({ isOpen, onClose, onSubmit, form, setForm }: PartnerModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{t('newPartnerModalTitle')}</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">{t('fullName')} *</label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Marcus Johnson" />
              </div>
              <div>
                <label className="f-label">{t('email')} *</label>
                <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="parceiro@email.com" />
              </div>
              <div>
                <label className="f-label">{t('passwordLabel')}</label>
                <Input type="password" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={t('passwordPlaceholder')} />
              </div>
              <div>
                <label className="f-label">{t('cityLabel')}</label>
                <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Orlando, FL" />
              </div>
              <div>
                <label className="f-label">{t('phone')}</label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(xxx) xxx-xxxx" />
              </div>
              <div>
                <label className="f-label">{t('specialtyLabel')}</label>
                <Input value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})} placeholder="Kitchen, Bathroom..." />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="gold">{t('createPartnerBtn')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
