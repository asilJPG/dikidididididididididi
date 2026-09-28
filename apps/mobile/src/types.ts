export interface Service {
  id: string;
  nameRu: string;
  durationMinutes: number;
  price: number;
}

export interface Staff {
  id: string;
  fullName: string;
  specialty: string;
  avatarUrl?: string | null;
  commissionPercent: number;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  notes?: string | null;
  totalVisits: number;
  totalSpent: number;
}

export interface Appointment {
  id: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  startDateTime: string;
  endDateTime: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  price: number;
  clientName: string;
  clientPhone: string;
  clientComment?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  staff: Staff;
  service: Service;
  customer?: Customer;
}

export interface Category {
  id: string;
  nameRu: string;
  nameUz?: string;
  icon?: string;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  services: Service[];
  staff: Staff[];
  categories?: Category[];
}

export interface Appointment {
  id: string;
  salonId: string;
  staffId: string;
  serviceId: string;
  startDateTime: string;
  endDateTime: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  price: number;
  clientName: string;
  clientPhone: string;
  clientComment?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  staff: Staff;
  service: Service;
  customer?: Customer;
  salon?: Salon;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  ownedSalons?: Salon[];
  staffProfile?: Staff & { salon?: Salon };
}

export type AppMode = "client" | "business";
