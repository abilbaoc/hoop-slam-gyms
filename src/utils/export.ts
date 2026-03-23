import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Match } from '../types/match';
import type { Player } from '../types/player';
import type { Reservation } from '../types/config';
import type { AuditEntry } from '../types/audit';
import type { KPIData, DailyMatches, CourtOccupancy, FormatDistribution } from '../types/analytics';

// ── CSV helpers ──

export function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMatchesCSV(matches: Match[], courtNameMap: Record<string, string>) {
  const headers = ['ID', 'Canasta', 'Formato', 'Puntos A', 'Puntos B', 'Duracion (min)', 'Inicio', 'Fin', 'Jugadores'];
  const rows = matches.map(m => [
    m.id,
    courtNameMap[m.courtId] || m.courtId,
    m.format,
    String(m.scoreA),
    String(m.scoreB),
    String(m.duration),
    m.startedAt,
    m.endedAt,
    String(m.playerCount),
  ]);
  downloadCSV('partidos.csv', headers, rows);
}

export function exportPlayersCSV(players: Player[]) {
  const headers = ['ID', 'Nombre', 'Rating ELO', 'Nivel', 'Partidos', 'Victorias', 'Derrotas', 'Formato Preferido', 'Recurrencia', 'Ultima Partida', 'Fecha Registro'];
  const rows = players.map(p => [
    p.id,
    p.name,
    String(p.elo),
    p.level,
    String(p.matchesPlayed),
    String(p.wins),
    String(p.losses),
    p.preferredFormat,
    p.recurrence,
    p.lastPlayedAt,
    p.joinedAt,
  ]);
  downloadCSV('jugadores.csv', headers, rows);
}

export function exportReservationsCSV(reservations: Reservation[], courtNameMap: Record<string, string>) {
  const headers = ['ID', 'Canasta', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Jugador', 'Formato', 'Estado', 'Creada'];
  const rows = reservations.map(r => [
    r.id,
    courtNameMap[r.courtId] || r.courtId,
    r.date,
    r.startTime,
    r.endTime,
    r.playerName,
    r.format,
    r.status,
    r.createdAt,
  ]);
  downloadCSV('reservas.csv', headers, rows);
}

export function exportAuditCSV(entries: AuditEntry[]) {
  const headers = ['ID', 'Fecha', 'Usuario', 'Accion', 'Entidad', 'ID Entidad', 'Descripcion'];
  const rows = entries.map(e => [
    e.id,
    e.timestamp,
    e.userName,
    e.action,
    e.entity,
    e.entityId,
    e.description,
  ]);
  downloadCSV('auditoria.csv', headers, rows);
}

// ── PDF ──

export function exportWeeklySummaryPDF(
  kpis: KPIData,
  dailyMatches: DailyMatches[],
  courtOccupancy: CourtOccupancy[],
  formatDist: FormatDistribution[],
  gymName: string,
) {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Resumen Semanal', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${gymName} — ${dateStr}`, 14, 30);

  // KPIs table
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Indicadores Clave', 14, 44);

  autoTable(doc, {
    startY: 48,
    head: [['Metrica', 'Valor']],
    body: [
      ['Partidos hoy', String(kpis.matchesToday)],
      ['Jugadores activos', String(kpis.activePlayers)],
      ['Ocupacion promedio', `${kpis.avgOccupancy}%`],
      ['Formato popular', kpis.popularFormat],
      ['Partidos esta semana', String(kpis.totalMatchesWeek)],
      ['Hora pico', kpis.peakHour],
    ],
    theme: 'striped',
    headStyles: { fillColor: [123, 255, 0], textColor: [0, 0, 0] },
  });

  // Daily matches
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableEndY = ((doc as any).lastAutoTable?.finalY as number) ?? 120;
  const nextY = tableEndY + 12;

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Partidos Diarios', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Fecha', 'Partidos']],
    body: dailyMatches.slice(-7).map(d => [d.date, String(d.matches)]),
    theme: 'striped',
    headStyles: { fillColor: [123, 255, 0], textColor: [0, 0, 0] },
  });

  // Court occupancy
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Ocupacion por Canasta', 14, 22);

  autoTable(doc, {
    startY: 26,
    head: [['Canasta', 'Ocupacion', 'Partidos Hoy']],
    body: courtOccupancy.map(c => [c.courtName, `${c.occupancy}%`, String(c.matchesToday)]),
    theme: 'striped',
    headStyles: { fillColor: [123, 255, 0], textColor: [0, 0, 0] },
  });

  // Format distribution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courtTableY = ((doc as any).lastAutoTable?.finalY as number) ?? 80;
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Distribucion de Formatos', 14, courtTableY + 12);

  autoTable(doc, {
    startY: courtTableY + 16,
    head: [['Formato', 'Partidos', 'Porcentaje']],
    body: formatDist.map(f => [f.format, String(f.count), `${f.percentage}%`]),
    theme: 'striped',
    headStyles: { fillColor: [123, 255, 0], textColor: [0, 0, 0] },
  });

  doc.save(`resumen-semanal-${now.toISOString().slice(0, 10)}.pdf`);
}
