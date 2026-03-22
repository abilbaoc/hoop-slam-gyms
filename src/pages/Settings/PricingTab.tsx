import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { PricingRule, Promo } from '../../types';
import { getPricingRules, getPromos } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PriceTimeline from './PriceTimeline';
import PromoCard from './PromoCard';
import PromoModal from './PromoModal';
import ConfirmDialog from './ConfirmDialog';

const typeBadge: Record<PricingRule['type'], { variant: 'blue' | 'red' | 'green' | 'yellow'; label: string }> = {
  base: { variant: 'blue', label: 'Base' },
  peak: { variant: 'red', label: 'Pico' },
  offpeak: { variant: 'green', label: 'Valle' },
  weekend: { variant: 'yellow', label: 'Fin de semana' },
};

function formatRuleSubtitle(rule: PricingRule): string {
  if (rule.type === 'base') return rule.name;
  if (rule.type === 'weekend') return `${rule.name} (Sab-Dom)`;
  if (rule.startHour !== undefined && rule.endHour !== undefined) {
    return `${rule.name} (${rule.startHour}:00 - ${rule.endHour}:00)`;
  }
  return rule.name;
}

export default function PricingTab() {
  const { currentGym } = useGym();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPricingRules(currentGym?.id).then(setRules);
    getPromos(currentGym?.id).then(setPromos);
  }, [currentGym?.id]);

  useEffect(() => {
    if (editingRuleId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingRuleId]);

  const handleRuleClick = (rule: PricingRule) => {
    setEditingRuleId(rule.id);
    setEditValue(rule.priceEur.toString());
  };

  const saveRulePrice = () => {
    if (!editingRuleId) return;
    const price = parseFloat(editValue);
    if (isNaN(price) || price < 0) {
      setEditingRuleId(null);
      return;
    }
    setRules((prev) =>
      prev.map((r) => (r.id === editingRuleId ? { ...r, priceEur: price } : r))
    );
    setEditingRuleId(null);
  };

  const handlePromoToggle = (id: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handlePromoSave = (data: Omit<Promo, 'id'>) => {
    if (editingPromo) {
      setPromos((prev) =>
        prev.map((p) => (p.id === editingPromo.id ? { ...p, ...data } : p))
      );
    } else {
      const newPromo: Promo = {
        ...data,
        id: `promo-${Date.now()}`,
      };
      setPromos((prev) => [...prev, newPromo]);
    }
    setShowPromoModal(false);
    setEditingPromo(null);
  };

  const handlePromoDelete = () => {
    if (!confirmDeleteId) return;
    setPromos((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-8">
      {/* Tarifas */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Tarifas</h2>
        <div className="grid grid-cols-2 gap-4">
          {rules.map((rule) => {
            const badge = typeBadge[rule.type];
            return (
              <Card key={rule.id}>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                <div className="mt-3 mb-1">
                  {editingRuleId === rule.id ? (
                    <input
                      ref={inputRef}
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveRulePrice}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRulePrice();
                        if (e.key === 'Escape') setEditingRuleId(null);
                      }}
                      className="bg-[#2C2C2E] text-white rounded-xl border border-[#7BFF00] px-3 py-1 text-2xl font-bold w-28 focus:outline-none"
                      min={0}
                      step={0.5}
                    />
                  ) : (
                    <button
                      onClick={() => handleRuleClick(rule)}
                      className="text-2xl font-bold text-white hover:text-[#7BFF00] transition-colors"
                    >
                      {rule.priceEur} EUR
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#8E8E93]">{formatRuleSubtitle(rule)}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Timeline */}
      <PriceTimeline rules={rules} />

      {/* Promociones */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Promociones</h2>
          <button
            onClick={() => {
              setEditingPromo(null);
              setShowPromoModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#7BFF00] text-black px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-[#7BFF00]/80 transition-colors"
          >
            <Plus size={16} />
            Crear promocion
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {promos.map((promo) => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onToggle={handlePromoToggle}
              onEdit={(p) => {
                setEditingPromo(p);
                setShowPromoModal(true);
              }}
              onDelete={(id) => setConfirmDeleteId(id)}
            />
          ))}
        </div>
      </section>

      {/* Promo Modal */}
      <PromoModal
        open={showPromoModal}
        promo={editingPromo}
        gymId={currentGym?.id || ''}
        onSave={handlePromoSave}
        onClose={() => {
          setShowPromoModal(false);
          setEditingPromo(null);
        }}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Eliminar promocion"
        message="Esta accion no se puede deshacer. La promocion sera eliminada permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handlePromoDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
