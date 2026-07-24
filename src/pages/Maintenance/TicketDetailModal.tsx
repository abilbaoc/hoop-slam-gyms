import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
import { HOOP_STATUS_LABELS, HOOP_STATUS_VARIANTS } from '../../types/maintenance-hoop';
import type { MaintenanceLog } from '../../types/maintenance';
import type { AppUser } from '../../types/auth';
import { PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_VARIANTS, type TicketStatus } from '../../types/maintenance';

interface TicketDetailModalProps {
  ticket: MaintenanceTicketWithHoop | null;
  isOpen: boolean;
  onClose: () => void;
  courtName: string;
  logs: MaintenanceLog[];
  users: AppUser[];
  canManage: boolean;
  onUpdate: (id: string, status: TicketStatus) => void;
  onComment: (id: string, comment: string) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  courtName,
  logs,
  users,
  canManage,
  onUpdate,
  onComment,
}: TicketDetailModalProps) {
  const [comment, setComment] = useState('');

  if (!ticket) return null;

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const handleSendComment = () => {
    const text = comment.trim();
    if (!text) return;
    onComment(ticket.id, text);
    setComment('');
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={ticket.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={PRIORITY_VARIANTS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
          {ticket.hoopStatus && (
            <Badge variant={HOOP_STATUS_VARIANTS[ticket.hoopStatus]}>{HOOP_STATUS_LABELS[ticket.hoopStatus]}</Badge>
          )}
          <span className="text-sm text-[#8E8E93]">{courtName}</span>
        </div>

        {ticket.description && <p className="text-sm text-white">{ticket.description}</p>}

        {ticket.hoopNotes && (
          <div className="bg-[#0A84FF]/10 border-l-2 border-[#0A84FF] rounded-r-xl px-3 py-2">
            <p className="text-xs text-[#0A84FF] font-medium mb-0.5">Respuesta del equipo Hoop</p>
            <p className="text-sm text-white">{ticket.hoopNotes}</p>
          </div>
        )}

        {/* Cambiar estado (solo con permiso de mantenimiento) */}
        {canManage && (
          <div>
            <label className="block text-xs font-medium text-[#636366] uppercase mb-1.5">Estado</label>
            <select
              value={ticket.status}
              onChange={(e) => onUpdate(ticket.id, e.target.value as TicketStatus)}
              className="w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Historial */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#636366] uppercase">Historial</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {logs.map((log) => (
                <div key={log.id} className="text-sm text-[#8E8E93] border-l-2 border-[#2C2C2E] pl-3">
                  <span className="text-[#636366] text-xs mr-2">
                    {new Date(log.timestamp).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })}
                    {userMap[log.userId] ? ` · ${userMap[log.userId]}` : ''}
                  </span>
                  {log.comment ?? log.action}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comentar */}
        {canManage && (
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]"
            />
            <Button onClick={handleSendComment} disabled={!comment.trim()}>
              <Send size={14} />
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
