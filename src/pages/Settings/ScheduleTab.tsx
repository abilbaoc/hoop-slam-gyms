import { useState, useEffect } from 'react';
import type { Court } from '../../types/court';
import type { CourtSchedule, ScheduleException } from '../../types/config';
import { getCourts, getSchedules, getScheduleExceptions } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import Card from '../../components/ui/Card';
import ScheduleCourtCard from './ScheduleCourtCard';
import ScheduleWeeklyView from './ScheduleWeeklyView';
import ScheduleExceptionModal from './ScheduleExceptionModal';

export default function ScheduleTab() {
  const { currentGym } = useGym();
  const [schedules, setSchedules] = useState<CourtSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionCourtId, setExceptionCourtId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [courtsData, schedulesData, exceptionsData] = await Promise.all([
        getCourts(currentGym?.id),
        getSchedules(currentGym?.id),
        getScheduleExceptions(currentGym?.id),
      ]);
      setCourts(courtsData);
      setSchedules(schedulesData);
      setExceptions(exceptionsData);
      if (courtsData.length > 0) {
        setSelectedCourtId(courtsData[0].id);
      }
    }
    fetchData();
  }, [currentGym?.id]);

  const handleScheduleChange = (updated: CourtSchedule) => {
    setSchedules((prev) =>
      prev.map((s) => (s.courtId === updated.courtId ? updated : s)),
    );
  };

  const handleAddException = (courtId: string) => {
    setExceptionCourtId(courtId);
    setShowExceptionModal(true);
  };

  const handleRemoveException = (id: string) => {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSaveException = (
    exc: Omit<ScheduleException, 'id' | 'courtId'>,
  ) => {
    if (!exceptionCourtId) return;

    const newException: ScheduleException = {
      ...exc,
      id: `exc-${Date.now()}`,
      courtId: exceptionCourtId,
    };
    setExceptions((prev) => [...prev, newException]);
    setShowExceptionModal(false);
    setExceptionCourtId(null);
  };

  const activeCourts = schedules.filter((s) => s.isOpen).length;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekExceptions = exceptions.filter((e) => {
    const d = new Date(e.date);
    return d >= weekStart && d <= weekEnd;
  });

  const exceptionCourtName =
    courts.find((c) => c.id === exceptionCourtId)?.name ?? '';

  return (
    <div className="flex flex-col gap-6">
      {/* Stats bar */}
      <div className="flex gap-4">
        <Card className="flex-1">
          <p className="text-xs text-[#8E8E93] mb-1">Canchas activas</p>
          <p className="text-xl font-bold text-[#7BFF00]">{activeCourts}</p>
        </Card>
        <Card className="flex-1">
          <p className="text-xs text-[#8E8E93] mb-1">Excepciones esta semana</p>
          <p className="text-xl font-bold text-white">{weekExceptions.length}</p>
        </Card>
      </div>

      {/* Court cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {courts.map((court) => {
          const schedule = schedules.find((s) => s.courtId === court.id);
          const courtExceptions = exceptions.filter(
            (e) => e.courtId === court.id,
          );

          if (!schedule) return null;

          return (
            <ScheduleCourtCard
              key={court.id}
              court={court}
              schedule={schedule}
              exceptions={courtExceptions}
              onScheduleChange={handleScheduleChange}
              onAddException={() => handleAddException(court.id)}
              onRemoveException={handleRemoveException}
            />
          );
        })}
      </div>

      {/* Weekly view */}
      {courts.length > 0 && selectedCourtId && (
        <ScheduleWeeklyView
          schedules={schedules}
          courts={courts}
          selectedCourtId={selectedCourtId}
          onCourtChange={setSelectedCourtId}
        />
      )}

      {/* Exception modal */}
      <ScheduleExceptionModal
        open={showExceptionModal}
        courtName={exceptionCourtName}
        onSave={handleSaveException}
        onClose={() => {
          setShowExceptionModal(false);
          setExceptionCourtId(null);
        }}
      />
    </div>
  );
}
