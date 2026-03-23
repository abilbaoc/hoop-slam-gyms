import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Wifi } from 'lucide-react';
import type { Court } from '../../types/court';

interface CourtMarkerProps {
  court: Court;
  x: number;
  y: number;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: (courtId: string) => void;
}

const statusColor: Record<string, string> = {
  online: '#34C759',
  maintenance: '#FF9F0A',
  offline: '#636366',
};

const sensorColor: Record<string, string> = {
  ok: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',
};

export default function CourtMarker({ court, x, y, isEditing, isSelected, onSelect }: CourtMarkerProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: court.id,
    disabled: !isEditing,
  });

  const borderColor = statusColor[court.status] || '#636366';
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%)${transform ? ` translate(${transform.x}px, ${transform.y}px)` : ''}`,
    zIndex: isSelected ? 20 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(court.id)}
      className={`
        w-28 h-20 rounded-xl bg-[#0A0A0F] border-2 flex flex-col items-center justify-center gap-1 transition-all duration-150 select-none
        ${isSelected ? 'shadow-[0_0_16px_rgba(123,255,0,0.3)]' : ''}
        ${isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer hover:bg-[#1C1C1E]'}
      `}
      {...(isEditing ? { ...attributes, ...listeners } : {})}
      aria-label={court.name}
    >
      {isEditing && (
        <GripVertical size={12} className="text-[#636366] absolute top-1 right-1" />
      )}

      <div className="flex items-center gap-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: borderColor, boxShadow: `0 0 6px ${borderColor}` }}
        />
        <span className="text-xs font-semibold text-white truncate max-w-[80px]">
          {court.name}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Wifi size={10} style={{ color: sensorColor[court.sensorStatus] }} />
        <span className="text-[10px] text-[#636366]">
          {court.sensorStatus === 'ok' ? 'Sensor OK' : court.sensorStatus === 'warning' ? 'Alerta' : 'Error'}
        </span>
      </div>

      {/* Selected border glow */}
      <div
        className="absolute inset-0 rounded-xl border-2 pointer-events-none"
        style={{
          borderColor: isSelected ? '#7BFF00' : borderColor,
          opacity: isSelected ? 1 : 0.6,
        }}
      />
    </div>
  );
}
