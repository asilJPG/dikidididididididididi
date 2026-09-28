import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const ownerPhone = searchParams.get("ownerPhone");

    let whereClause: any = { isVerified: true };

    if (ownerId) {
      whereClause = { ownerId };
    } else if (ownerPhone) {
      const user = await prisma.user.findUnique({
        where: { phone: ownerPhone },
      });
      if (user) {
        whereClause = { ownerId: user.id };
      }
    }

    const salons = await prisma.salon.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
        },
        staff: {
          where: { isActive: true },
        },
        categories: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({ salons });
  } catch (error) {
    console.error("Error fetching salons list:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка салонов" },
      { status: 500 }
    );
  }
}
