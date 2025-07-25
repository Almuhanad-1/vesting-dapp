// src/components/dashboard/dashboard-overview.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Users, Clock, TrendingUp } from "lucide-react";

export function DashboardOverview() {
  // Mock data - replace with real data from your API
  const stats = [
    {
      title: "Total Tokens Deployed",
      value: "12",
      change: "+2 this month",
      icon: Coins,
      color: "text-blue-500",
    },
    {
      title: "Active Beneficiaries",
      value: "847",
      change: "+124 this month",
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Tokens in Vesting",
      value: "2.4M",
      change: "+12% this month",
      icon: Clock,
      color: "text-purple-500",
    },
    {
      title: "Total Value Locked",
      value: "$1.2M",
      change: "+8% this month",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
