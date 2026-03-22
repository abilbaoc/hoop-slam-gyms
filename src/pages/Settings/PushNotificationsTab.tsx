import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Zap, AlertTriangle, Calendar } from 'lucide-react';
import type { ReactNode } from 'react';

interface NotificationToggle {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  defaultOn: boolean;
}

const notificationTypes: NotificationToggle[] = [
  { id: 'match_events', label: 'Eventos de partido', description: 'Notificar cuando un partido inicia o finaliza', icon: <Zap size={18} />, defaultOn: true },
  { id: 'maintenance_alerts', label: 'Alertas de mantenimiento', description: 'Notificar tickets criticos y cambios de estado', icon: <AlertTriangle size={18} />, defaultOn: true },
  { id: 'reservation_updates', label: 'Actualizaciones de reserva', description: 'Notificar nuevas reservas y cancelaciones', icon: <Calendar size={18} />, defaultOn: false },
  { id: 'system_alerts', label: 'Alertas del sistema', description: 'Sensores offline, bateria baja, errores de firmware', icon: <Bell size={18} />, defaultOn: true },
];

export default function PushNotificationsTab() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(notificationTypes.map((n) => [n.id, n.defaultOn]))
  );
  const [fcmKey, setFcmKey] = useState('');
  const [testSent, setTestSent] = useState(false);

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  return (
    <div className="space-y-6">
      {/* Notification toggles */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-4">Tipos de notificacion</h3>
        <div className="space-y-4">
          {notificationTypes.map((nt) => (
            <div key={nt.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-[#8E8E93]">{nt.icon}</div>
                <div>
                  <p className="text-sm text-white">{nt.label}</p>
                  <p className="text-xs text-[#636366]">{nt.description}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle(nt.id)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  toggles[nt.id] ? 'bg-[#7BFF00]' : 'bg-[#2C2C2E]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    toggles[nt.id] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* FCM Configuration */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-3">Firebase Cloud Messaging (FCM)</h3>
        <p className="text-xs text-[#8E8E93] mb-3">
          Ingresa tu Server Key de FCM para habilitar notificaciones push en dispositivos moviles.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={fcmKey}
            onChange={(e) => setFcmKey(e.target.value)}
            className={inputClass}
            placeholder="AAAA...:APA91b..."
          />
          <Button size="sm" disabled={!fcmKey.trim()}>Guardar</Button>
        </div>
      </Card>

      {/* Test notification */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-3">Prueba de notificacion</h3>
        <p className="text-xs text-[#8E8E93] mb-3">
          Envia una notificacion de prueba para verificar la configuracion.
        </p>
        <Button variant="secondary" onClick={handleTest}>
          {testSent ? 'Enviada!' : 'Enviar notificacion de prueba'}
        </Button>
      </Card>
    </div>
  );
}
