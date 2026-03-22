import ReservationsTab from '../Settings/ReservationsTab';

export default function ReservationsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reservas</h1>
        <p className="text-sm text-[#8E8E93]">Gestiona las reservas y bloqueos de tus canchas</p>
      </div>

      {/* Reuse existing reservations tab component */}
      <ReservationsTab />
    </div>
  );
}
