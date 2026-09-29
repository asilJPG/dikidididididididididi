import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone")?.trim();

    if (!rawPhone) {
      return NextResponse.json(
        { error: "Номер телефона обязателен" },
        { status: 400 }
      );
    }

    const digitsOnly = rawPhone.replace(/\D/g, "");
    const last9 = digitsOnly.slice(-9);

    const phoneVariants = new Set<string>();
    phoneVariants.add(rawPhone);
    phoneVariants.add(rawPhone.trim());
    if (digitsOnly) {
      phoneVariants.add(digitsOnly);
      phoneVariants.add(`+${digitsOnly}`);
    }
    if (last9.length === 9) {
      phoneVariants.add(`+998${last9}`);
      phoneVariants.add(`998${last9}`);
      phoneVariants.add(last9);
      phoneVariants.add(`+998 ${last9.slice(0, 2)} ${last9.slice(2, 5)} ${last9.slice(5, 7)} ${last9.slice(7, 9)}`);
      phoneVariants.add(`+998 (${last9.slice(0, 2)}) ${last9.slice(2, 5)}-${last9.slice(5, 7)}-${last9.slice(7, 9)}`);
      phoneVariants.add(`+998 (${last9.slice(0, 2)}) ${last9.slice(2, 5)} ${last9.slice(5, 7)} ${last9.slice(7, 9)}`);
      phoneVariants.add(`8 (${last9.slice(0, 2)}) ${last9.slice(2, 5)}-${last9.slice(5, 7)}-${last9.slice(7, 9)}`);
      phoneVariants.add(`8${last9}`);
    }

    const phoneList = Array.from(phoneVariants);

    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { clientPhone: { in: phoneList } },
          { customer: { phone: { in: phoneList } } },
          ...(last9.length === 9 ? [{ clientPhone: { endsWith: last9 } }] : []),
        ],
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        staff: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            nameRu: true,
            durationMinutes: true,
            price: true,
          },
        },
        review: true,
      },
      orderBy: { startDateTime: "desc" },
    });

    // Активные / предстоящие записи: статус PENDING, CONFIRMED или IN_PROGRESS
    const upcoming = appointments.filter(
      (a: any) =>
        a.status === "PENDING" ||
        a.status === "CONFIRMED" ||
        a.status === "IN_PROGRESS"
    );

    // Завершенные / архивные: статус COMPLETED, CANCELLED или NO_SHOW
    const past = appointments.filter(
      (a: any) =>
        a.status === "COMPLETED" ||
        a.status === "CANCELLED" ||
        a.status === "NO_SHOW"
    );

    return NextResponse.json({
      success: true,
      upcoming,
      past,
      all: appointments,
    });
  } catch (error) {
    console.error("Client appointments fetch error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить записи клиента" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, action, cancelReason } = body;

    if (!appointmentId) {
      return NextResponse.json(
        { error: "ID записи обязателен" },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Запись не найдена" },
        { status: 404 }
      );
    }

    if (action === "CANCEL") {
      const updated = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CANCELLED",
          clientComment: cancelReason
            ? `${existing.clientComment || ""} | Причина отмены: ${cancelReason}`.trim()
            : existing.clientComment,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Запись успешно отменена",
        appointment: updated,
      });
    }

    return NextResponse.json(
      { error: "Неизвестное действие" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Client appointment update error:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении записи" },
      { status: 500 }
    );
  }
}
