// src/app/api/tokens/route.ts (NEW - GET TOKENS)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get("owner");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = ownerAddress ? { ownerAddress } : {};

    const tokens = await prisma.deployedToken.findMany({
      where,
      include: {
        vestingSchedules: {
          include: {
            claims: true,
          },
        },
        owner: true,
      },
      orderBy: { deployedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.deployedToken.count({ where });

    return NextResponse.json({
      tokens,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Get tokens error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}
