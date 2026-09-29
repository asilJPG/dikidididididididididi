import { NextResponse } from "next/server";
import { prisma, BookingStatus, BookingSource, PaymentMethod, PaymentStatus } from "@dikidi/database";
import { getTashkentDayRange, parseTashkentDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const clientPhone = searchParams.get("clientPhone") || searchParams.get("phone");
    const staffId = searchParams.get("staffId");

    let whereClause: any = {};

    if (salonId) {
      whereClause.salonId = salonId;
    }

    if (clientPhone) {
      whereClause.clientPhone = clientPhone;
    }

    if (staffId && staffId !== "all") {
      whereClause.staffId = staffId;
    }

    if (dateStr) {
      const { startOfDay, endOfDay } = getTashkentDayRange(dateStr);
      whereClause.startDateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        staff: true,
        service: true,
        customer: true,
        salon: true,
      },
      orderBy: {
        startDateTime: "desc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Appointments fetch error:", error);
    return NextResponse.json({ error: "Ошибка загрузки записей" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentStatus, paymentMethod, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID записи обязателен" }, { status: 400 });
    }

    const currentAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { customer: true, service: true },
    });

    if (!currentAppt) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    let nextPaymentStatus = paymentStatus;
    if (nextPaymentStatus === undefined) {
      if (status === "COMPLETED") {
        nextPaymentStatus = "PAID";
      } else if (status === "CANCELLED" || status === "NO_SHOW") {
        nextPaymentStatus = "UNPAID";
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(nextPaymentStatus !== undefined ? { paymentStatus: nextPaymentStatus } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
        ...(notes !== undefined ? { clientComment: notes } : {}),
      },
      include: {
        staff: true,
        service: true,
        customer: true,
      },
    });

    // Синхронизация статистики клиента
    if (updated.customerId) {
      const completedCount = await prisma.appointment.count({
        where: {
          customerId: updated.customerId,
          status: "COMPLETED",
        },
      });

      const completedSum = await prisma.appointment.aggregate({
        where: {
          customerId: updated.customerId,
          status: "COMPLETED",
        },
        _sum: {
          price: true,
        },
      });

      await prisma.customer.update({
        where: { id: updated.customerId },
        data: {
          totalVisits: completedCount,
          totalSpent: completedSum._sum.price || 0,
        },
      });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("Appointment update error:", error);
    return NextResponse.json({ error: "Ошибка обновления записи" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salonId,
      staffId,
      serviceId,
      date, // YYYY-MM-DD
      time, // HH:MM
      clientName,
      clientPhone,
      clientComment,
      paymentMethod = PaymentMethod.CASH,
    } = body;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    const digitsOnly = clientPhone.replace(/\D/g, "");
    const cleanPhone = digitsOnly.startsWith("998") ? `+${digitsOnly}` : `+998${digitsOnly.slice(-9)}`;

    const startDateTime = parseTashkentDateTime(date, time);
    const endDateTime = new Date(startDateTime.getTime() + service.durationMinutes * 60 * 1000);

    // Добавляем или обновляем клиента
    let customer = await prisma.customer.findUnique({
      where: {
        salonId_phone: {
          salonId,
          phone: cleanPhone,
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          salonId,
          phone: cleanPhone,
          fullName: clientName,
          totalVisits: 0,
          totalSpent: 0,
        },
      });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        salonId,
        staffId,
        serviceId,
        customerId: customer.id,
        startDateTime,
        endDateTime,
        status: BookingStatus.CONFIRMED,
        source: BookingSource.MANUAL_ADMIN,
        price: service.price,
        paymentStatus: PaymentStatus.UNPAID,
        paymentMethod,
        clientName,
        clientPhone,
        clientComment,
      },
      include: {
        staff: true,
        service: true,
        customer: true,
      },
    });

    return NextResponse.json({ appointment: newAppointment });
  } catch (error) {
    console.error("Manual appointment creation error:", error);
    return NextResponse.json({ error: "Ошибка создания записи" }, { status: 500 });
  }
}
