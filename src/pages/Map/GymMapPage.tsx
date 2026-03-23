import { useEffect, useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { useGym } from '../../contexts/GymContext';
import { getCourts, getCourtPositions, updateCourtPosition } from '../../data/api';
import type { Court, CourtMapPosition } from '../../types/court';
import { Button } from '../../components/ui/Button';
import FloorPlan from './FloorPlan';
import CourtDetailPanel from './CourtDetailPanel';
import { toast } from 'sonner';

export default function GymMapPage() {
  const { currentGym, gymId } = useGym();
  const [courts, setCourts] = useState<Court[]>([]);
  const [positions, setPositions] = useState<CourtMapPosition[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) return;
    Promise.all([getCourts(gymId), getCourtPositions(gymId)]).then(([c, p]) => {
      setCourts(c);
      setPositions(p);
    });
  }, [gymId]);

  const selectedCourt = courts.find(c => c.id === selectedCourtId) || null;

  const handleUpdatePosition = async (courtId: string, x: number, y: number) => {
    await updateCourtPosition(courtId, x, y);
    setPositions(prev =>
      prev.map(p => (p.courtId === courtId ? { ...p, x, y } : p))
    );
    toast.success('Posicion actualizada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Mapa del Gimnasio</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">
            {currentGym?.name || 'Gimnasio'} — {courts.length} canchas
          </p>
        </div>
        <Button
          variant={isEditing ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setIsEditing(e => !e)}
        >
          {isEditing ? <Check size={16} /> : <Pencil size={16} />}
          {isEditing ? 'Guardar' : 'Editar disposicion'}
        </Button>
      </div>

      {/* Map + Detail */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <FloorPlan
            courts={courts}
            positions={positions}
            isEditing={isEditing}
            selectedCourtId={selectedCourtId}
            onSelectCourt={setSelectedCourtId}
            onUpdatePosition={handleUpdatePosition}
          />
        </div>

        {selectedCourt && (
          <CourtDetailPanel
            court={selectedCourt}
            gymId={gymId}
            onClose={() => setSelectedCourtId(null)}
          />
        )}
      </div>
    </div>
  );
}
