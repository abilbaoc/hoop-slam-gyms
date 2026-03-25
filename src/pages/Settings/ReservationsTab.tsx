import { useState, useEffect, useMemo } from 'react';
import { Calendar, List, Ban } from 'lucide-react';
import type { Reservation, ReservationStatus, Court } from '../../types';
import { getReservations, getCourts } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import Card from '../../components/ui/Card';
import ReservationCalendar from './ReservationCalendar';
import ReservationTable from './ReservationTable';
import BlockSlotModal from './BlockSlotModal';
import ConfirmDialog from './ConfirmDialog';

type ViewMode = 'calendar' | 'table';

export default function ReservationsTab() {
  const { currentGym } = useGym();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Filters
  const today = new Date().toISOString().slice(0, 10);
  const [filterCourtId, setFilterCourtId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | ''>('');

  useEffect(() => {
    getReservations({ gymId: currentGym?.id }).then(setReservations);
    getCourts(currentGym?.id).then(setCourts);
  }, [currentGym?.id]);

  const myCourtIds = useMemo(() => new Set(courts.map(c => c.id)), [courts]);

  const filtered = useMemo(() => {
    // Only show reservations for this club's courts
    let result = reservations.filter((r) => myCourtIds.has(r.courtId));
    if (filterCourtId) result = result.filter((r) => r.courtId === filterCourtId);
    if (filterDate) result = result.filter((r) => r.date === filterDate);
    if (filterStatus) result = result.filter((r) => r.status === filterStatus);
    return result;
  }, [reservations, filterCourtId, filterDate, filterStatus, myCourtIds]);

  // Stats
  const confirmedCount = filtered.filter((r) => r.status === 'confirmed').length;
  const cancelledCount = filtered.filter((r) => r.status === 'cancelled').length;

  const handleBlockSave = (data: Omit<Reservation, 'id' | 'createdAt'>) => {
    const newRes: Reservation = {
      ...data,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setReservations((prev) => [...prev, newRes]);
    setShowBlockModal(false);
  };

  const handleCancel = () => {
    if (!confirmCancelId) return;
    setReservations((prev) =>
      prev.map((r) => (r.id === confirmCancelId ? { ...r, status: 'cancelled' } : r))
    );
    setConfirmCancelId(null);
  };

  const inputClass =
    'bg-[#2C2C2E] text-white rounded-xl border border-[#2C2C2E] px-3 py-2 text-sm focus:outline-none focus:border-[#7BFF00] transition-colors';

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <p className="text-xs text-[#636366]">Completadas</p>
          <p className="text-xl font-bold text-[#7BFF00]">{confirmedCount}</p>
        </Card>
        <Card className="flex-1">
          <p className="text-xs text-[#636366]">Canceladas</p>
          <p className="text-xl font-bold text-[#FF453A]">{cancelledCount}</p>
        </Card>
        <Card className="flex-1">
          <p className="text-xs text-[#636366]">Total filtradas</p>
          <p className="text-xl font-bold text-white">{filtered.length}</p>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filterCourtId}
          onChange={(e) => setFilterCourtId(e.target.value)}
          className={inputClass}
        >
          <option value="">Todas las canchas</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className={inputClass}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | '')}
          className={inputClass}
        >
          <option value="">Todas</option>
          <option value="confirmed">Confirmada</option>
          <option value="cancelled">Cancelada</option>
          <option value="blocked">Bloqueada</option>
        </select>

        {/* View toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#7BFF00] text-black'
                : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
            }`}
          >
            <Calendar size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'table'
                ? 'bg-[#7BFF00] text-black'
                : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
            }`}
          >
            <List size={16} />
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setShowBlockModal(true)}
          className="flex items-center gap-1.5 bg-[#2C2C2E] text-white px-3 py-2 rounded-xl text-sm hover:bg-[#3C3C3E] transition-colors"
        >
          <Ban size={16} />
          Bloquear franja
        </button>
      </div>

      {/* Main content */}
      {viewMode === 'calendar' ? (
        <ReservationCalendar
          reservations={filtered}
          courts={courts}
          selectedDate={filterDate || today}
          onDateChange={setFilterDate}
        />
      ) : (
        <ReservationTable
          reservations={filtered}
          courts={courts}
          onCancel={(id) => setConfirmCancelId(id)}
        />
      )}

      {/* Block Slot Modal */}
      <BlockSlotModal
        open={showBlockModal}
        courts={courts}
        onSave={handleBlockSave}
        onClose={() => setShowBlockModal(false)}
      />

      {/* Confirm Cancel */}
      <ConfirmDialog
        open={!!confirmCancelId}
        title="Cancelar reserva"
        message="Se cancelara la reserva y se enviara una notificacion automatica al jugador."
        confirmLabel="Cancelar reserva"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancelId(null)}
      />
    </div>
  );
}
