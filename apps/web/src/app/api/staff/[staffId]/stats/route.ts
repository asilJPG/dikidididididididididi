import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { staffId: string } }
) {
  try {
    const { staffId } = params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        salon: {
          select: { id: true, name: true, slug: true, phone: true, address: true },
        },
        schedules: {
          include: { breaks: true },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Мастер не найден" }, { status: 404 });
    }

    // Записи мастера
    let dateFilter: any = {};
    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00+05:00`);
      const endOfDay = new Date(`${dateStr}T23:59:59+05:00`);
      dateFilter = {
        startDateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        staffId,
        ...dateFilter,
      },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { startDateTime: "asc" },
    });

    // Расчет финансовой статистики мастера за период
    const completedAppts = appointments.filter(
      (a: any) => a.status === "COMPLETED" || a.paymentStatus === "PAID"
    );

    const totalRevenue = completedAppts.reduce((sum: number, a: any) => sum + a.price, 0);
    const commissionPercent = staff.commissionPercent || 40;
    const staffEarnings = Math.round((totalRevenue * commissionPercent) / 100);

    return NextResponse.json({
      success: true,
      staff,
      appointments,
      stats: {
        totalAppointments: appointments.length,
        completedAppointments: completedAppts.length,
        totalRevenue,
        commissionPercent,
        staffEarnings,
      },
    });
  } catch (error) {
    console.error("Staff stats error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить данные мастера" },
      { status: 500 }
    );
  }
}
