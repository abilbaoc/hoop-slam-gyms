import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import type { MaintenanceTicket, MaintenanceLog, TicketStatus } from '../../types/maintenance';
import { PRIORITY_LABELS, STATUS_LABELS, PRIORITY_VARIANTS, STATUS_VARIANTS } from '../../types/maintenance';
import type { AppUser } from '../../types/auth';
import { formatRelative, formatDateTime } from '../../utils/formatters';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: MaintenanceTicket | null;
  isOpen: boolean;
  onClose: () => void;
  courtName: string;
  logs: MaintenanceLog[];
  users: AppUser[];
  canManage: boolean;
  onUpdate: (ticketId: string, status: TicketStatus) => void;
  onComment: (ticketId: string, comment: string) => void;
}

const ACTION_LABELS: Record<string, string> = {
  created: 'Ticket creado',
  status_changed: 'Cambio de estado',
  commented: 'Comentario',
  assigned: 'Asignacion',
};

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
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');

  if (!ticket) return null;

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const handleStatusChange = () => {
    if (!newStatus || newStatus === ticket.status) return;
    onUpdate(ticket.id, newStatus);
    setNewStatus('');
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    onComment(ticket.id, comment.trim());
    setComment('');
  };

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={ticket.title}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PRIORITY_VARIANTS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
          <span className="text-xs text-[#636366]">{courtName}</span>
        </div>

        <p className="text-sm text-[#8E8E93]">{ticket.description}</p>

        <div className="grid grid-cols-2 gap-4 text-xs text-[#8E8E93]">
          <div>
            <span className="text-[#636366]">Creado:</span>{' '}
            {formatDateTime(ticket.createdAt)}
          </div>
          <div>
            <span className="text-[#636366]">Actualizado:</span>{' '}
            {formatRelative(ticket.updatedAt)}
          </div>
          <div>
            <span className="text-[#636366]">Asignado a:</span>{' '}
            {ticket.assignedTo ? userMap[ticket.assignedTo] || ticket.assignedTo : 'Sin asignar'}
          </div>
          {ticket.resolvedAt && (
            <div>
              <span className="text-[#636366]">Resuelto:</span>{' '}
              {formatDateTime(ticket.resolvedAt)}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Historial</h3>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pl-3 border-l-2 border-[#2C2C2E]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white">{ACTION_LABELS[log.action] || log.action}</span>
                    <span className="text-xs text-[#636366]">{userMap[log.userId] || log.userId}</span>
                  </div>
                  {log.comment && (
                    <p className="text-xs text-[#8E8E93] mt-0.5">{log.comment}</p>
                  )}
                  <span className="text-[10px] text-[#636366]">{formatRelative(log.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions - only for users with permission */}
        {canManage && ticket.status !== 'closed' && (
          <div className="space-y-3 pt-3 border-t border-[#2C2C2E]">
            {/* Status change */}
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                className={`${inputClass} flex-1`}
              >
                <option value="">Cambiar estado...</option>
                <option value="open">Abierto</option>
                <option value="in_progress">En progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
              <Button size="sm" onClick={handleStatusChange} disabled={!newStatus || newStatus === ticket.status}>
                <ArrowRight size={14} />
              </Button>
            </div>

            {/* Comment */}
            <div className="flex items-start gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`${inputClass} flex-1 min-h-[60px] resize-none`}
                placeholder="Agregar comentario..."
              />
              <Button size="sm" onClick={handleComment} disabled={!comment.trim()}>
                <MessageSquare size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
