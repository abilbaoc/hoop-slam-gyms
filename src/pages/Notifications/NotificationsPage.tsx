import { useState, useEffect, useMemo } from 'react';
import { Wrench, CalendarCheck, AlertTriangle, TrendingDown, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AppNotification, NotificationType } from '../../types/notification';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';

const filterTabs = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'No leidas' },
  { id: 'maintenance', label: 'Mantenimiento' },
  { id: 'reservation', label: 'Reservas' },
  { id: 'system', label: 'Sistema' },
];

const typeIconMap: Record<NotificationType, typeof Wrench> = {
  maintenance_alert: Wrench,
  reservation_confirmation: CalendarCheck,
  system_alert: AlertTriangle,
  low_occupancy_warning: TrendingDown,
};

const typeFilterMap: Record<string, NotificationType[]> = {
  maintenance: ['maintenance_alert'],
  reservation: ['reservation_confirmation'],
  system: ['system_alert', 'low_occupancy_warning'],
};

export default function NotificationsPage() {
  const { currentGym } = useGym();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (currentGym) {
      getNotifications(currentGym.id).then(setNotifications);
    }
  }, [currentGym]);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    const types = typeFilterMap[filter];
    if (types) return notifications.filter((n) => types.includes(n.type));
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!currentGym) return;
    await markAllNotificationsRead(currentGym.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Todas las notificaciones marcadas como leidas');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <p className="text-sm text-[#8E8E93]">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck size={16} />
            Marcar todo como leido
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.map((notif) => {
          const Icon = typeIconMap[notif.type];
          return (
            <Card
              key={notif.id}
              hover
              onClick={() => !notif.read && handleMarkRead(notif.id)}
              className={`flex items-start gap-4 ${
                !notif.read ? 'border-l-2 border-l-[#7BFF00]' : ''
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Icon size={18} className={!notif.read ? 'text-[#7BFF00]' : 'text-[#8E8E93]'} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-[#8E8E93]'}`}>
                  {notif.title}
                </p>
                <p className="text-xs text-[#636366] leading-relaxed">{notif.message}</p>
                <p className="text-xs text-[#636366]">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#7BFF00] flex-shrink-0 mt-2" />
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#8E8E93]">No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}
