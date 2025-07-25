// src/app/api/deployment/save/route.ts (NEW - SAVE DEPLOYMENT DATA)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const saveDeploymentSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  tokenConfig: z.object({
    name: z.string(),
    symbol: z.string(),
    totalSupply: z.string(),
    decimals: z.number().optional(),
    description: z.string().optional(),
    website: z.string().optional(),
    logo: z.string().optional(),
  }),
  vestingSchedules: z.array(z.object({
    category: z.string(),
    cliffMonths: z.number(),
    vestingMonths: z.number(),
    revocable: z.boolean(),
    description: z.string().optional(),
  })),
  beneficiaries: z.array(z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    category: z.string(),
    amount: z.string(),
    name: z.string().optional(),
    email: z.string().optional(),
  })),
  vestingContracts: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = saveDeploymentSchema.parse(body)

    // Create user if doesn't exist
    await prisma.user.upsert({
      where: { address: data.userAddress },
      update: {},
      create: { address: data.userAddress },
    })

    // Save deployed token
    const deployedToken = await prisma.deployedToken.create({
      data: {
        address: data.tokenAddress,
        name: data.tokenConfig.name,
        symbol: data.tokenConfig.symbol,
        totalSupply: data.tokenConfig.totalSupply,
        decimals: data.tokenConfig.decimals || 18,
        ownerAddress: data.userAddress,
        factoryTxHash: data.transactionHash,
        description: data.tokenConfig.description,
        website: data.tokenConfig.website,
        logo: data.tokenConfig.logo,
      },
    })

    // Save vesting schedules
    for (let i = 0; i < data.beneficiaries.length; i++) {
      const beneficiary = data.beneficiaries[i]
      const schedule = data.vestingSchedules.find(s => s.category === beneficiary.category)!
      
      // Create beneficiary user if doesn't exist
      await prisma.user.upsert({
        where: { address: beneficiary.address },
        update: {},
        create: { address: beneficiary.address, name: beneficiary.name, email: beneficiary.email },
      })

      await prisma.vestingSchedule.create({
        data: {
          tokenId: deployedToken.id,
          contractAddress: data.vestingContracts[i],
          beneficiaryAddress: beneficiary.address,
          totalAmount: beneficiary.amount,
          cliffDuration: schedule.cliffMonths * 30 * 24 * 60 * 60,
          vestingDuration: schedule.vestingMonths * 30 * 24 * 60 * 60,
          startTime: new Date(),
          revocable: schedule.revocable,
          category: beneficiary.category,
          description: schedule.description,
        },
      })
    }

    return NextResponse.json({
      success: true,
      tokenId: deployedToken.id,
      message: 'Deployment data saved successfully',
    })

  } catch (error) {
    console.error('Save deployment error:', error)
    return NextResponse.json(
      { error: 'Failed to save deployment data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}