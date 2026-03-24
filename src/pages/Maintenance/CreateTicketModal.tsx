import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import type { Court } from '../../types/court';
import type { AppUser } from '../../types/auth';
import type { TicketPriority } from '../../types/maintenance';
import type { MaintenanceTicketWithHoop } from '../../types/maintenance-hoop';
import { needsHoopNotification } from '../../types/maintenance-hoop';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  users: AppUser[];
  gymId: string;
  onCreated: (ticket: MaintenanceTicketWithHoop) => void;
}

export default function CreateTicketModal({ isOpen, onClose, courts, users, gymId, onCreated }: CreateTicketModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courtId, setCourtId] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [notifyHoop, setNotifyHoop] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const autoNotifies = needsHoopNotification({ priority });

  const handleSubmit = async () => {
    if (!title.trim() || !courtId || isSubmitting) return;
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const willNotify = autoNotifies || notifyHoop;

    const ticket: MaintenanceTicketWithHoop = {
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
      hoopStatus: willNotify ? 'pending' : null,
      hoopAssignedTo: null,
      hoopNotes: null,
      notifiedAt: willNotify ? now : null,
    };

    onCreated(ticket);

    // Llamar Edge Function si corresponde
    if (willNotify) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.functions.invoke('notify-hoop-on-ticket', {
            body: { ticket_id: ticket.id },
          });
        } catch (err) {
          // Graceful: el ticket ya fue creado, el fallo de notificacion no lo bloquea
          console.warn('[CreateTicketModal] Edge Function notify-hoop-on-ticket fallo:', err);
        }
      } else {
        // Mock mode: simular notificacion
        console.log(`[CreateTicketModal] Mock mode: notificacion Hoop simulada para ticket ${ticket.id} (${priority})`);
      }

      const toastMsg = priority === 'critical'
        ? 'Ticket creado. El equipo tecnico de Hoop Slam ha sido notificado.'
        : 'Ticket creado. Hoop Slam ha sido notificado.';
      const toastDuration = priority === 'critical' ? 5000 : 4000;
      toast.success(toastMsg, { duration: toastDuration });
    } else {
      toast.success('Ticket creado correctamente.', { duration: 3000 });
    }

    // Reset form
    setTitle('');
    setDescription('');
    setCourtId('');
    setPriority('medium');
    setAssignedTo('');
    setNotifyHoop(false);
    setIsSubmitting(false);
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
          <Button onClick={handleSubmit} disabled={!title.trim() || !courtId || isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear ticket'}
          </Button>
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
          <select value={priority} onChange={(e) => { setPriority(e.target.value as TicketPriority); setNotifyHoop(false); }} className={inputClass}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="critical">Critica</option>
          </select>
          {/* Banner automatico para high/critical */}
          {autoNotifies && (
            <div
              className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl text-xs"
              style={{ backgroundColor: 'rgba(255,159,10,0.1)', borderLeft: '3px solid #FF9F0A', color: '#FF9F0A' }}
            >
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#FF9F0A' }} />
              <span>Esta incidencia sera notificada automaticamente al equipo tecnico de Hoop Slam</span>
            </div>
          )}
          {/* Checkbox opcional para low/medium */}
          {!autoNotifies && (
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyHoop}
                onChange={(e) => setNotifyHoop(e.target.checked)}
                className="accent-[#7BFF00] w-4 h-4 rounded"
              />
              <span className="text-xs text-[#8E8E93]">Notificar al equipo tecnico de Hoop Slam</span>
            </label>
          )}
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
