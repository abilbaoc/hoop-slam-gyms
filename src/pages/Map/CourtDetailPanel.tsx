import { X, ExternalLink, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Court } from '../../types/court';
import CourtStatusBadge from '../../components/shared/CourtStatusBadge';
import { Button } from '../../components/ui/Button';

interface CourtDetailPanelProps {
  court: Court;
  gymId: string;
  onClose: () => void;
}

const sensorLabel: Record<string, { label: string; color: string }> = {
  ok: { label: 'Operativo', color: '#34C759' },
  warning: { label: 'Alerta', color: '#FF9F0A' },
  error: { label: 'Error', color: '#FF453A' },
};

export default function CourtDetailPanel({ court, gymId, onClose }: CourtDetailPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="w-80 bg-[#1C1C1E] rounded-2xl border border-[#2C2C2E] p-5 flex flex-col gap-4 flex-shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{court.name}</h3>
          <p className="text-xs text-[#8E8E93] mt-0.5">{court.location}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[#2C2C2E] text-[#636366] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#636366]">Estado:</span>
        <CourtStatusBadge status={court.status} />
      </div>

      {/* Sensor */}
      <div className="bg-[#0A0A0F] rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Wifi size={14} style={{ color: sensorLabel[court.sensorStatus]?.color }} />
          <span className="text-sm text-white">Sensor</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#636366]">Estado</span>
          <span className="text-xs" style={{ color: sensorLabel[court.sensorStatus]?.color }}>
            {sensorLabel[court.sensorStatus]?.label}
          </span>
        </div>
        {court.firmwareVersion && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#636366]">Firmware</span>
            <span className="text-xs text-[#8E8E93]">{court.firmwareVersion}</span>
          </div>
        )}
        {court.lastHeartbeat && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#636366]">Ultimo heartbeat</span>
            <span className="text-xs text-[#8E8E93]">
              {new Date(court.lastHeartbeat).toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Installation date */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#636366]">Instalada</span>
        <span className="text-xs text-[#8E8E93]">
          {new Date(court.installedDate).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Action */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(`/gym/${gymId}/courts/${court.id}`)}
      >
        <ExternalLink size={14} />
        Ver detalle completo
      </Button>
    </div>
  );
}
