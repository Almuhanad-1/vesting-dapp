// src/lib/supabase/deployment.ts

import { createClient } from "@supabase/supabase-js";
import { DeploymentResult } from "@/store/deployment-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface DeployedToken {
  id?: number;
  address: string;
  name: string;
  symbol: string;
  total_supply: string;
  owner_address: string;
  factory_tx_hash: string;
  deployed_at: string;
  created_at?: string;
}

export interface VestingScheduleDB {
  id?: number;
  token_id: number;
  contract_address: string;
  beneficiary_address: string;
  total_amount: string;
  cliff_duration: number;
  vesting_duration: number;
  start_time: string;
  released_amount?: string;
  revoked?: boolean;
  created_at?: string;
}

export interface VestingClaim {
  id?: number;
  vesting_schedule_id: number;
  amount_claimed: string;
  tx_hash: string;
  claimed_at: string;
}

/**
 * Save deployment data to Supabase
 */
export async function saveDeploymentToDatabase(
  deploymentResult: DeploymentResult,
  tokenConfig: any,
  vestingSchedules: any[],
  beneficiaries: any[],
  ownerAddress: string
) {
  try {
    // 1. Insert the deployed token
    const { data: tokenData, error: tokenError } = await supabase
      .from("deployed_tokens")
      .insert({
        address: deploymentResult.tokenAddress,
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        total_supply: tokenConfig.totalSupply,
        owner_address: ownerAddress,
        factory_tx_hash: deploymentResult.transactionHash,
        deployed_at: deploymentResult.deployedAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error("Error saving token:", tokenError);
      throw tokenError;
    }

    const tokenId = tokenData.id;

    // 2. Insert vesting schedules for each beneficiary
    const vestingSchedulePromises = beneficiaries.map(
      async (beneficiary, index) => {
        const schedule = vestingSchedules.find(
          (s) => s.category === beneficiary.category
        );
        const vestingContractAddress =
          deploymentResult.vestingContracts[index] ||
          deploymentResult.vestingContracts[0];

        return supabase.from("vesting_schedules").insert({
          token_id: tokenId,
          contract_address: vestingContractAddress,
          beneficiary_address: beneficiary.address,
          total_amount: beneficiary.amount,
          cliff_duration: schedule.cliffMonths * 30 * 24 * 60 * 60, // Convert to seconds
          vesting_duration: schedule.vestingMonths * 30 * 24 * 60 * 60,
          start_time: deploymentResult.deployedAt.toISOString(),
          released_amount: "0",
          revoked: false,
        });
      }
    );

    const vestingResults = await Promise.all(vestingSchedulePromises);

    for (const result of vestingResults) {
      if (result.error) {
        console.error("Error saving vesting schedule:", result.error);
        throw result.error;
      }
    }

    console.log("Successfully saved deployment to database");
    return tokenData;
  } catch (error) {
    console.error("Failed to save deployment to database:", error);
    throw error;
  }
}

/**
 * Get deployed tokens for a specific owner
 */
export async function getDeployedTokensByOwner(ownerAddress: string) {
  const { data, error } = await supabase
    .from("deployed_tokens")
    .select(
      `
      *,
      vesting_schedules (
        *
      )
    `
    )
    .eq("owner_address", ownerAddress)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deployed tokens:", error);
    throw error;
  }

  return data;
}

/**
 * Get vesting schedules for a specific beneficiary
 */
export async function getVestingSchedulesByBeneficiary(
  beneficiaryAddress: string
) {
  const { data, error } = await supabase
    .from("vesting_schedules")
    .select(
      `
      *,
      deployed_tokens (
        name,
        symbol,
        address
      )
    `
    )
    .eq("beneficiary_address", beneficiaryAddress)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching vesting schedules:", error);
    throw error;
  }

  return data;
}

/**
 * Record a vesting claim
 */
export async function recordVestingClaim(
  vestingScheduleId: number,
  amountClaimed: string,
  txHash: string
) {
  const { data, error } = await supabase.from("vesting_claims").insert({
    vesting_schedule_id: vestingScheduleId,
    amount_claimed: amountClaimed,
    tx_hash: txHash,
    claimed_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error recording vesting claim:", error);
    throw error;
  }

  return data;
}

/**
 * Update released amount for a vesting schedule
 */
export async function updateReleasedAmount(
  vestingScheduleId: number,
  releasedAmount: string
) {
  const { data, error } = await supabase
    .from("vesting_schedules")
    .update({ released_amount: releasedAmount })
    .eq("id", vestingScheduleId);

  if (error) {
    console.error("Error updating released amount:", error);
    throw error;
  }

  return data;
}

/**
 * Get deployment analytics
 */
export async function getDeploymentAnalytics(ownerAddress?: string) {
  let query = supabase.from("deployed_tokens").select(`
      *,
      vesting_schedules (
        total_amount,
        released_amount
      )
    `);

  if (ownerAddress) {
    query = query.eq("owner_address", ownerAddress);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching deployment analytics:", error);
    throw error;
  }

  // Calculate analytics
  const totalTokens = data.length;
  const totalSupply = data.reduce(
    (sum, token) => sum + parseFloat(token.total_supply),
    0
  );
  const totalVestingSchedules = data.reduce(
    (sum, token) => sum + token.vesting_schedules.length,
    0
  );
  const totalAllocated = data.reduce(
    (sum, token) =>
      sum +
      token.vesting_schedules.reduce(
        (scheduleSum: number, schedule: any) =>
          scheduleSum + parseFloat(schedule.total_amount),
        0
      ),
    0
  );

  return {
    totalTokens,
    totalSupply,
    totalVestingSchedules,
    totalAllocated,
    tokens: data,
  };
}
