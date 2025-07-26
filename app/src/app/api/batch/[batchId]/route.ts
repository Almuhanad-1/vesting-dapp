// =================================================================
// 7. app/src/app/api/batch/[batchId]/route.ts - GET BATCH DEPLOYMENT
// =================================================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle/client";
import { batchDeployments } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const { batchId } = params;

    const batch = await db.query.batchDeployments.findFirst({
      where: eq(batchDeployments.id, batchId),
      with: {
        creator: true,
        tokens: {
          with: {
            vestingSchedules: {
              with: {
                claims: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Batch deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch deployment:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch deployment" },
      { status: 500 }
    );
  }
}
