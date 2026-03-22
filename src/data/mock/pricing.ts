import type { PricingRule, Promo } from '../../types';

export const pricingRules: PricingRule[] = [
  // gym-001
  { id: 'price-base-1', gymId: 'gym-001', name: 'Tarifa base', type: 'base', priceEur: 5, startHour: 8, endHour: 22 },
  { id: 'price-peak-1', gymId: 'gym-001', name: 'Hora pico', type: 'peak', priceEur: 7, startHour: 17, endHour: 21, daysOfWeek: [0, 1, 2, 3, 4] },
  { id: 'price-offpeak-1', gymId: 'gym-001', name: 'Hora valle', type: 'offpeak', priceEur: 3, startHour: 8, endHour: 12, daysOfWeek: [0, 1, 2, 3, 4] },
  { id: 'price-weekend-1', gymId: 'gym-001', name: 'Fin de semana', type: 'weekend', priceEur: 6, startHour: 8, endHour: 22, daysOfWeek: [5, 6] },
  // gym-002
  { id: 'price-base-2', gymId: 'gym-002', name: 'Tarifa base', type: 'base', priceEur: 6, startHour: 7, endHour: 23 },
  { id: 'price-peak-2', gymId: 'gym-002', name: 'Hora pico', type: 'peak', priceEur: 9, startHour: 18, endHour: 22, daysOfWeek: [0, 1, 2, 3, 4] },
  { id: 'price-weekend-2', gymId: 'gym-002', name: 'Fin de semana', type: 'weekend', priceEur: 8, startHour: 8, endHour: 22, daysOfWeek: [5, 6] },
  // gym-003
  { id: 'price-base-3', gymId: 'gym-003', name: 'Tarifa base', type: 'base', priceEur: 4, startHour: 6, endHour: 22 },
  { id: 'price-peak-3', gymId: 'gym-003', name: 'Hora pico', type: 'peak', priceEur: 6, startHour: 17, endHour: 21, daysOfWeek: [0, 1, 2, 3, 4] },
  { id: 'price-offpeak-3', gymId: 'gym-003', name: 'Hora valle', type: 'offpeak', priceEur: 2, startHour: 6, endHour: 10, daysOfWeek: [0, 1, 2, 3, 4] },
];

export const promos: Promo[] = [
  // gym-001
  { id: 'promo-1', gymId: 'gym-001', name: 'Primera reserva gratis', type: 'free', value: 0, conditions: 'Solo para nuevos jugadores', startDate: '2026-01-01', endDate: '2026-12-31', active: true },
  { id: 'promo-2', gymId: 'gym-001', name: '20% descuento martes', type: 'percentage', value: 20, conditions: 'Valido todos los martes', startDate: '2026-01-01', endDate: '2026-06-30', active: true },
  // gym-002
  { id: 'promo-3', gymId: 'gym-002', name: 'Happy Hour 15-17h', type: 'fixed', value: 2, conditions: 'Descuento de 2 EUR entre 15:00 y 17:00', startDate: '2026-03-01', endDate: '2026-04-30', active: true },
  { id: 'promo-4', gymId: 'gym-002', name: 'Pack 10 partidos', type: 'percentage', value: 15, conditions: 'Al comprar pack de 10 reservas', startDate: '2026-01-01', endDate: '2026-02-28', active: false },
  // gym-003
  { id: 'promo-5', gymId: 'gym-003', name: 'Verano 2026', type: 'percentage', value: 10, conditions: 'Descuento de verano en todas las franjas', startDate: '2026-06-01', endDate: '2026-09-30', active: false },
];
