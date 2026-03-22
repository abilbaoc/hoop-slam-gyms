import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Promo } from '../../types';

interface PromoModalProps {
  open: boolean;
  promo: Promo | null;
  gymId: string;
  onSave: (promo: Omit<Promo, 'id'>) => void;
  onClose: () => void;
}

export default function PromoModal({ open, promo, gymId, onSave, onClose }: PromoModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Promo['type']>('percentage');
  const [value, setValue] = useState(0);
  const [conditions, setConditions] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (promo) {
      setName(promo.name);
      setType(promo.type);
      setValue(promo.value);
      setConditions(promo.conditions);
      setStartDate(promo.startDate);
      setEndDate(promo.endDate);
      setActive(promo.active);
    } else {
      setName('');
      setType('percentage');
      setValue(0);
      setConditions('');
      setStartDate('');
      setEndDate('');
      setActive(true);
    }
  }, [promo, open]);

  if (!open) return null;

  const inputClass =
    'w-full bg-[#2C2C2E] text-white rounded-xl border border-[#2C2C2E] px-3 py-2 text-sm focus:outline-none focus:border-[#7BFF00] transition-colors';

  const handleSubmit = () => {
    onSave({ gymId, name, type, value, conditions, startDate, endDate, active });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {promo ? 'Editar promocion' : 'Nueva promocion'}
          </h3>
          <button onClick={onClose} className="text-[#636366] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Nombre de la promocion"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Promo['type'])}
              className={inputClass}
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Fijo</option>
              <option value="free">Gratis</option>
            </select>
          </div>

          {/* Valor */}
          {type !== 'free' && (
            <div>
              <label className="block text-xs text-[#8E8E93] mb-1">Valor</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className={inputClass}
                min={0}
              />
            </div>
          )}

          {/* Condiciones */}
          <div>
            <label className="block text-xs text-[#8E8E93] mb-1">Condiciones</label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className={inputClass}
              placeholder="Condiciones de aplicacion"
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8E8E93] mb-1">Fecha inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[#8E8E93] mb-1">Fecha fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Activa */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-white">Activa</label>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                active ? 'bg-[#7BFF00]' : 'bg-[#2C2C2E]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  active ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
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
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
