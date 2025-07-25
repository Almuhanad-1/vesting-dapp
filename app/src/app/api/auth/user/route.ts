// src/app/api/auth/user/route.ts (KEEP - NO ETHERS)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createUserSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const updateUserSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// POST: Get or create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = createUserSchema.parse(body);

    // Try to find existing user
    let user = await prisma.user.findUnique({
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
        },
        vestingSchedules: {
          include: {
            token: true,
            claims: true,
          },
        },
      },
    });

    let isNewUser = false;

    // If user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: { address },
        include: {
          deployedTokens: {
            include: {
              vestingSchedules: {
                include: {
                  claims: true,
                },
              },
            },
          },
          vestingSchedules: {
            include: {
              token: true,
              claims: true,
            },
          },
        },
      });
      isNewUser = true;
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
    };

    return NextResponse.json({
      ...user,
      stats,
      isNewUser,
    });
  } catch (error) {
    console.error("User auth error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate user" },
      { status: 500 }
    );
  }
}

// PATCH: Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, ...profileData } = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { address },
      data: profileData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
