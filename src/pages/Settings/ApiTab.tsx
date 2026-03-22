import { useState } from 'react';
import Card from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Copy, Eye, EyeOff } from 'lucide-react';

const endpoints = [
  { method: 'GET', path: '/api/v1/courts', description: 'Listar canchas del gimnasio' },
  { method: 'GET', path: '/api/v1/courts/:id', description: 'Detalle de una cancha' },
  { method: 'GET', path: '/api/v1/matches', description: 'Historial de partidos' },
  { method: 'GET', path: '/api/v1/players', description: 'Listar jugadores' },
  { method: 'GET', path: '/api/v1/analytics/kpis', description: 'KPIs en tiempo real' },
  { method: 'POST', path: '/api/v1/reservations', description: 'Crear reserva' },
  { method: 'DELETE', path: '/api/v1/reservations/:id', description: 'Cancelar reserva' },
  { method: 'GET', path: '/api/v1/maintenance', description: 'Tickets de mantenimiento' },
  { method: 'POST', path: '/api/v1/maintenance', description: 'Crear ticket' },
  { method: 'GET', path: '/api/v1/webhooks', description: 'Listar webhooks configurados' },
  { method: 'POST', path: '/api/v1/webhooks', description: 'Registrar webhook' },
];

const methodColors: Record<string, string> = {
  GET: 'text-green-400',
  POST: 'text-blue-400',
  PUT: 'text-yellow-400',
  DELETE: 'text-red-400',
};

export default function ApiTab() {
  const [showKey, setShowKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const apiKey = 'hoop_sk_live_7f3a9b2c4d5e6f1a8b9c0d1e2f3a4b5c';

  const inputClass = 'w-full bg-[#2C2C2E] text-white text-sm rounded-xl px-4 py-2.5 border border-[#2C2C2E] outline-none focus:border-[#7BFF00] placeholder-[#636366]';

  return (
    <div className="space-y-6">
      {/* API Key */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-3">API Key</h3>
        <p className="text-xs text-[#8E8E93] mb-3">
          Usa esta clave para autenticar las peticiones a la API REST de Hoop Slam.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#2C2C2E] rounded-xl px-4 py-2.5 text-sm font-mono text-white border border-[#2C2C2E]">
            {showKey ? apiKey : '\u2022'.repeat(40)}
          </div>
          <button
            onClick={() => setShowKey(!showKey)}
            className="p-2.5 rounded-xl bg-[#2C2C2E] text-[#8E8E93] hover:text-white transition-colors"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(apiKey)}
            className="p-2.5 rounded-xl bg-[#2C2C2E] text-[#8E8E93] hover:text-white transition-colors"
          >
            <Copy size={16} />
          </button>
        </div>
      </Card>

      {/* Endpoints */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-3">Endpoints REST</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2C2C2E]">
                <th className="text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wider px-4 py-2">Metodo</th>
                <th className="text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wider px-4 py-2">Ruta</th>
                <th className="text-left text-xs font-medium text-[#8E8E93] uppercase tracking-wider px-4 py-2">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, i) => (
                <tr key={i} className="border-b border-[#2C2C2E] last:border-0">
                  <td className={`px-4 py-2 text-xs font-mono font-bold ${methodColors[ep.method] || 'text-white'}`}>
                    {ep.method}
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-white">{ep.path}</td>
                  <td className="px-4 py-2 text-xs text-[#8E8E93]">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Webhooks */}
      <Card>
        <h3 className="text-sm font-medium text-white mb-3">Webhooks</h3>
        <p className="text-xs text-[#8E8E93] mb-3">
          Configura una URL para recibir notificaciones en tiempo real sobre eventos del sistema.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className={inputClass}
            placeholder="https://tu-servidor.com/webhook"
          />
          <Button size="sm" disabled={!webhookUrl.trim()}>Guardar</Button>
        </div>
        <div className="mt-3 text-xs text-[#636366]">
          Eventos soportados: match.started, match.ended, court.status_changed, maintenance.created
        </div>
      </Card>
    </div>
  );
}
