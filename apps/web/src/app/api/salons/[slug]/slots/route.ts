import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";
import { getTashkentDayRange, getTashkentDayMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");

    if (!dateStr || !serviceId) {
      return NextResponse.json(
        { error: "Необходимы параметры date и serviceId" },
        { status: 400 }
      );
    }

    const salon = await prisma.salon.findUnique({
      where: { slug },
      include: {
        services: true,
        staff: {
          include: {
            staffServices: true,
            schedules: {
              include: { breaks: true },
            },
          },
        },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Салон не найден" }, { status: 404 });
    }

    const service = salon.services.find((s: any) => s.id === serviceId);
    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    // Целевая дата: парсим корректно день недели
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dayOfWeek = targetDate.getUTCDay(); // 0 - воскресенье, 1..6

    // Мастера, способные оказать эту услугу
    let eligibleStaff = salon.staff.filter((st: any) =>
      st.staffServices?.some((ss: any) => ss.serviceId === serviceId)
    );

    // Если у услуги еще нет персональных привязок, ее могут оказывать все активные мастера салона
    if (eligibleStaff.length === 0) {
      eligibleStaff = salon.staff.filter((st: any) => st.isActive !== false);
    }

    if (staffId && staffId !== "any") {
      eligibleStaff = eligibleStaff.filter((st: any) => st.id === staffId);
    }

    if (eligibleStaff.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Текущее время в Ташкенте для отсечения уже прошедших слотов сегодняшнего дня
    const nowInTashkent = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tashkent",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()); // "YYYY-MM-DD"
    const isToday = dateStr === nowInTashkent;
    const currentTashkentMinutes = isToday ? getTashkentDayMinutes(new Date()) : -1;

    // Начало и конец суток по Ташкенту
    const { startOfDay, endOfDay } = getTashkentDayRange(dateStr);

    // Получаем существующие записи
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        salonId: salon.id,
        staffId: { in: eligibleStaff.map((s: any) => s.id) },
        startDateTime: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED"] },
      },
    });

    const durationMin = service.durationMinutes || 45;
    const availableSlotsMap = new Map<string, string[]>(); // time "11:00" -> staffIds[]

    for (const master of eligibleStaff) {
      let schedule: any = master.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);

      // Если в БД еще нет сохраненного расписания для этого дня — используем стандартный рабочий график:
      // Пн-Сб: 09:00 - 20:00, Вс: 10:00 - 18:00
      if (!schedule) {
        schedule = {
          dayOfWeek,
          startTime: dayOfWeek === 0 ? "10:00" : "09:00",
          endTime: dayOfWeek === 0 ? "18:00" : "20:00",
          isDayOff: false,
          breaks: [],
        };
      }

      if (schedule.isDayOff) {
        continue;
      }

      const [startH, startM] = schedule.startTime.split(":").map(Number);
      const [endH, endM] = schedule.endTime.split(":").map(Number);

      const workStartMinutes = startH * 60 + startM;
      const workEndMinutes = endH * 60 + endM;

      // Массив перерывов
      const breakIntervals = (schedule.breaks || []).map((b: any) => {
        const [bh1, bm1] = b.startTime.split(":").map(Number);
        const [bh2, bm2] = b.endTime.split(":").map(Number);
        return { start: bh1 * 60 + bm1, end: bh2 * 60 + bm2 };
      });

      // Записи мастера по времени Ташкента
      const masterAppts = existingAppointments.filter((a: any) => a.staffId === master.id);
      const apptIntervals = masterAppts.map((a: any) => {
        return {
          start: getTashkentDayMinutes(a.startDateTime),
          end: getTashkentDayMinutes(a.endDateTime),
        };
      });

      // Проверяем слоты с шагом 30 минут
      for (let min = workStartMinutes; min + durationMin <= workEndMinutes; min += 30) {
        const slotStart = min;
        const slotEnd = min + durationMin;

        // Если это сегодняшний день, не предлагаем слоты, которые уже начались или начнутся менее чем через 15 минут
        if (isToday && slotStart <= currentTashkentMinutes + 15) {
          continue;
        }

        // Проверка на пересечение с перерывами
        const hasBreakConflict = breakIntervals.some(
          (b: any) => slotStart < b.end && slotEnd > b.start
        );
        if (hasBreakConflict) continue;

        // Проверка на пересечение с существующими записями
        const hasApptConflict = apptIntervals.some(
          (a: any) => slotStart < a.end && slotEnd > a.start
        );
        if (hasApptConflict) continue;

        const h = Math.floor(slotStart / 60)
          .toString()
          .padStart(2, "0");
        const m = (slotStart % 60).toString().padStart(2, "0");
        const timeKey = `${h}:${m}`;

        const currentStaffIds = availableSlotsMap.get(timeKey) || [];
        currentStaffIds.push(master.id);
        availableSlotsMap.set(timeKey, currentStaffIds);
      }
    }

    const sortedSlots = Array.from(availableSlotsMap.keys())
      .sort()
      .map((time) => ({
        time,
        availableStaffIds: availableSlotsMap.get(time) || [],
      }));

    return NextResponse.json({ slots: sortedSlots });
  } catch (error) {
    console.error("Error calculating slots:", error);
    return NextResponse.json(
      { error: "Ошибка расчета слотов" },
      { status: 500 }
    );
  }
}
