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

    // Целевая дата
    const targetDate = new Date(dateStr + "T00:00:00");
    const dayOfWeek = targetDate.getDay(); // 0-6

    // Мастера, способные оказать эту услугу
    let eligibleStaff = salon.staff.filter((st: any) =>
      st.staffServices?.some((ss: any) => ss.serviceId === serviceId)
    );

    if (staffId && staffId !== "any") {
      eligibleStaff = eligibleStaff.filter((st: any) => st.id === staffId);
    }

    if (eligibleStaff.length === 0) {
      return NextResponse.json({ slots: [] });
    }

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

    const durationMin = service.durationMinutes;
    const availableSlotsMap = new Map<string, string[]>(); // time "11:00" -> staffIds[]

    for (const master of eligibleStaff) {
      const schedule = master.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
      if (!schedule || schedule.isDayOff) {
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
