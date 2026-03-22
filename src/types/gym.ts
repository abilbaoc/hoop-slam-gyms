export interface GymOpeningHours {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  timezone: string;
  phone: string;
  email: string;
  openingHours: GymOpeningHours;
  courts: string[];
  createdAt: string;
}
