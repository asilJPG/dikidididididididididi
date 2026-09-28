import { API_BASE_URL } from "../config";
import { Appointment, Salon, Customer } from "../types";

export const api = {
  // Получение салонов
  getSalons: async (): Promise<Salon[]> => {
    const res = await fetch(`${API_BASE_URL}/api/salons`);
    const data = await res.json();
    return data.salons || [];
  },

  // Получение деталей конкретного салона
  getSalonBySlug: async (slug: string): Promise<Salon | null> => {
    const res = await fetch(`${API_BASE_URL}/api/salons/${slug}`);
    const data = await res.json();
    return data.salon || null;
  },

  // Получение записей на выбранную дату
  getAppointments: async (
    salonId: string,
    date: string,
    staffId: string = "all"
  ): Promise<Appointment[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/appointments?salonId=${salonId}&date=${date}&staffId=${staffId}`
    );
    const data = await res.json();
    return data.appointments || [];
  },

  // Обновление статуса записи
  updateAppointmentStatus: async (
    id: string,
    status: string,
    paymentStatus?: string
  ): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, paymentStatus }),
    });
    return res.ok;
  },

  // Создание новой записи вручную
  createAppointment: async (payload: {
    salonId: string;
    staffId: string;
    serviceId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientComment?: string;
  }): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  },

  // Получение клиентов
  getCustomers: async (salonId: string, query: string = ""): Promise<Customer[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/customers?salonId=${salonId}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return data.customers || [];
  },

  // Получение записей клиента по номеру телефона
  getClientAppointments: async (phone: string): Promise<Appointment[]> => {
    const cleanPhone = phone.replace(/\s+/g, "");
    const res = await fetch(
      `${API_BASE_URL}/api/appointments?clientPhone=${encodeURIComponent(cleanPhone)}`
    );
    const data = await res.json();
    return data.appointments || [];
  },

  // Получение доступных слотов для онлайн-записи
  getAvailableSlots: async (
    salonSlug: string,
    serviceId: string,
    date: string,
    staffId: string = "any"
  ): Promise<{ time: string; availableStaffIds: string[] }[]> => {
    const res = await fetch(
      `${API_BASE_URL}/api/salons/${salonSlug}/slots?date=${date}&serviceId=${serviceId}&staffId=${staffId}`
    );
    const data = await res.json();
    return data.slots || [];
  },

  // Оформление клиентской брони
  bookAppointment: async (payload: {
    salonSlug: string;
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientComment?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Отмена записи клиентом
  cancelAppointment: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "CANCELLED" }),
    });
    return res.ok;
  },

  // Отправка OTP кода
  sendAuthCode: async (phone: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  // Проверка OTP кода
  verifyAuthCode: async (phone: string, code: string, fullName?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, fullName }),
    });
    return res.json();
  },

  // Вход для верифицированного бизнеса по логину и паролю
  businessLogin: async (login: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/business-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    return res.json();
  },

  // Отправка заявки на подключение бизнеса с видео-подтверждением
  submitBusinessApplication: async (payload: {
    phone: string;
    salonName: string;
    category: string;
    address: string;
    videoName: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/business/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

