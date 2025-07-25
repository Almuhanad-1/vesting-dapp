// API route using Drizzle - much cleaner!
import { NextRequest, NextResponse } from 'next/server';
import { saveDeployment, getDeploymentsByOwner } from '@/lib/drizzle/operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const deployment = await saveDeployment({
      address: body.tokenAddress,
      name: body.name,
      symbol: body.symbol,
      totalSupply: body.totalSupply,
      ownerAddress: body.ownerAddress,
      factoryTxHash: body.transactionHash,
      deployedAt: new Date(body.deployedAt),
    });
    
    return NextResponse.json(deployment);
  } catch (error) {
    console.error('Failed to save deployment:', error);
    return NextResponse.json(
      { error: 'Failed to save deployment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('owner');
    
    if (!ownerAddress) {
      return NextResponse.json(
        { error: 'Owner address required' },
        { status: 400 }
      );
    }
    
    const deployments = await getDeploymentsByOwner(ownerAddress);
    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Failed to get deployments:', error);
    return NextResponse.json(
      { error: 'Failed to get deployments' },
      { status: 500 }
    );
  }
}
