export interface OnboardingGym {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export interface OnboardingHours {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
}

export interface OnboardingCourt {
  name: string;
  location: string;
}

export interface OnboardingData {
  gym: OnboardingGym;
  hours: OnboardingHours;
  court: OnboardingCourt;
}

export const DEFAULT_ONBOARDING: OnboardingData = {
  gym: { name: '', address: '', city: '', phone: '', email: '' },
  hours: { weekdayOpen: '08:00', weekdayClose: '22:00', weekendOpen: '09:00', weekendClose: '21:00' },
  court: { name: '', location: '' },
};
