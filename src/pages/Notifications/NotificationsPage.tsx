import { useEffect, useState } from 'react';
import { Bell, Wrench, Calendar, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../data/api';
import { useGym } from '../../contexts/GymContext';
import type { AppNotification, NotificationType } from '../../types/notification';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  maintenance_alert:      { icon: Wrench,        color: 'text-[#FF453A]', bg: 'bg-[#FF453A]/10' },
  reservation_confirmation: { icon: Calendar,    color: 'text-[#7BFF00]', bg: 'bg-[#7BFF00]/10' },
  system_alert:           { icon: AlertTriangle, color: 'text-[#FF9F0A]', bg: 'bg-[#FF9F0A]/10' },
  low_occupancy_warning:  { icon: Info,          color: 'text-[#0A84FF]', bg: 'bg-[#0A84FF]/10' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

export default function NotificationsPage() {
  const { currentGym } = useGym();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!currentGym?.id) return;
    setLoading(true);
    getNotifications(currentGym.id).then(n => { setNotifications(n); setLoading(false); });
  };

  useEffect(() => { load(); }, [currentGym?.id]);

  const handleRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAll = async () => {
    if (!currentGym?.id) return;
    await markAllNotificationsRead(currentGym.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl text-white leading-none">Notificaciones</h1>
          <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case font-normal">
            {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={handleMarkAll}>
            <CheckCheck size={16} /> Marcar todas como leídas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-[#1C1C1E] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={48} className="text-[#3C3C3E] mb-4" />
          <p className="text-white font-medium text-lg">Sin notificaciones</p>
          <p className="text-sm text-[#8E8E93] mt-2">Te avisaremos aquí cuando haya novedades.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type];
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && handleRead(n.id)}
                className={[
                  'flex items-start gap-4 p-4 rounded-2xl border transition-colors',
                  n.read
                    ? 'border-[#2C2C2E] bg-transparent'
                    : 'border-[#3C3C3E] bg-[#1C1C1E] cursor-pointer hover:bg-[#2C2C2E]/50',
                ].join(' ')}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${n.read ? 'text-[#8E8E93]' : 'text-white'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-[#636366] whitespace-nowrap flex-shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#636366] mt-0.5 leading-relaxed">{n.message}</p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-[#7BFF00] flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
