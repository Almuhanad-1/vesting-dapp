// src/components/dashboard/recent-deployments.tsx (REAL DATA)
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
import { ExternalLink, Eye, Calendar } from "lucide-react";
import Link from "next/link";
import { useUserAuth } from "@/lib/hooks/useUserAuth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { shortenAddress } from "@/lib/web3/utils";

export function RecentDeployments() {
  const { user, isLoading } = useUserAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // if (!user?.deployedTokens?.length) {
  //   return (
  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Recent Deployments</CardTitle>
  //         <CardDescription>
  //           Your recently deployed tokens will appear here
  //         </CardDescription>
  //       </CardHeader>
  //       <CardContent className="p-8 text-center text-muted-foreground">
  //         <div className="mb-4">
  //           <Calendar className="h-12 w-12 mx-auto opacity-50" />
  //         </div>
  //         <p className="mb-2">No deployments yet</p>
  //         <p className="text-sm">Deploy your first token to see it here</p>
  //         <Button asChild className="mt-4">
  //           <Link href="/deploy">Deploy Token</Link>
  //         </Button>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  const getStatusColor = (token: any) => {
    const hasActiveSchedules = token.vestingSchedules?.some((schedule: any) => {
      const now = new Date();
      const endTime = new Date(
        schedule.startTime.getTime() + schedule.vestingDuration * 1000
      );
      return endTime > now && !schedule.revoked;
    });

    if (hasActiveSchedules) return "bg-green-100 text-green-800";
    return "bg-blue-100 text-blue-800";
  };

  const getStatus = (token: any) => {
    const hasActiveSchedules = token.vestingSchedules?.some((schedule: any) => {
      const now = new Date();
      const endTime = new Date(
        schedule.startTime.getTime() + schedule.vestingDuration * 1000
      );
      return endTime > now && !schedule.revoked;
    });

    return hasActiveSchedules ? "active" : "completed";
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
            {/* {user.deployedTokens.map((token: any) => (
              <TableRow key={token.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {token.symbol}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {shortenAddress(token.address)}
                </TableCell>
                <TableCell>{token.vestingSchedules?.length || 0}</TableCell>
                <TableCell>
                  {parseFloat(token.totalSupply).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(token)}>
                    {getStatus(token)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/analytics/${token.address}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://sepolia.etherscan.io/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))} */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
