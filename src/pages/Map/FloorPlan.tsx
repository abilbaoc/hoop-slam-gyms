import { useRef } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import type { Court, CourtMapPosition } from '../../types/court';
import CourtMarker from './CourtMarker';

interface FloorPlanProps {
  courts: Court[];
  positions: CourtMapPosition[];
  isEditing: boolean;
  selectedCourtId: string | null;
  onSelectCourt: (courtId: string) => void;
  onUpdatePosition: (courtId: string, x: number, y: number) => void;
}

export default function FloorPlan({
  courts,
  positions,
  isEditing,
  selectedCourtId,
  onSelectCourt,
  onUpdatePosition,
}: FloorPlanProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const courtId = String(event.active.id);
    const translated = event.active.rect.current.translated;
    if (!translated) return;

    const newX = Math.max(5, Math.min(95,
      ((translated.left + translated.width / 2) - containerRect.left) / containerRect.width * 100
    ));
    const newY = Math.max(5, Math.min(95,
      ((translated.top + translated.height / 2) - containerRect.top) / containerRect.height * 100
    ));

    onUpdatePosition(courtId, Math.round(newX * 10) / 10, Math.round(newY * 10) / 10);
  };

  const posMap = new Map(positions.map(p => [p.courtId, p]));

  const content = courts.map(court => {
    const pos = posMap.get(court.id) || { courtId: court.id, x: 50, y: 50 };
    return (
      <CourtMarker
        key={court.id}
        court={court}
        x={pos.x}
        y={pos.y}
        isEditing={isEditing}
        isSelected={selectedCourtId === court.id}
        onSelect={onSelectCourt}
      />
    );
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E] overflow-hidden"
      style={{
        aspectRatio: '16 / 9',
        minHeight: 400,
        backgroundImage: 'radial-gradient(circle, #2C2C2E 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Floor label */}
      <div className="absolute top-3 left-4 text-xs text-[#636366] font-medium uppercase tracking-wider">
        Planta del gimnasio
      </div>

      {isEditing ? (
        <DndContext onDragEnd={handleDragEnd}>
          {content}
        </DndContext>
      ) : (
        content
      )}

      {courts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-[#636366]">No hay canchas configuradas</p>
        </div>
      )}
    </div>
  );
}
