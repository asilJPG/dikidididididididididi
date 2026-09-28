import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

const DEFAULT_DAYS = [
  { dayOfWeek: 1, name: "Понедельник", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 2, name: "Вторник", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 3, name: "Среда", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 4, name: "Четверг", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 5, name: "Пятница", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 6, name: "Суббота", startTime: "10:00", endTime: "18:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 0, name: "Воскресенье", startTime: "10:00", endTime: "18:00", isDayOff: true, breakStart: "13:00", breakEnd: "14:00" },
];

export async function GET(
  request: Request,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params;

    const schedules = await prisma.schedule.findMany({
      where: { staffId },
      include: { breaks: true },
      orderBy: { dayOfWeek: "asc" },
    });

    if (schedules.length === 0) {
      return NextResponse.json({ schedules: DEFAULT_DAYS });
    }

    const formatted = DEFAULT_DAYS.map((def) => {
      const found = schedules.find((s) => s.dayOfWeek === def.dayOfWeek);
      if (found) {
        const brk = found.breaks[0];
        return {
          dayOfWeek: found.dayOfWeek,
          name: def.name,
          startTime: found.startTime,
          endTime: found.endTime,
          isDayOff: found.isDayOff,
          breakStart: brk?.startTime || "13:00",
          breakEnd: brk?.endTime || "14:00",
        };
      }
      return def;
    });

    return NextResponse.json({ schedules: formatted });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Ошибка получения графика" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params;
    const body = await request.json();
    const { schedules } = body;

    if (!Array.isArray(schedules)) {
      return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
    }

    for (const item of schedules) {
      const { dayOfWeek, startTime, endTime, isDayOff, breakStart, breakEnd } = item;

      const schedule = await prisma.schedule.upsert({
        where: {
          staffId_dayOfWeek: {
            staffId,
            dayOfWeek,
          },
        },
        update: {
          startTime: startTime || "09:00",
          endTime: endTime || "19:00",
          isDayOff: Boolean(isDayOff),
        },
        create: {
          staffId,
          dayOfWeek,
          startTime: startTime || "09:00",
          endTime: endTime || "19:00",
          isDayOff: Boolean(isDayOff),
        },
      });

      // Перерыв
      if (breakStart && breakEnd) {
        await prisma.break.deleteMany({ where: { scheduleId: schedule.id } });
        await prisma.break.create({
          data: {
            scheduleId: schedule.id,
            startTime: breakStart,
            endTime: breakEnd,
            title: "Обед",
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "График успешно сохранен" });
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Ошибка сохранения графика" }, { status: 500 });
  }
}
