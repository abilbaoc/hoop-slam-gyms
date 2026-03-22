import { useEffect, useState } from 'react';
import { FileText, Sparkles, Download, Plus, Minus, Pencil } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { useGym } from '../../contexts/GymContext';
import { getAuditEntries } from '../../data/api';
import type { AuditEntry } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

      {tab === 'export' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[#7BFF00]/10 flex items-center justify-center mb-6">
            <Download size={32} className="text-[#7BFF00]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Exportar Datos</h2>
          <p className="text-sm text-[#8E8E93] text-center max-w-md">
            Proximamente podras exportar datos en CSV y PDF para compartir con tu equipo o presentar a clientes.
          </p>
        </div>
      )}
    </div>
  );
}
