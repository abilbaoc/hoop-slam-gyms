import { useEffect, useState } from 'react';
import { Wrench, AlertTriangle, Clock, CheckCircle, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useGym } from '../../contexts/GymContext';
import { getMaintenanceTickets, getMaintenanceStats, getCourts, getUsers } from '../../data/api';
import { usePermissions } from '../../hooks/usePermissions';
import type { TicketStatus, MaintenanceLog } from '../../types/maintenance';
import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
import type { Court } from '../../types/court';
import type { AppUser } from '../../types/auth';
import TicketCard from './TicketCard';
import CreateTicketModal from './CreateTicketModal';
import TicketDetailModal from './TicketDetailModal';

interface MaintenanceStats {
  open: number;
  critical: number;
  avgResolutionHours: number;
  resolvedThisMonth: number;
}

export default function MaintenancePage() {
  const { currentGym } = useGym();
  const { canManageMaintenance } = usePermissions();
  const [tickets, setTickets] = useState<MaintenanceTicketWithHoop[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [courtFilter, setCourtFilter] = useState<string>('all');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicketWithHoop | null>(null);

  const gymId = currentGym?.id;

  useEffect(() => {
    if (!gymId) return;
    getMaintenanceTickets(gymId).then(({ tickets: t, logs: l }) => {
      setTickets(t);
      setLogs(l);
    });
    getMaintenanceStats(gymId).then(setStats);
    getCourts(gymId).then(setCourts);
    getUsers(gymId).then(setUsers);
  }, [gymId]);

  const courtMap = Object.fromEntries(courts.map((c) => [c.id, c.name]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

  const filtered = tickets
    .filter((t) => statusFilter === 'all' || t.status === statusFilter)
    .filter((t) => priorityFilter === 'all' || t.priority === priorityFilter)
    .filter((t) => courtFilter === 'all' || t.courtId === courtFilter)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleCreated = (ticket: MaintenanceTicketWithHoop) => {
    setTickets((prev) => [ticket, ...prev]);
  };

  const handleStatusUpdate = (ticketId: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status, updatedAt: new Date().toISOString(), resolvedAt: status === 'resolved' || status === 'closed' ? new Date().toISOString() : t.resolvedAt }
          : t
      )
    );
    const now = new Date().toISOString();
    setLogs((prev) => [...prev, { id: `mlog-${Date.now()}`, ticketId, action: 'status_changed', userId: 'user-001', comment: `Estado cambiado a ${status}`, timestamp: now }]);
    setSelectedTicket((prev) => prev && prev.id === ticketId ? { ...prev, status, updatedAt: now } : prev);
  };

  const handleComment = (ticketId: string, comment: string) => {
    const now = new Date().toISOString();
    setLogs((prev) => [...prev, { id: `mlog-${Date.now()}`, ticketId, action: 'commented', userId: 'user-001', comment, timestamp: now }]);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, updatedAt: now } : t));
  };

  const selectClass = 'bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

  const statCards = [
    { label: 'Abiertos', value: stats?.open ?? '-', icon: <Wrench size={20} />, color: 'text-yellow-400' },
    { label: 'Criticos', value: stats?.critical ?? '-', icon: <AlertTriangle size={20} />, color: 'text-red-400' },
    { label: 'Tiempo Medio Res.', value: stats ? `${stats.avgResolutionHours}h` : '-', icon: <Clock size={20} />, color: 'text-blue-400' },
    { label: 'Resueltos Mes', value: stats?.resolvedThisMonth ?? '-', icon: <CheckCircle size={20} />, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">INCIDENCIAS</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">
            Gestion de incidencias de las cestas del club
          </p>
        </div>
        {canManageMaintenance && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nueva incidencia
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className={s.color}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-[#8E8E93]">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resuelto</option>
          <option value="closed">Cerrado</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClass}>
          <option value="all">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
          <option value="critical">Critica</option>
        </select>
        <select value={courtFilter} onChange={(e) => setCourtFilter(e.target.value)} className={selectClass}>
          <option value="all">Todas las cestas</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Ticket list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            courtName={courtMap[ticket.courtId] || ticket.courtId}
            assigneeName={ticket.assignedTo ? userMap[ticket.assignedTo] || null : null}
            onClick={() => setSelectedTicket(ticket)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#636366]">
          No hay incidencias que coincidan con los filtros seleccionados
        </div>
      )}

      {/* Modals */}
      <CreateTicketModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        courts={courts}
        users={users}
        gymId={gymId || ''}
        onCreated={handleCreated}
      />

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        courtName={selectedTicket ? courtMap[selectedTicket.courtId] || selectedTicket.courtId : ''}
        logs={selectedTicket ? logs.filter((l) => l.ticketId === selectedTicket.id) : []}
        users={users}
        canManage={canManageMaintenance}
        onUpdate={handleStatusUpdate}
        onComment={handleComment}
      />
    </div>
  );
}
