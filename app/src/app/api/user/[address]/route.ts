// src/app/api/user/[address]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;

    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        deployedTokens: {
          include: {
            vestingSchedules: {
              include: {
                claims: true,
              },
            },
          },
          orderBy: { deployedAt: "desc" },
        },
        vestingSchedules: {
          where: {
            beneficiaryAddress: address,
          },
          include: {
            token: true,
            claims: {
              orderBy: { claimedAt: "desc" },
            },
          },
        },
        batchDeployments: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate user statistics
    const stats = {
      tokensDeployed: user.deployedTokens.length,
      totalBeneficiaries: user.deployedTokens.reduce(
        (sum, token) => sum + token.vestingSchedules.length,
        0
      ),
      tokensReceiving: user.vestingSchedules.length,
      totalTokensVested: user.vestingSchedules.reduce(
        (sum, schedule) => sum + parseFloat(schedule.totalAmount),
        0
      ),
      totalTokensClaimed: user.vestingSchedules.reduce(
        (sum, schedule) => sum + parseFloat(schedule.releasedAmount || "0"),
        0
      ),
      batchDeployments: user.batchDeployments.length,
    };

    return NextResponse.json({
      user: {
        address: user.address,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats,
      deployedTokens: user.deployedTokens,
      vestingSchedules: user.vestingSchedules,
      batchDeployments: user.batchDeployments,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
