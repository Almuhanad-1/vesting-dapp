// src/app/dashboard/page.tsx
"use client";

import { useAccount } from "wagmi";
import { Navbar } from "@/components/layout/navbar";
import { ConnectWalletPrompt } from "@/components/web3/connect-wallet-prompt";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { RecentDeployments } from "@/components/dashboard/recent-deployments";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Analytics } from "@/components/dashboard/analytics";

import { ContractTest } from "@/components/test/contract-test";

export default function DashboardPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <>
        <Navbar />
        <ConnectWalletPrompt />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your token deployments and vesting schedules
          </p>
        </div>

        <div className="grid gap-6">
          <ContractTest /> {/* Add this to test */}
          <DashboardOverview />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentDeployments />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
          <Analytics />
        </div>
      </div>
    </>
  );
}
