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
    const phoneWithPlus = `+${digitsOnly}`;
    const phoneWithoutPlus = digitsOnly;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientPhone: {
          in: [phoneWithPlus, phoneWithoutPlus, rawPhone],
        },
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

    const now = new Date();

    const upcoming = appointments.filter(
      (a: any) =>
        new Date(a.startDateTime) >= now &&
        a.status !== "CANCELLED" &&
        a.status !== "COMPLETED"
    );

    const past = appointments.filter(
      (a: any) =>
        new Date(a.startDateTime) < now ||
        a.status === "CANCELLED" ||
        a.status === "COMPLETED"
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
