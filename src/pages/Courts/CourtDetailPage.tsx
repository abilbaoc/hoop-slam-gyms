import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Dribbble, AlertCircle, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import CourtStatusBadge from '../../components/shared/CourtStatusBadge';
import Badge from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { getCourts, updateCourt, getCourtSlots, createCourtSlot, updateCourtSlot, getMaintenanceTickets } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { Court, CourtSlot } from '../../types';
import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
import { PRIORITY_LABELS, PRIORITY_VARIANTS, STATUS_LABELS, STATUS_VARIANTS } from '../../types/maintenance';
import { toast } from 'sonner';

// ── Tab: Configuración ──────────────────────────────────────

const TIME_OPTIONS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120];

function ConfigTab({ court, onSaved }: { court: Court; onSaved: (c: Court) => void }) {
  const [name, setName] = useState(court.name);
  const [address, setAddress] = useState(court.address);
  const [openingTime, setOpeningTime] = useState(court.opening_time);
  const [closingTime, setClosingTime] = useState(court.closing_time);
  const [matchDuration, setMatchDuration] = useState(court.match_duration_minutes);
  const [slotDuration, setSlotDuration] = useState(court.slot_duration_minutes);
  const [saving, setSaving] = useState(false);

  const handleToggleActive = async () => {
    const updated = await updateCourt(court.id, { is_active: !court.is_active });
    onSaved(updated);
    toast.success(updated.is_active ? 'Canasta activada' : 'Canasta desactivada');
  };

  const handleToggleVisible = async () => {
    const updated = await updateCourt(court.id, { is_visible: !court.is_visible });
    onSaved(updated);
    toast.success(updated.is_visible ? 'Visible en la app' : 'Ocultada de la app');
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    if (!address.trim()) return toast.error('La dirección es obligatoria');
    if (openingTime >= closingTime) return toast.error('La apertura debe ser anterior al cierre');
    if (matchDuration > slotDuration) return toast.error('La duración del partido no puede superar la del slot');
    setSaving(true);
    try {
      const updated = await updateCourt(court.id, { name, address, opening_time: openingTime, closing_time: closingTime, match_duration_minutes: matchDuration, slot_duration_minutes: slotDuration });
      onSaved(updated);
      toast.success('Cambios guardados');
    } finally {
      setSaving(false);
    }
  };

  const selectClass = 'bg-[#2C2C2E] text-white text-sm rounded-xl px-3 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';
  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Estado y visibilidad */}
      <Card>
        <h3 className="text-xs font-medium text-[#636366] uppercase mb-4">Estado y visibilidad</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Canasta activa</span>
            <button
              onClick={handleToggleActive}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0 ${court.is_active ? 'bg-[#7BFF00]' : 'bg-[#3C3C3E]'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${court.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Visible en la app</span>
            <button
              onClick={handleToggleVisible}
              className={`w-12 h-7 rounded-full transition-colors duration-200 relative flex-shrink-0 ${court.is_visible ? 'bg-[#7BFF00]' : 'bg-[#3C3C3E]'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${court.is_visible ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Información básica */}
      <Card>
        <h3 className="text-xs font-medium text-[#636366] uppercase mb-4">Información básica</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Nombre *</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="Canasta Norte" />
          </div>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Dirección *</label>
            <input className={inputClass} value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle, número, ciudad" />
          </div>
        </div>
      </Card>

      {/* Horario */}
      <Card>
        <h3 className="text-xs font-medium text-[#636366] uppercase mb-4">Horario de apertura</h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Apertura</label>
            <select className={selectClass} value={openingTime} onChange={e => setOpeningTime(e.target.value)}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <span className="text-[#636366] mt-5">—</span>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Cierre</label>
            <select className={selectClass} value={closingTime} onChange={e => setClosingTime(e.target.value)}>
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#636366] mt-2">El horario define la ventana disponible para crear slots.</p>
      </Card>

      {/* Duración */}
      <Card>
        <h3 className="text-xs font-medium text-[#636366] uppercase mb-4">Configuración de partidos</h3>
        <div className="flex items-start gap-6">
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Duración partido</label>
            <select className={selectClass} value={matchDuration} onChange={e => setMatchDuration(Number(e.target.value))}>
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#8E8E93] mb-1 block">Duración slot</label>
            <select className={selectClass} value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))}>
              {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#636366] mt-2">La duración del partido debe ser ≤ duración del slot.</p>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => { setName(court.name); setAddress(court.address); }}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
      </div>
    </div>
  );
}

// ── Tab: Slots ──────────────────────────────────────────────
// Lógica: El gimnasio BLOQUEA franjas horarias donde los usuarios NO pueden reservar.
// Las franjas sin bloqueo quedan libres para reservas individuales desde la app.
// "Crear slot" = bloquear una franja para uso exclusivo del gimnasio.

const STATUS_COLORS: Record<CourtSlot['status'], string> = {
  available: 'bg-[#7BFF00]/20 text-[#7BFF00] border-[#7BFF00]/30',
  reserved: 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/30',
  blocked: 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/30',
};
const STATUS_LABEL: Record<CourtSlot['status'], string> = { available: 'Libre', reserved: 'Reservado por usuario', blocked: 'Bloqueado por el club' };

/** Generate time options within court operating hours, every 30 min. */
function buildCourtTimes(open: string, close: string): string[] {
  const times: string[] = [];
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const startMin = oh * 60 + om;
  const endMin = ch * 60 + cm;
  for (let m = startMin; m <= endMin; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return times;
}

function SlotsTab({ court }: { court: Court }) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState<CourtSlot[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const courtTimes = buildCourtTimes(court.opening_time || '09:00', court.closing_time || '21:00');
  const [newStart, setNewStart] = useState(courtTimes[0] || '09:00');
  const [newEnd, setNewEnd] = useState(courtTimes[1] || '09:30');

  const loadSlots = () => getCourtSlots(court.id, selectedDate).then(setSlots);
  useEffect(() => { loadSlots(); }, [court.id, selectedDate]);

  const addDays = (base: string, n: number) => {
    const d = new Date(base); d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const handleCreate = async () => {
    if (newStart >= newEnd) return toast.error('La hora fin debe ser posterior a la hora inicio');
    if (newStart < (court.opening_time || '09:00')) return toast.error(`La canasta abre a las ${court.opening_time}`);
    if (newEnd > (court.closing_time || '21:00')) return toast.error(`La canasta cierra a las ${court.closing_time}`);
    // Check overlap with existing blocked slots
    const overlap = slots.find(s => s.status === 'blocked' && newStart < s.endTime && newEnd > s.startTime);
    if (overlap) return toast.error(`Se solapa con un bloqueo existente (${overlap.startTime} - ${overlap.endTime})`);
    await createCourtSlot({ courtId: court.id, date: selectedDate, startTime: newStart, endTime: newEnd, status: 'blocked' });
    setShowCreate(false);
    toast.success('Franja bloqueada — los usuarios no podrán reservar en este horario');
    loadSlots();
  };

  const handleUnblock = async (slot: CourtSlot) => {
    await updateCourtSlot(slot.id, { status: 'available' });
    toast.success('Franja liberada — los usuarios pueden reservar de nuevo');
    loadSlots();
  };

  const selectClass = 'bg-[#2C2C2E] text-white text-sm rounded-xl px-3 py-2 border border-[#2C2C2E] outline-none focus:border-[#7BFF00]';

  const blockedSlots = slots.filter(s => s.status === 'blocked').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const reservedSlots = slots.filter(s => s.status === 'reserved').sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedDate(d => addDays(d, -1))} className="text-[#8E8E93] hover:text-white px-2 py-1">←</button>
        <span className="text-white text-sm font-medium">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="text-[#8E8E93] hover:text-white px-2 py-1">→</button>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowCreate(true)}>+ Bloquear franja</Button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl px-4 py-3">
        <p className="text-xs text-[#8E8E93]">
          Horario de la canasta: <span className="text-white font-medium">{court.opening_time} – {court.closing_time}</span>.
          Las franjas bloqueadas impiden que los usuarios reserven desde la app.
        </p>
      </div>

      {/* Blocked slots */}
      {blockedSlots.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[#636366] uppercase">Franjas bloqueadas por el club</h3>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2C2C2E]">
                  {['Inicio', 'Fin', 'Duración', 'Acciones'].map(col => (
                    <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockedSlots.map(slot => {
                  const [sh, sm] = slot.startTime.split(':').map(Number);
                  const [eh, em] = slot.endTime.split(':').map(Number);
                  const mins = (eh * 60 + em) - (sh * 60 + sm);
                  return (
                    <tr key={slot.id} className="border-b border-[#2C2C2E] last:border-0 hover:bg-[#2C2C2E]/30">
                      <td className="px-4 py-3 text-sm text-white">{slot.startTime}</td>
                      <td className="px-4 py-3 text-sm text-white">{slot.endTime}</td>
                      <td className="px-4 py-3 text-sm text-[#8E8E93]">{mins} min</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUnblock(slot)}
                          className="text-xs text-[#FF9F0A] hover:text-white transition-colors"
                        >
                          Desbloquear
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Reserved slots (by users via app) */}
      {reservedSlots.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[#636366] uppercase">Reservas de usuarios</h3>
          <Card className="!p-0 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#2C2C2E]">
                  {['Inicio', 'Fin', 'Estado'].map(col => (
                    <th key={col} className="px-4 py-3 text-xs font-medium text-[#636366] uppercase">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservedSlots.map(slot => (
                  <tr key={slot.id} className="border-b border-[#2C2C2E] last:border-0">
                    <td className="px-4 py-3 text-sm text-white">{slot.startTime}</td>
                    <td className="px-4 py-3 text-sm text-white">{slot.endTime}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs border ${STATUS_COLORS.reserved}`}>
                        {STATUS_LABEL.reserved}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Empty state */}
      {blockedSlots.length === 0 && reservedSlots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Clock size={40} className="text-[#3C3C3E] mb-3" />
          <p className="text-white font-medium">Sin bloqueos para este día</p>
          <p className="text-sm text-[#8E8E93] mt-1">La canasta está completamente libre para reservas de usuarios.</p>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-[#8E8E93]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7BFF00]" />Libre</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0A84FF]" />Reservado por usuario</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />Bloqueado por el club</span>
      </div>

      {/* Modal bloquear franja */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Bloquear franja horaria"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button><Button onClick={handleCreate}>Bloquear franja</Button></>}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8E8E93]">Los usuarios no podrán reservar la canasta durante esta franja.</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-[#8E8E93] mb-1 block">Hora inicio</label>
              <select className={selectClass + ' w-full'} value={newStart} onChange={e => setNewStart(e.target.value)}>
                {courtTimes.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-[#8E8E93] mb-1 block">Hora fin</label>
              <select className={selectClass + ' w-full'} value={newEnd} onChange={e => setNewEnd(e.target.value)}>
                {courtTimes.filter(t => t > newStart).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Tab: Incidencias ────────────────────────────────────────

function IncidenciasTab({ court }: { court: Court }) {
  const [tickets, setTickets] = useState<MaintenanceTicketWithHoop[]>([]);

  useEffect(() => {
    getMaintenanceTickets(court.gymId).then(({ tickets: t }) => {
      setTickets(t.filter(tk => tk.courtId === court.id));
    });
  }, [court.id, court.gymId]);

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={40} className="text-[#3C3C3E] mb-3" />
        <p className="text-white font-medium">Sin incidencias</p>
        <p className="text-sm text-[#8E8E93] mt-1">Esta canasta no tiene incidencias registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map(ticket => (
        <Card key={ticket.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={PRIORITY_VARIANTS[ticket.priority]}>{PRIORITY_LABELS[ticket.priority]}</Badge>
                <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
              </div>
              <p className="text-sm font-medium text-white">{ticket.title}</p>
              <p className="text-xs text-[#8E8E93]">{ticket.description}</p>
              <p className="text-xs text-[#636366]">Creado {new Date(ticket.createdAt).toLocaleDateString('es')}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────

export default function CourtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentGym } = useGym();
  const [court, setCourt] = useState<Court | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'slots' | 'incidencias'>('config');

  useEffect(() => {
    getCourts().then(courts => {
      const found = courts.find(c => c.id === id);
      if (found) setCourt(found);
    });
  }, [id]);

  if (!court) {
    return <div className="flex items-center justify-center h-64"><p className="text-[#8E8E93]">Cargando...</p></div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/gym/${currentGym?.id}/courts`)}
        className="flex items-center gap-2 text-[#8E8E93] hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Volver a cestas</span>
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#7BFF00]/10 flex items-center justify-center">
          <Dribbble size={24} className="text-[#7BFF00]" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{court.name}</h1>
            <CourtStatusBadge status={court.status} />
            {!court.is_active && <Badge variant="gray">Inactiva</Badge>}
          </div>
          <p className="text-sm text-[#8E8E93]">{court.address || court.location}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'config', label: 'Configuración' },
          { id: 'slots', label: 'Slots' },
          { id: 'incidencias', label: 'Incidencias' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as 'config' | 'slots' | 'incidencias')}
      />

      {activeTab === 'config' && <ConfigTab court={court} onSaved={setCourt} />}
      {activeTab === 'slots' && <SlotsTab court={court} />}
      {activeTab === 'incidencias' && <IncidenciasTab court={court} />}
    </div>
  );
}
