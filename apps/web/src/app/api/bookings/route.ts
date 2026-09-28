import { NextResponse } from "next/server";
import { prisma, BookingStatus, BookingSource, PaymentStatus } from "@dikidi/database";
import { sendTelegramBookingNotice } from "@/lib/telegram";
import { parseTashkentDateTime } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salonSlug,
      serviceId,
      staffId,
      date, // YYYY-MM-DD
      time, // HH:MM
      clientName,
      clientPhone,
      clientComment,
      telegramId,
      telegramChatId,
      telegramUsername,
      source = BookingSource.ONLINE_WIDGET,
    } = body;

    if (!salonSlug || !serviceId || !staffId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: "Пожалуйста, заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const salon = await prisma.salon.findUnique({
      where: { slug: salonSlug },
      include: { services: true, staff: true },
    });

    if (!salon) {
      return NextResponse.json({ error: "Салон не найден" }, { status: 404 });
    }

    const service = salon.services.find((s: any) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    // Если staffId === 'any', берем первого подходящего мастера
    let chosenStaff = salon.staff.find((st: any) => st.id === staffId);
    if (staffId === "any" || !chosenStaff) {
      chosenStaff = salon.staff.find((st: any) => st.isActive) || salon.staff[0];
    }

    const chosenStaffId = chosenStaff.id;

    // Рассчитываем точное время начала и окончания по часовому поясу Ташкента
    const startDateTime = parseTashkentDateTime(date, time);
    const endDateTime = new Date(startDateTime.getTime() + service.durationMinutes * 60 * 1000);

    // Проверяем на конфликт (Overbooking prevention)
    const conflict = await prisma.appointment.findFirst({
      where: {
        staffId: chosenStaffId,
        status: { notIn: ["CANCELLED"] },
        OR: [
          {
            startDateTime: { lte: startDateTime },
            endDateTime: { gt: startDateTime },
          },
          {
            startDateTime: { lt: endDateTime },
            endDateTime: { gte: endDateTime },
          },
          {
            startDateTime: { gte: startDateTime },
            endDateTime: { lte: endDateTime },
          },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "К сожалению, этот интервал времени уже занят. Пожалуйста, выберите другое время." },
        { status: 409 }
      );
    }

    // Находим или создаем клиента в CRM салона, сохраняя Telegram данные
    let customer = await prisma.customer.findUnique({
      where: {
        salonId_phone: {
          salonId: salon.id,
          phone: clientPhone,
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          salonId: salon.id,
          phone: clientPhone,
          fullName: clientName,
          telegramId: telegramId ? String(telegramId) : null,
          telegramChatId: telegramChatId ? String(telegramChatId) : null,
          telegramUsername: telegramUsername || null,
          totalVisits: 1,
          totalSpent: service.price,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalVisits: customer.totalVisits + 1,
          totalSpent: customer.totalSpent + service.price,
          ...(telegramId ? { telegramId: String(telegramId) } : {}),
          ...(telegramChatId ? { telegramChatId: String(telegramChatId) } : {}),
          ...(telegramUsername ? { telegramUsername } : {}),
        },
      });
    }

    // Создаем запись
    const appointment = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        staffId: chosenStaffId,
        serviceId: service.id,
        customerId: customer.id,
        startDateTime,
        endDateTime,
        status: BookingStatus.PENDING,
        source: telegramChatId ? BookingSource.TELEGRAM_BOT : source,
        price: service.price,
        paymentStatus: PaymentStatus.UNPAID,
        clientName,
        clientPhone,
        clientComment,
      },
      include: {
        staff: true,
        service: true,
        salon: true,
      },
    });

    // Если есть Telegram Chat ID — отправляем уведомление прямо в Telegram
    const targetChatId = telegramChatId || customer.telegramChatId;
    if (targetChatId) {
      sendTelegramBookingNotice(targetChatId, {
        salonName: salon.name,
        serviceName: service.nameRu,
        masterName: chosenStaff.fullName,
        dateTime: `${date} в ${time}`,
        price: service.price,
        address: salon.address,
      }).catch((e) => console.error("Telegram notify failed:", e));
    }

    return NextResponse.json({
      success: true,
      appointment,
      message: "Запись успешно оформлена!",
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Произошла ошибка при бронировании" },
      { status: 500 }
    );
  }
}
