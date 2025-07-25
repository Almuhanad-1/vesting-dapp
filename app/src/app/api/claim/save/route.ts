// src/app/api/claim/save/route.ts (NEW - SAVE CLAIM DATA)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const saveClaimSchema = z.object({
  vestingContractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  beneficiaryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountClaimed: z.string(),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  blockNumber: z.number().optional(),
  gasUsed: z.string().optional(),
  gasPrice: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = saveClaimSchema.parse(body);

    // Find the vesting schedule
    const vestingSchedule = await prisma.vestingSchedule.findFirst({
      where: {
        contractAddress: data.vestingContractAddress,
        beneficiaryAddress: data.beneficiaryAddress,
      },
    });

    if (!vestingSchedule) {
      return NextResponse.json(
        { error: "Vesting schedule not found" },
        { status: 404 }
      );
    }

    // Record the claim
    await prisma.vestingClaim.create({
      data: {
        vestingScheduleId: vestingSchedule.id,
        amountClaimed: data.amountClaimed,
        txHash: data.transactionHash,
        blockNumber: data.blockNumber,
        gasUsed: data.gasUsed,
        gasPrice: data.gasPrice,
      },
    });

    // Update released amount
    const currentReleased = parseFloat(vestingSchedule.releasedAmount || "0");
    const newReleased = currentReleased + parseFloat(data.amountClaimed);

    await prisma.vestingSchedule.update({
      where: { id: vestingSchedule.id },
      data: { releasedAmount: newReleased.toString() },
    });

    return NextResponse.json({
      success: true,
      message: "Claim recorded successfully",
    });
  } catch (error) {
    console.error("Save claim error:", error);
    return NextResponse.json(
      {
        error: "Failed to save claim data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
