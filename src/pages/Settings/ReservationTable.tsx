import type { Reservation, Court } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import FormatBadge from '../../components/shared/FormatBadge';

interface ReservationTableProps {
  reservations: Reservation[];
  courts: Court[];
  onCancel: (id: string) => void;
}

const statusConfig: Record<
  Reservation['status'],
  { variant: 'green' | 'red' | 'yellow'; label: string }
> = {
  confirmed: { variant: 'green', label: 'Confirmada' },
  cancelled: { variant: 'red', label: 'Cancelada' },
  blocked: { variant: 'yellow', label: 'Bloqueada' },
};

export default function ReservationTable({ reservations, courts, onCancel }: ReservationTableProps) {
  const courtMap = new Map(courts.map((c) => [c.id, c.name]));

  const sorted = [...reservations].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.startTime.localeCompare(a.startTime);
  });

  return (
    <Card className="!p-0 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2C2C2E]">
            {['Fecha', 'Hora', 'Cancha', 'Jugador', 'Formato', 'Estado', 'Acciones'].map(
              (col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-xs font-medium text-[#636366] uppercase tracking-wider"
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((res) => {
            const status = statusConfig[res.status];
            return (
              <tr
                key={res.id}
                className="border-b border-[#2C2C2E] hover:bg-[#2C2C2E]/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-white">{res.date}</td>
                <td className="px-4 py-3 text-sm text-white">
                  {res.startTime} - {res.endTime}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {courtMap.get(res.courtId) ?? res.courtId}
                </td>
                <td className="px-4 py-3 text-sm text-white">{res.playerName}</td>
                <td className="px-4 py-3">
                  <FormatBadge format={res.format} />
                </td>
                <td className="px-4 py-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => onCancel(res.id)}
                      className="text-xs text-[#FF453A] hover:underline transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
