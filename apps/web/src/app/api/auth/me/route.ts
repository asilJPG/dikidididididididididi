import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const userIdCookie = cookieStore.get("dikidi_user_id")?.value;
    const phoneCookie = cookieStore.get("dikidi_user_phone")?.value;

    const { searchParams } = new URL(request.url);
    const queryPhone = searchParams.get("phone");

    const phone = queryPhone || phoneCookie;

    if (!userIdCookie && !phone) {
      return NextResponse.json({ user: null });
    }

    const whereClause: any = {};
    if (userIdCookie) {
      whereClause.id = userIdCookie;
    } else if (phone) {
      const clean = phone.replace(/[^\d+]/g, "");
      const noPlus = clean.replace("+", "");
      whereClause.phone = { in: [clean, noPlus] };
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        ownedSalons: true,
        staffProfile: {
          include: { salon: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("Error fetching current user:", err);
    return NextResponse.json({ user: null, error: err?.message }, { status: 500 });
  }
}
