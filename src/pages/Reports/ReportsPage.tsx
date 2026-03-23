import { useEffect, useState } from 'react';
import { FileText, FileBarChart, Sparkles, Download, Plus, Minus, Pencil, Loader2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { useGym } from '../../contexts/GymContext';
import { getAuditEntries, getMatches, getReservations, getPlayers, getCourts, getKPIs, getDailyMatchesData, getCourtOccupancyData, getFormatDistributionData } from '../../data/api';
import type { AuditEntry } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { exportMatchesCSV, exportPlayersCSV, exportReservationsCSV, exportAuditCSV, exportWeeklySummaryPDF } from '../../utils/export';

function ActionIcon({ action }: { action: AuditEntry['action'] }) {
  if (action === 'create') return <Plus size={14} className="text-[#34C759]" />;
  if (action === 'delete') return <Minus size={14} className="text-[#FF453A]" />;
  return <Pencil size={14} className="text-[#FF9F0A]" />;
}

function ActionBadge({ action }: { action: AuditEntry['action'] }) {
  const styles = {
    create: 'bg-[#34C759]/10 text-[#34C759]',
    update: 'bg-[#FF9F0A]/10 text-[#FF9F0A]',
    delete: 'bg-[#FF453A]/10 text-[#FF453A]',
  };
  const labels = { create: 'Crear', update: 'Editar', delete: 'Eliminar' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${styles[action]}`}>
      <ActionIcon action={action} />
      {labels[action]}
    </span>
  );
}

const reportTabs = [
  { id: 'activity', label: 'Actividad Reciente' },
  { id: 'reports', label: 'Reportes IA' },
  { id: 'export', label: 'Exportar' },
];

export default function ReportsPage() {
  const { currentGym } = useGym();
  const [tab, setTab] = useState('activity');
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    getAuditEntries(currentGym?.id).then(setEntries);
  }, [currentGym?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Reportes</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">Actividad y reportes automaticos</p>
      </div>

      <Tabs tabs={reportTabs} activeTab={tab} onChange={setTab} />

      {tab === 'activity' && (
        <Card>
          <div className="divide-y divide-[#2C2C2E]">
            {entries.length === 0 && (
              <p className="text-sm text-[#8E8E93] py-8 text-center">No hay actividad registrada</p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex-shrink-0 mt-0.5">
                  <ActionBadge action={entry.action} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{entry.description}</p>
                  <p className="text-xs text-[#636366] mt-0.5">
                    {entry.userName} &middot; {entry.entity} &middot;{' '}
                    {format(new Date(entry.timestamp), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#7BFF00]/10 flex items-center justify-center mb-6">
            <FileText size={32} className="text-[#7BFF00]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Proximamente</h2>
          <p className="text-sm text-[#8E8E93] text-center max-w-md mb-8">
            Reportes semanales automaticos generados con IA. Recibe cada lunes un resumen
            con metricas clave, tendencias y recomendaciones listo para compartir.
          </p>
          <Card className="max-w-lg w-full opacity-60">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-[#7BFF00]" />
              <span className="text-xs font-medium text-[#7BFF00]">Ejemplo de reporte</span>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-[#2C2C2E] rounded-full w-full" />
              <div className="h-3 bg-[#2C2C2E] rounded-full w-4/5" />
              <div className="h-3 bg-[#2C2C2E] rounded-full w-3/5" />
              <div className="mt-4 p-3 bg-[#2C2C2E] rounded-xl">
                <p className="text-xs text-[#8E8E93] italic">
                  "Esta semana 47 partidos (+12%), pico martes-jueves 17-19h,
                  recurrencia 65%. La canasta Norte muestra la mayor ocupacion..."
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'export' && <ExportTab gymId={currentGym?.id} gymName={currentGym?.name} />}
    </div>
  );
}

// ── Export tab ──

interface ExportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onExport: () => Promise<void>;
}

function ExportCard({ icon, title, description, onExport }: ExportCardProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onExport();
      toast.success(`${title} exportado correctamente`);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#7BFF00]/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-[#8E8E93] mt-0.5">{description}</p>
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Descargar
      </Button>
    </Card>
  );
}

function ExportTab({ gymId, gymName }: { gymId?: string; gymName?: string }) {
  const buildCourtMap = async () => {
    const courts = await getCourts(gymId);
    return Object.fromEntries(courts.map(c => [c.id, c.name])) as Record<string, string>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ExportCard
        icon={<FileText size={20} className="text-[#7BFF00]" />}
        title="Partidos"
        description="Exportar historial de partidos en formato CSV"
        onExport={async () => {
          const [matches, courtMap] = await Promise.all([getMatches({ gymId }), buildCourtMap()]);
          exportMatchesCSV(matches, courtMap);
        }}
      />
      <ExportCard
        icon={<FileText size={20} className="text-[#7BFF00]" />}
        title="Reservas"
        description="Exportar reservas en formato CSV"
        onExport={async () => {
          const [reservations, courtMap] = await Promise.all([getReservations({ gymId }), buildCourtMap()]);
          exportReservationsCSV(reservations, courtMap);
        }}
      />
      <ExportCard
        icon={<FileText size={20} className="text-[#7BFF00]" />}
        title="Jugadores"
        description="Exportar jugadores registrados en formato CSV"
        onExport={async () => {
          const players = await getPlayers(gymId);
          exportPlayersCSV(players);
        }}
      />
      <ExportCard
        icon={<FileText size={20} className="text-[#7BFF00]" />}
        title="Auditoria"
        description="Exportar log de actividad en formato CSV"
        onExport={async () => {
          const entries = await getAuditEntries(gymId);
          exportAuditCSV(entries);
        }}
      />
      <ExportCard
        icon={<FileBarChart size={20} className="text-[#7BFF00]" />}
        title="Resumen Semanal"
        description="Reporte PDF con KPIs, partidos y ocupacion"
        onExport={async () => {
          const [kpis, daily, occupancy, formats] = await Promise.all([
            getKPIs(gymId),
            getDailyMatchesData(7, gymId),
            getCourtOccupancyData(gymId),
            getFormatDistributionData(gymId),
          ]);
          exportWeeklySummaryPDF(kpis, daily, occupancy, formats, gymName || 'Gimnasio');
        }}
      />
    </div>
  );
}
