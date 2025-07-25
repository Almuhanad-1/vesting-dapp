// src/components/beneficiary/beneficiary-dashboard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useUserData } from "@/lib/hooks/use-token-data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Coins, Clock, TrendingUp, Gift } from "lucide-react";
import { VestingProgressChart } from "@/components/charts/vesting-progress-chart";
import { calculateVestingProgress } from "@/lib/web3/utils";

export function BeneficiaryDashboard() {
  const { address } = useAccount();
  const { data: userData, isLoading, error } = useUserData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !userData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Failed to load beneficiary data
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stats, vestingSchedules } = userData;

  // Calculate claimable amounts
  const claimableSchedules = vestingSchedules.filter((schedule: any) => {
    const now = Date.now() / 1000;
    const startTime = new Date(schedule.startTime).getTime() / 1000;
    const cliffEnd = startTime + schedule.cliffDuration;
    return now >= cliffEnd && !schedule.revoked;
  });

  const totalClaimable = claimableSchedules.reduce(
    (sum: number, schedule: any) => {
      const progress = calculateVestingProgress(
        new Date(schedule.startTime).getTime() / 1000,
        schedule.cliffDuration,
        schedule.vestingDuration
      );
      const totalAmount = parseFloat(schedule.totalAmount);
      const released = parseFloat(schedule.releasedAmount || "0");
      const vested = (totalAmount * progress.progressPercentage) / 100;
      return sum + Math.max(0, vested - released);
    },
    0
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vesting Positions
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tokensReceiving}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vested</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokensVested.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Tokens allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claimed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTokensClaimed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (stats.totalTokensClaimed / stats.totalTokensVested) *
                100
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claimable Now</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalClaimable.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Ready to claim</p>
          </CardContent>
        </Card>
      </div>

      {/* Vesting Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vesting Progress Overview</CardTitle>
          <CardDescription>
            Track your token vesting progress across all positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VestingProgressChart data={vestingSchedules} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Claim</CardTitle>
            <CardDescription>
              Claim tokens that are ready for release
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalClaimable > 0 ? (
              <div className="space-y-4">
                <div className="text-lg font-semibold text-green-600">
                  {totalClaimable.toLocaleString()} tokens ready to claim
                </div>
                <Button className="w-full">Claim All Available Tokens</Button>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tokens available to claim right now</p>
                <p className="text-sm">
                  Check back later or view individual schedules
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Releases</CardTitle>
            <CardDescription>Next scheduled token releases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vestingSchedules
                .filter((schedule: any) => !schedule.revoked)
                .slice(0, 3)
                .map((schedule: any, index: number) => {
                  const progress = calculateVestingProgress(
                    new Date(schedule.startTime).getTime() / 1000,
                    schedule.cliffDuration,
                    schedule.vestingDuration
                  );

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {schedule.token.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.category} •{" "}
                          {parseFloat(schedule.totalAmount).toLocaleString()}{" "}
                          tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {progress.progressPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progress.isVestingComplete
                            ? "Complete"
                            : progress.isCliffPeriod
                            ? "In cliff"
                            : "Vesting"}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {vestingSchedules.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No active vesting schedules</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
