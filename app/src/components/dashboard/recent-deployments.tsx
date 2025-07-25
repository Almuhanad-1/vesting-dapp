// src/components/dashboard/recent-deployments.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Eye, Settings } from "lucide-react";
import Link from "next/link";

export function RecentDeployments() {
  // Mock data - replace with real data from your API
  const deployments = [
    {
      id: "1",
      name: "MyProject Token",
      symbol: "MPT",
      address: "0x1234...5678",
      beneficiaries: 45,
      totalSupply: "10M",
      status: "active",
      deployedAt: "2024-01-15",
    },
    {
      id: "2",
      name: "DeFi Rewards",
      symbol: "DFR",
      address: "0x2345...6789",
      beneficiaries: 128,
      totalSupply: "50M",
      status: "active",
      deployedAt: "2024-01-10",
    },
    {
      id: "3",
      name: "Team Tokens",
      symbol: "TEAM",
      address: "0x3456...7890",
      beneficiaries: 25,
      totalSupply: "5M",
      status: "paused",
      deployedAt: "2024-01-05",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Deployments</CardTitle>
        <CardDescription>
          Your recently deployed tokens and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Beneficiaries</TableHead>
              <TableHead>Supply</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deployments.map((deployment) => (
              <TableRow key={deployment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{deployment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {deployment.symbol}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {deployment.address}
                </TableCell>
                <TableCell>{deployment.beneficiaries}</TableCell>
                <TableCell>{deployment.totalSupply}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(deployment.status)}>
                    {deployment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/analytics/${deployment.address}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`https://sepolia.etherscan.io/address/${deployment.address}`}
                        target="_blank"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
