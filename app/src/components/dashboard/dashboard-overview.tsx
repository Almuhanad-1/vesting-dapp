// src/components/dashboard/dashboard-overview.tsx (REAL DATA)
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserAuth } from "@/lib/hooks/useUserAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  Clock,
  BarChart3,
} from "lucide-react";
import { useReadContract } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  TOKEN_VESTING_FACTORY_ABI,
} from "@/lib/web3/config";

export function DashboardOverview() {
  const { user, isLoading } = useUserAuth();

  // Get real contract data
  const { data: batchCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: "batchCounter",
  });

  const { data: implementations } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: "getImplementations",
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connect Wallet
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Connect to view stats
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // const stats = [
  //   {
  //     title: "Total Tokens Deployed",
  //     value: user.stats?.tokensDeployed?.toString() || "0",
  //     change:
  //       user.stats?.tokensDeployed > 0
  //         ? "+New this session"
  //         : "Deploy your first token",
  //     icon: Coins,
  //     color: "text-blue-500",
  //     trend: "up" as const,
  //   },
  //   {
  //     title: "Active Beneficiaries",
  //     value: user.stats?.totalBeneficiaries?.toString() || "0",
  //     change:
  //       user.stats?.totalBeneficiaries > 0
  //         ? "Across all tokens"
  //         : "No beneficiaries yet",
  //     icon: Users,
  //     color: "text-green-500",
  //     trend: "up" as const,
  //   },
  //   {
  //     title: "Tokens in Vesting",
  //     value: user.stats?.totalTokensVested
  //       ? Math.floor(user.stats.totalTokensVested).toLocaleString()
  //       : "0",
  //     change:
  //       user.stats?.totalTokensVested > 0
  //         ? "Total allocated"
  //         : "No tokens vesting",
  //     icon: Clock,
  //     color: "text-purple-500",
  //     trend: "up" as const,
  //   },
  //   {
  //     title: "Total Claimed",
  //     value: user.stats?.totalTokensClaimed
  //       ? Math.floor(user.stats.totalTokensClaimed).toLocaleString()
  //       : "0",
  //     change:
  //       user.stats?.totalTokensClaimed > 0
  //         ? "Successfully claimed"
  //         : "No claims yet",
  //     icon: TrendingUp,
  //     color: "text-orange-500",
  //     trend: "up" as const,
  //   },
  // ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stat.trend === "up" && (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              )}
              {stat.change}
            </div>
          </CardContent>
        </Card>
      ))} */}

      {/* Contract Info Card */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">Contract Information</CardTitle>
          <CardDescription>
            Real contract data from your deployed factory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Factory Address
              </div>
              <div className="font-mono text-sm">
                {CONTRACT_ADDRESSES.FACTORY}
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Batch Counter</div>
              <div className="font-semibold">
                {batchCounter?.toString() || "0"}
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-semibold text-green-600">
                {implementations ? "Connected" : "Connecting..."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
