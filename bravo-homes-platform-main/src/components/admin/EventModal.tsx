import type { Lead } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useLanguage } from '../../lib/i18n';

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
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{eventForm.lead_id && selectedLead ? `${t('scheduleInspectionPrefix')}${selectedLead.clients?.name || selectedLead.name}` : t('createNewSchedule')}</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">{t('associatedLeadOpt')}</label>
                <Select value={eventForm.lead_id} onChange={e => setEventForm({...eventForm, lead_id: e.target.value})}>
                  <option value="">{t('selectOpt')}</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.clients?.name || l.name} — {l.service_type}</option>)}
                </Select>
              </div>
              <div>
                <label className="f-label">{t('eventTitleLabel')}</label>
                <Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder={t('eventTitlePlaceholder')} />
              </div>
              <div>
                <label className="f-label">{t('dateLabel')}</label>
                <Input type="date" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
              </div>
              <div>
                <label className="f-label">{t('timeLabel')}</label>
                <Input type="time" required value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancelBtn')}</Button>
            <Button type="submit" variant="gold">{t('createScheduleBtn')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
