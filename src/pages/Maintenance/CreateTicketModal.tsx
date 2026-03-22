import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Court } from '../../types/court';
import type { AppUser } from '../../types/auth';
import type { MaintenanceTicket, TicketPriority } from '../../types/maintenance';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  users: AppUser[];
  gymId: string;
  onCreated: (ticket: MaintenanceTicket) => void;
}

export default function CreateTicketModal({ isOpen, onClose, courts, users, gymId, onCreated }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courtId, setCourtId] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !courtId) return;
    const now = new Date().toISOString();
    const ticket: MaintenanceTicket = {
      id: `maint-${Date.now()}`,
      courtId,
      gymId,
      title: title.trim(),
      description: description.trim(),
      priority,
      status: 'open',
      assignedTo: assignedTo || null,
      createdBy: 'user-001',
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    };
    onCreated(ticket);
    setTitle('');
    setDescription('');
    setCourtId('');
    setPriority('medium');
    setAssignedTo('');
    onClose();
  };

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';
  const labelClass = 'block text-sm text-[#8E8E93] mb-1.5';

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Nuevo ticket de mantenimiento"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !courtId}>Crear ticket</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Titulo *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Describe brevemente el problema"
          />
        </div>
        <div>
          <label className={labelClass}>Descripcion</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[80px] resize-none`}
            placeholder="Detalle del problema..."
          />
        </div>
        <div>
          <label className={labelClass}>Canasta *</label>
          <select value={courtId} onChange={(e) => setCourtId(e.target.value)} className={inputClass}>
            <option value="">Seleccionar canasta</option>
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prioridad</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={inputClass}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Asignar a (opcional)</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputClass}>
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
