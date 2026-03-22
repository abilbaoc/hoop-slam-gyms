import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import type { MaintenanceTicket } from '../../types/maintenance';
import { PRIORITY_LABELS, STATUS_LABELS, PRIORITY_VARIANTS, STATUS_VARIANTS } from '../../types/maintenance';
import { formatRelative } from '../../utils/formatters';
import { User } from 'lucide-react';

interface TicketCardProps {
  ticket: MaintenanceTicket;
  courtName: string;
  assigneeName: string | null;
  onClick: () => void;
}

export default function TicketCard({ ticket, courtName, assigneeName, onClick }: TicketCardProps) {
  return (
    <Card hover onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={PRIORITY_VARIANTS[ticket.priority]} size="sm">
              {PRIORITY_LABELS[ticket.priority]}
            </Badge>
            <Badge variant={STATUS_VARIANTS[ticket.status]} size="sm">
              {STATUS_LABELS[ticket.status]}
            </Badge>
          </div>
          <h3 className="text-white font-medium text-sm truncate mt-2">{ticket.title}</h3>
          <p className="text-[#8E8E93] text-xs mt-1">{courtName}</p>
        </div>
        <span className="text-[#636366] text-xs whitespace-nowrap">
          {formatRelative(ticket.updatedAt)}
        </span>
      </div>
      {assigneeName && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-[#8E8E93]">
          <User size={12} />
          <span>{assigneeName}</span>
        </div>
      )}
    </Card>
  );
}
