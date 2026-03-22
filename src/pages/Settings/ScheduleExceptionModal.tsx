import { useState } from 'react';
import type { ScheduleException } from '../../types/config';

interface ScheduleExceptionModalProps {
  open: boolean;
  courtName: string;
  onSave: (exception: Omit<ScheduleException, 'id' | 'courtId'>) => void;
  onClose: () => void;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#7BFF00]' : 'bg-[#636366]'
      }`}
    >
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

export default function ScheduleExceptionModal({
  open,
  courtName,
  onSave,
  onClose,
}: ScheduleExceptionModalProps) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isClosed, setIsClosed] = useState(true);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');

  if (!open) return null;

  const handleSave = () => {
    if (!date || !reason) return;

    const exception: Omit<ScheduleException, 'id' | 'courtId'> = {
      date,
      reason,
      isClosed,
      ...(isClosed ? {} : { openTime, closeTime }),
    };

    onSave(exception);
    setDate('');
    setReason('');
    setIsClosed(true);
    setOpenTime('09:00');
    setCloseTime('18:00');
  };

  const inputClass =
    'bg-[#2C2C2E] text-white rounded-xl border border-[#2C2C2E] px-3 py-2 text-sm outline-none focus:border-[#7BFF00] transition-colors w-full';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-5">
          Nueva excepcion - {courtName}
        </h3>

        <div className="flex flex-col gap-4">
          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8E8E93]">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Motivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#8E8E93]">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Festivo local"
              className={inputClass}
            />
          </div>

          {/* Toggle cerrado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">Cerrado todo el dia</span>
            <ToggleSwitch checked={isClosed} onChange={setIsClosed} />
          </div>

          {/* Horario especial */}
          {!isClosed && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium text-[#8E8E93]">
                  Apertura
                </label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium text-[#8E8E93]">
                  Cierre
                </label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}
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
            onClick={handleSave}
            disabled={!date || !reason}
            className="bg-[#7BFF00] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#7BFF00]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
