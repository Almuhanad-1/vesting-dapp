// app/src/components/beneficiary/VestingScheduleCardBeneficiary.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "wagmi";
import {
  useClaimVestedTokens,
  useReleasableAmount,
} from "@/lib/hooks/useTokenVesting";
import { useVestingContractBalance } from "@/lib/hooks/useTokenFunding";
import { useToast } from "@/lib/hooks/use-toast";
import { calculateVestingProgress, shortenAddress } from "@/lib/web3/utils";
import { ExternalLink, Clock, Gift } from "lucide-react";

interface VestingScheduleCardProps {
  schedule: {
    id: string;
    contractAddress: string;
    totalAmount: string;
    releasedAmount?: string;
    startTime: string;
    cliffDuration: number;
    vestingDuration: number;
    token: {
      name: string;
      symbol: string;
      address: string;
      ownerAddress: string;
    };
    category?: string;
    revoked?: boolean;
  };
}

export function VestingScheduleCard({ schedule }: VestingScheduleCardProps) {
  const { address } = useAccount();
  const { toast } = useToast();

  const { data: releasableAmount } = useReleasableAmount(
    schedule.contractAddress
  );
  const {
    claimTokens,
    isLoading: isClaiming,
    error,
    reset,
  } = useClaimVestedTokens(schedule.contractAddress);

  // Check funding status
  const { hassufficientBalance } = useVestingContractBalance(
    schedule.token.address,
    schedule.contractAddress
  );

  const progress = calculateVestingProgress(
    new Date(schedule.startTime).getTime() / 1000,
    schedule.cliffDuration,
    schedule.vestingDuration
  );

  const totalAmount = parseFloat(schedule.totalAmount);
  const releasedAmount = parseFloat(schedule.releasedAmount || "0");
  const vestedAmount = (totalAmount * progress.progressPercentage) / 100;
  const claimableAmount = Math.max(0, vestedAmount - releasedAmount);

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description:
          error.message || "The claim transaction failed. Please try again.",
        variant: "destructive",
      });
      reset();
    }
  }, [error, toast, reset]);

  const handleClaim = async () => {
    if (!hassufficientBalance) {
      toast({
        title: "Contract Not Funded",
        description:
          "This vesting contract has not been funded yet. Please contact the token owner.",
        variant: "destructive",
      });
      return;
    }

    if (claimableAmount <= 0) {
      toast({
        title: "No Tokens Available",
        description: "There are no tokens available to claim at this time.",
        variant: "destructive",
      });
      return;
    }

    try {
      await claimTokens();
      toast({
        title: "Claim Initiated",
        description: "Your token claim transaction has been submitted.",
      });
    } catch (error) {
      console.error("Claim error:", error);
    }
  };

  const getStatusColor = () => {
    if (schedule.revoked) return "bg-red-100 text-red-800";
    if (progress.isVestingComplete) return "bg-green-100 text-green-800";
    if (progress.isCliffPeriod) return "bg-yellow-100 text-yellow-800";
    if (!hassufficientBalance) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatusText = () => {
    if (schedule.revoked) return "Revoked";
    if (!hassufficientBalance) return "Awaiting Funding";
    if (progress.isVestingComplete) return "Complete";
    if (progress.isCliffPeriod) return "Cliff Period";
    return "Active";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span>
                {schedule.token.name} ({schedule.token.symbol})
              </span>
              <Badge className={getStatusColor()}>{getStatusText()}</Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              {schedule.category && <span>{schedule.category} •</span>}
              <span>Contract: {shortenAddress(schedule.contractAddress)}</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" asChild>
                <a
                  href={`https://sepolia.etherscan.io/address/${schedule.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Allocation
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Vesting Progress</span>
            <span>{progress.progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progress.progressPercentage} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Started: {new Date(schedule.startTime).toLocaleDateString()}
            </span>
            <span>
              {progress.isVestingComplete
                ? "Completed"
                : `Ends: ${new Date(
                    new Date(schedule.startTime).getTime() +
                      schedule.vestingDuration * 1000
                  ).toLocaleDateString()}`}
            </span>
          </div>
        </div>

        {/* Token Amounts */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">
              {totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {vestedAmount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Vested</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {claimableAmount.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Claimable</div>
          </div>
        </div>

        {/* Vesting Timeline */}
        {!progress.isVestingComplete && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </h4>
            <div className="text-sm space-y-1">
              {progress.isCliffPeriod && (
                <div className="flex justify-between">
                  <span>Cliff ends:</span>
                  <span>
                    {new Date(
                      new Date(schedule.startTime).getTime() +
                        schedule.cliffDuration * 1000
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Vesting ends:</span>
                <span>
                  {new Date(
                    new Date(schedule.startTime).getTime() +
                      schedule.vestingDuration * 1000
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Claim Section */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">
                {claimableAmount.toLocaleString()} {schedule.token.symbol}
              </div>
              <div className="text-sm text-muted-foreground">
                {!hassufficientBalance
                  ? "Contract awaiting funding"
                  : claimableAmount > 0
                  ? "Available to claim"
                  : "No tokens available yet"}
              </div>
            </div>
            <Button
              onClick={handleClaim}
              disabled={
                claimableAmount <= 0 ||
                isClaiming ||
                !hassufficientBalance ||
                schedule.revoked
              }
              className="min-w-[120px]"
            >
              {isClaiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Claiming...
                </>
              ) : schedule.revoked ? (
                "Revoked"
              ) : !hassufficientBalance ? (
                "Awaiting Funding"
              ) : claimableAmount <= 0 ? (
                "No Tokens Yet"
              ) : (
                "Claim Tokens"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
