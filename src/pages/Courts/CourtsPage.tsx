import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Pencil, Trash2, Wifi, WifiOff } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import CourtStatusBadge from '../../components/shared/CourtStatusBadge';
import { getCourts, getCourtOccupancyData, createCourt, updateCourt, deleteCourt } from '../../data/api';
import type { Court, CourtOccupancy, CourtStatus } from '../../types';
import { useGym } from '../../contexts/GymContext';
import { toast } from 'sonner';

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [occupancy, setOccupancy] = useState<CourtOccupancy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editCourt, setEditCourt] = useState<Court | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Court | null>(null);
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<CourtStatus>('online');
  const navigate = useNavigate();
  const { currentGym } = useGym();

  const loadData = () => {
    getCourts(currentGym?.id).then(setCourts);
    getCourtOccupancyData(currentGym?.id).then(setOccupancy);
  };

  useEffect(() => {
    loadData();
  }, [currentGym?.id]);

  const getOccupancy = (courtId: string) =>
    occupancy.find((o) => o.courtId === courtId);

  const openCreate = () => {
    setFormName('');
    setFormLocation('');
    setFormStatus('online');
    setShowCreate(true);
  };

  const openEdit = (court: Court, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormName(court.name);
    setFormLocation(court.location);
    setFormStatus(court.status);
    setEditCourt(court);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    await createCourt({
      gymId: currentGym?.id || 'gym-001',
      name: formName,
      location: formLocation || currentGym?.city || 'Barcelona',
      status: formStatus,
      installedDate: new Date().toISOString().split('T')[0],
      firmwareVersion: 'v2.1.3',
      lastHeartbeat: new Date().toISOString(),
      sensorStatus: 'ok',
    });
    setShowCreate(false);
    toast.success('Canasta creada');
    loadData();
  };

  const handleUpdate = async () => {
    if (!editCourt || !formName.trim()) return;
    await updateCourt(editCourt.id, {
      name: formName,
      location: formLocation,
      status: formStatus,
    });
    setEditCourt(null);
    toast.success('Canasta actualizada');
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteCourt(deleteTarget.id);
    setDeleteTarget(null);
    toast.success('Canasta eliminada');
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Canchas</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">{courts.length} canchas registradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Agregar Canasta
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {courts.map((court) => {
          const occ = getOccupancy(court.id);
          return (
            <Card
              key={court.id}
              hover
              onClick={() => navigate(`/gym/${currentGym?.id}/courts/${court.id}`)}
              className="cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#7BFF00]/10 flex items-center justify-center">
                    <MapPin size={20} className="text-[#7BFF00]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {court.sensorStatus === 'ok' ? (
                      <Wifi size={12} className="text-[#34C759]" />
                    ) : (
                      <WifiOff size={12} className={court.sensorStatus === 'warning' ? 'text-[#FF9F0A]' : 'text-[#FF453A]'} />
                    )}
                    {court.firmwareVersion && (
                      <span className="text-[10px] text-[#636366]">{court.firmwareVersion}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CourtStatusBadge status={court.status} />
                  <button
                    onClick={(e) => openEdit(court, e)}
                    className="p-1.5 rounded-lg text-[#636366] hover:text-white hover:bg-[#2C2C2E] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(court); }}
                    className="p-1.5 rounded-lg text-[#636366] hover:text-[#FF453A] hover:bg-[#2C2C2E] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{court.name}</h3>
              <p className="text-xs text-[#8E8E93] mb-4">{court.location}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[#2C2C2E]">
                <div>
                  <p className="text-xs text-[#636366]">Partidos hoy</p>
                  <p className="font-display text-2xl text-white leading-none">{occ?.matchesToday ?? 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#636366]">Ocupacion</p>
                  <p className="font-display text-2xl text-[#7BFF00] leading-none">
                    {occ ? `${Math.round(occ.occupancy)}%` : '-'}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Agregar Canasta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" placeholder="Canasta Norte" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Ubicacion" placeholder="Barcelona, Gracia" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8E8E93]">Estado</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as CourtStatus)}
              className="w-full bg-[#2C2C2E] text-white rounded-xl border border-[#3C3C3E] px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#7BFF00]/40"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editCourt}
        onClose={() => setEditCourt(null)}
        title="Editar Canasta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditCourt(null)}>Cancelar</Button>
            <Button onClick={handleUpdate}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nombre" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Input label="Ubicacion" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#8E8E93]">Estado</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as CourtStatus)}
              className="w-full bg-[#2C2C2E] text-white rounded-xl border border-[#3C3C3E] px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#7BFF00]/40"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Mantenimiento</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar Canasta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="secondary" className="!text-[#FF453A] !border-[#FF453A]/30" onClick={handleDelete}>Eliminar</Button>
          </>
        }
      >
        <p className="text-sm text-[#8E8E93]">
          Estas seguro de que quieres eliminar <strong className="text-white">{deleteTarget?.name}</strong>? Esta accion no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
