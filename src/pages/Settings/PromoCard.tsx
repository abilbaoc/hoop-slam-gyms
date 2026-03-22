import { Pencil, Trash2 } from 'lucide-react';
import type { Promo } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

interface PromoCardProps {
  promo: Promo;
  onToggle: (id: string) => void;
  onEdit: (promo: Promo) => void;
  onDelete: (id: string) => void;
}

const typeBadge: Record<Promo['type'], { variant: 'green' | 'blue' | 'yellow'; label: string }> = {
  free: { variant: 'green', label: 'Gratis' },
  percentage: { variant: 'blue', label: 'Porcentaje' },
  fixed: { variant: 'yellow', label: 'Fijo' },
};

function formatValue(promo: Promo): string {
  if (promo.type === 'percentage') return `${promo.value}%`;
  if (promo.type === 'fixed') return `${promo.value} EUR`;
  return 'Gratis';
}

export default function PromoCard({ promo, onToggle, onEdit, onDelete }: PromoCardProps) {
  const badge = typeBadge[promo.type];

  return (
    <Card className={promo.active ? '' : 'opacity-60'}>
      {/* Row 1: Name + Badge + Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{promo.name}</span>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <button
          onClick={() => onToggle(promo.id)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            promo.active ? 'bg-[#7BFF00]' : 'bg-[#2C2C2E]'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              promo.active ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Row 2: Value */}
      <p className="text-lg font-bold text-[#7BFF00] mb-1">{formatValue(promo)}</p>

      {/* Row 3: Conditions */}
      <p className="text-xs text-[#8E8E93] mb-2">{promo.conditions}</p>

      {/* Row 4: Date range + Actions */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#636366]">
          {promo.startDate} — {promo.endDate}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(promo)}
            className="text-[#636366] hover:text-white transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(promo.id)}
            className="text-[#636366] hover:text-[#FF453A] transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
