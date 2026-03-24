import { Button } from '../ui/Button';

interface ConfirmModalProps {
  show: boolean;
  msg: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ show, msg, onConfirm, onCancel }: ConfirmModalProps) {
  if (!show) return null;
  return (
    <div className="modal-overlay open" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '420px', textAlign: 'center'}}>
        <div className="modal-head" style={{justifyContent: 'center', borderBottom: 'none', paddingBottom: '0'}}>
          <div className="modal-title u-text-gold">Confirmar Ação</div>
        </div>
        <div className="modal-body" style={{fontSize: '1rem', lineHeight: '1.5', padding: '10px 22px 30px', color: 'var(--text)'}}>
          {msg}
        </div>
        <div className="modal-foot" style={{justifyContent: 'center', borderTop: 'none', paddingTop: '0', paddingBottom: '24px', gap: '12px'}}>
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="gold" onClick={() => { onConfirm(); onCancel(); }}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}
