import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Reservation, Court } from '../../types';

interface BlockSlotModalProps {
  open: boolean;
  courts: Court[];
  onSave: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function BlockSlotModal({ open, courts, onSave, onClose }: BlockSlotModalProps) {
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('Mantenimiento');

  const onlineCourts = courts.filter((c) => c.status === 'online');

  useEffect(() => {
    if (open) {
      setCourtId(onlineCourts[0]?.id ?? '');
      setDate('');
      setStartTime('');
      setEndTime('');
      setReason('Mantenimiento');
    }
  }, [open]);

  if (!open) return null;

  const inputClass =
    'w-full bg-[#2C2C2E] text-white rounded-xl border border-[#2C2C2E] px-3 py-2 text-sm focus:outline-none focus:border-[#7BFF00] transition-colors';

  const handleSubmit = () => {
    onSave({
      courtId,
      date,
      startTime,
      endTime,
      playerName: reason,
      format: '1v1',
      status: 'blocked',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Bloquear franja</h3>
          <button onClick={onClose} className="text-[#636366] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Cancha */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Cancha</label>
            <select
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
              className={inputClass}
            >
              {onlineCourts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8E8E93] mb-1">Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#8E8E93] mb-1">Hora fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              placeholder="Mantenimiento"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-[#2C2C2E] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#3C3C3E] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#7BFF00] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#7BFF00]/80 transition-colors"
          >
            Bloquear
          </button>
        </div>
      </div>
    </div>
  );
}
