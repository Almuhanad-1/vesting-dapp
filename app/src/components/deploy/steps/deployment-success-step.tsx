// src/components/deploy/steps/deployment-success-step.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDeploymentStore } from "@/store/deployment-store";
import {
  CheckCircle,
  ExternalLink,
  Copy,
  Download,
  Share2,
  BarChart3,
  Users,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import confetti from "canvas-confetti";
import { shortenAddress } from "@/lib/web3/utils";
import { useToast } from "@/lib/hooks/use-toast";

interface DeploymentSuccessStepProps {
  onReset: () => void;
}

export function DeploymentSuccessStep({ onReset }: DeploymentSuccessStepProps) {
  const { deploymentResult, tokenConfig, vestingSchedules, beneficiaries } =
    useDeploymentStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  // Trigger confetti on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const generateSummaryReport = () => {
    const report = {
      deployment: {
        timestamp: deploymentResult?.deployedAt,
        transactionHash: deploymentResult?.transactionHash,
        tokenAddress: deploymentResult?.tokenAddress,
        vestingContracts: deploymentResult?.vestingContracts,
      },
      token: {
        name: tokenConfig?.name,
        symbol: tokenConfig?.symbol,
        totalSupply: tokenConfig?.totalSupply,
        decimals: tokenConfig?.decimals,
      },
      vestingSchedules: vestingSchedules.map((schedule) => ({
        category: schedule.category,
        cliffMonths: schedule.cliffMonths,
        vestingMonths: schedule.vestingMonths,
        revocable: schedule.revocable,
        beneficiaryCount: beneficiaries.filter(
          (b) => b.category === schedule.category
        ).length,
      })),
      beneficiaries: beneficiaries.length,
      totalAllocation: beneficiaries.reduce(
        (sum, b) => sum + parseFloat(b.amount),
        0
      ),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenConfig?.symbol || "token"}-deployment-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareDeployment = async () => {
    const shareData = {
      title: `${tokenConfig?.name} Token Deployed!`,
      text: `I just deployed ${tokenConfig?.name} (${tokenConfig?.symbol}) with vesting schedules using VestingDApp!`,
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link
        await copyToClipboard(
          `${shareData.text}\n\nToken: ${deploymentResult?.tokenAddress}\nTransaction: https://sepolia.etherscan.io/tx/${deploymentResult?.transactionHash}`,
          "Deployment details"
        );
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (!deploymentResult) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No deployment result found</p>
      </div>
    );
  }

  const explorerBaseUrl = "https://sepolia.etherscan.io";

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            🎉 Deployment Successful!
          </h2>
          <p className="text-green-700">
            Your token and vesting contracts have been deployed successfully to
            the blockchain.
          </p>
        </CardContent>
      </Card>

      {/* Deployment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Deployment Details
          </CardTitle>
          <CardDescription>
            Your token deployment information and contract addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {tokenConfig?.name} ({tokenConfig?.symbol})
              </h3>
              <Badge variant="outline">ERC-20 Token</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Token Address
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">
                      {shortenAddress(deploymentResult.tokenAddress)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          deploymentResult.tokenAddress,
                          "Token address"
                        )
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 w-6 p-0"
                    >
                      <a
                        href={`${explorerBaseUrl}/address/${deploymentResult.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Supply
                  </div>
                  <div className="font-medium">
                    {parseFloat(
                      tokenConfig?.totalSupply || "0"
                    ).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Transaction Hash
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">
                      {shortenAddress(deploymentResult.transactionHash)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          deploymentResult.transactionHash,
                          "Transaction hash"
                        )
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-6 w-6 p-0"
                    >
                      <a
                        href={`${explorerBaseUrl}/tx/${deploymentResult.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Deployed At
                  </div>
                  <div className="font-medium">
                    {new Date(deploymentResult.deployedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vesting Contracts */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vesting Contracts (
              {deploymentResult.vestingContracts?.length || 0})
            </h3>
            <div className="space-y-2">
              {deploymentResult.vestingContracts?.map(
                (contractAddress, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Vesting Contract #{index + 1}
                      </div>
                      <code className="text-sm text-muted-foreground">
                        {contractAddress}
                      </code>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            contractAddress,
                            `Vesting contract #${index + 1}`
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`${explorerBaseUrl}/address/${contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              ) || (
                <p className="text-muted-foreground text-center p-4">
                  No vesting contracts deployed
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {vestingSchedules.length}
              </div>
              <div className="text-sm text-blue-800">Vesting Schedules</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {beneficiaries.length}
              </div>
              <div className="text-sm text-green-800">Beneficiaries</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {beneficiaries
                  .reduce((sum, b) => sum + parseFloat(b.amount), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-purple-800">Tokens Allocated</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(
                  (beneficiaries.reduce(
                    (sum, b) => sum + parseFloat(b.amount),
                    0
                  ) /
                    parseFloat(tokenConfig?.totalSupply || "1")) *
                  100
                ).toFixed(1)}
                %
              </div>
              <div className="text-sm text-orange-800">Supply Allocated</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button
          variant="outline"
          onClick={generateSummaryReport}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>

        <Button
          variant="outline"
          onClick={shareDeployment}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Success
        </Button>

        <Button variant="outline" asChild className="flex items-center gap-2">
          <Link href={`/analytics/${deploymentResult.tokenAddress}`}>
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Link>
        </Button>

        <Button onClick={onReset} className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Deploy Another
        </Button>
      </div>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here are some recommended next steps for managing your token
            deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">For Token Owners</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>
                    Monitor vesting progress in the analytics dashboard
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Share contract addresses with your beneficiaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Add token to your wallet and popular token lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Set up notifications for claim events</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">For Beneficiaries</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>
                    Visit the beneficiary portal to view vesting schedules
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Add token to wallet using the contract address</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>
                    Set calendar reminders for cliff and vesting milestones
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Claim tokens when they become available</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Links */}
      <Card>
        <CardHeader>
          <CardTitle>Important Links</CardTitle>
          <CardDescription>
            Keep these links handy for future reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Blockchain Explorer</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <a
                    href={`${explorerBaseUrl}/address/${deploymentResult.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Token Contract
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <a
                    href={`${explorerBaseUrl}/tx/${deploymentResult.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Deployment Transaction
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Platform Features</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <Link href="/dashboard">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start"
                >
                  <Link href="/beneficiary">
                    <Users className="h-4 w-4 mr-2" />
                    Beneficiary Portal
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          🚀 Congratulations on your successful deployment!
        </h3>
        <p className="text-green-700 mb-4">
          Your token and vesting contracts are now live on the blockchain.
          Beneficiaries can start tracking their vesting schedules and claim
          tokens when available.
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              copyToClipboard(deploymentResult.tokenAddress, "Token address")
            }
          >
            {copied === "Token address" ? "Copied!" : "Copy Token Address"}
          </Button>
          <Button asChild>
            <Link href={`/analytics/${deploymentResult.tokenAddress}`}>
              View Full Analytics
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
