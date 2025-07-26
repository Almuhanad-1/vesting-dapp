// =================================================================
// 8. app/src/app/api/batch/create/route.ts - CREATE BATCH DEPLOYMENT
// =================================================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle/client";
import { users, batchDeployments } from "@/lib/drizzle/schema";
import { z } from "zod";

const createBatchSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().optional(),
  description: z.string().optional(),
  tokenCount: z.number().min(1),
  totalVestingSchedules: z.number().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createBatchSchema.parse(body);

    // Create user if doesn't exist
    await db
      .insert(users)
      .values({ address: data.creatorAddress })
      .onConflictDoNothing({ target: users.address });

    // Create batch deployment
    const [batch] = await db
      .insert(batchDeployments)
      .values({
        creatorAddress: data.creatorAddress,
        name: data.name,
        description: data.description,
        tokenCount: data.tokenCount,
        totalVestingSchedules: data.totalVestingSchedules,
        status: "pending",
      })
      .returning();

    return NextResponse.json({
      success: true,
      batch,
    });
  } catch (error) {
    console.error("Create batch error:", error);
    return NextResponse.json(
      { error: "Failed to create batch deployment" },
      { status: 500 }
    );
  }
}
