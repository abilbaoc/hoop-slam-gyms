import { useState } from 'react';
import { Clock, DollarSign, Calendar, Code, Bell } from 'lucide-react';
import ScheduleTab from './ScheduleTab';
import PricingTab from './PricingTab';
import ReservationsTab from './ReservationsTab';
import ApiTab from './ApiTab';
import PushNotificationsTab from './PushNotificationsTab';

const tabs = [
  { id: 'horarios', label: 'Horarios', icon: Clock },
  { id: 'precios', label: 'Precios', icon: DollarSign },
  { id: 'reservas', label: 'Reservas', icon: Calendar },
  { id: 'api', label: 'API', icon: Code },
  { id: 'push', label: 'Push', icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('horarios');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl text-white leading-none">Configuracion</h1>
        <p className="text-[#8E8E93] text-sm mt-1 font-['Poppins'] normal-case not-italic font-normal">Gestion operativa de tus canchas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#2C2C2E]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-white border-[#7BFF00]'
                : 'text-[#8E8E93] border-transparent hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'horarios' && <ScheduleTab />}
      {activeTab === 'precios' && <PricingTab />}
      {activeTab === 'reservas' && <ReservationsTab />}
      {activeTab === 'api' && <ApiTab />}
      {activeTab === 'push' && <PushNotificationsTab />}
    </div>
  );
}
