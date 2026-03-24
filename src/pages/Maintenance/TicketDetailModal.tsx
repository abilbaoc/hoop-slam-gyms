import { Modal } from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
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

export default function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  courtName,
  logs,
}: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title={ticket.title}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={PRIORITY_VARIANTS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
          <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
          <span className="text-sm text-[#8E8E93]">{courtName}</span>
        </div>

        <p className="text-sm text-white">{ticket.description}</p>

        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-[#636366] uppercase">Historial</h4>
            {logs.map((log) => (
              <div key={log.id} className="text-sm text-[#8E8E93] border-l-2 border-[#2C2C2E] pl-3">
                <span className="text-[#636366] text-xs mr-2">
                  {new Date(log.timestamp).toLocaleDateString('es')}
                </span>
                {log.comment ?? log.action}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
