import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, rating, comment } = body;

    if (!appointmentId || !rating) {
      return NextResponse.json(
        { error: "appointmentId и rating обязательны" },
        { status: 400 }
      );
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { review: true },
    });

    if (!appt) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    if (appt.review) {
      return NextResponse.json(
        { error: "Отзыв по этой записи уже оставлен" },
        { status: 400 }
      );
    }

    const numRating = Math.min(5, Math.max(1, Number(rating)));

    const review = await prisma.review.create({
      data: {
        appointmentId,
        salonId: appt.salonId,
        staffId: appt.staffId,
        clientName: appt.clientName,
        rating: numRating,
        comment: comment ? String(comment).trim() : null,
      },
    });

    // Пересчет среднего рейтинга салона
    const salonReviews = await prisma.review.findMany({
      where: { salonId: appt.salonId },
      select: { rating: true },
    });
    if (salonReviews.length > 0) {
      const avg =
        salonReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / salonReviews.length;
      await prisma.salon.update({
        where: { id: appt.salonId },
        data: {
          rating: Number(avg.toFixed(1)),
          reviewCount: salonReviews.length,
        },
      });
    }

    // Пересчет среднего рейтинга мастера
    if (appt.staffId) {
      const staffReviews = await prisma.review.findMany({
        where: { staffId: appt.staffId },
        select: { rating: true },
      });
      if (staffReviews.length > 0) {
        const staffAvg =
          staffReviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          staffReviews.length;
        await prisma.staff.update({
          where: { id: appt.staffId },
          data: {
            rating: Number(staffAvg.toFixed(1)),
            reviewCount: staffReviews.length,
          },
        });
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить отзыв" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");
    const staffId = searchParams.get("staffId");

    const reviews = await prisma.review.findMany({
      where: {
        ...(salonId ? { salonId } : {}),
        ...(staffId ? { staffId } : {}),
      },
      include: {
        staff: {
          select: { fullName: true, specialty: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить отзывы" },
      { status: 500 }
    );
  }
}
