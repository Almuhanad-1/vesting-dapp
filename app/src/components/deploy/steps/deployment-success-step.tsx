// src/components/deploy/steps/deployment-success-step.tsx (UPDATED VERSION)
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
import { shortenAddress } from "@/lib/web3/utils";
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
  AlertCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";
import confetti from "canvas-confetti";

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

  const exportDeploymentData = () => {
    const data = {
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
      vestingSchedules: vestingSchedules,
      beneficiaries: beneficiaries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      tokenConfig?.symbol || "token"
    }-deployment-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Deployment data has been downloaded as JSON",
    });
  };

  // Check if addresses are valid (not empty or placeholder)
  const isValidAddress = (address: string) => {
    return (
      address &&
      address !== "" &&
      address !== "0x..." &&
      address !== "0x" &&
      address.length === 42 &&
      address.startsWith("0x")
    );
  };

  const hasValidTokenAddress = isValidAddress(
    deploymentResult?.tokenAddress || ""
  );
  const hasValidVestingContracts =
    deploymentResult?.vestingContracts?.some((addr) => isValidAddress(addr)) ||
    false;

  if (!deploymentResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Deployment result not found</p>
          <Button onClick={onReset} className="mt-4">
            Start Over
          </Button>
        </CardContent>
      </Card>
    );
  }

  // You can configure this based on your network
  const explorerBaseUrl =
    process.env.NEXT_PUBLIC_CHAIN_ID === "1"
      ? "https://etherscan.io"
      : "https://sepolia.etherscan.io";

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

      {/* Address Verification Alert */}
      {(!hasValidTokenAddress || !hasValidVestingContracts) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">
                  Contract Addresses Being Processed
                </h3>
                <p className="text-sm text-yellow-700">
                  Contract addresses are still being extracted from the
                  blockchain. Check the transaction hash for details, or refresh
                  the page in a moment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                {/* Token Address */}
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Token Address
                  </div>
                  {hasValidTokenAddress ? (
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
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">
                        Address being extracted...
                      </span>
                    </div>
                  )}
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
                {/* Transaction Hash */}
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
            {deploymentResult.vestingContracts?.length ? (
              <div className="space-y-2">
                {deploymentResult.vestingContracts.map(
                  (contractAddress, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          Vesting Contract #{index + 1}
                        </div>
                        {isValidAddress(contractAddress) ? (
                          <code className="text-sm text-muted-foreground">
                            {contractAddress}
                          </code>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs">
                              Address being extracted...
                            </span>
                          </div>
                        )}
                      </div>
                      {isValidAddress(contractAddress) && (
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
                      )}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-yellow-800 font-medium">
                  Vesting contracts pending
                </p>
                <p className="text-yellow-700 text-sm">
                  Contract addresses will be available once the transaction is
                  fully processed
                </p>
              </div>
            )}
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
        {/* View Transaction (Always works) */}
        <Button variant="outline" asChild className="flex items-center gap-2">
          <a
            href={`${explorerBaseUrl}/tx/${deploymentResult.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            View Transaction
          </a>
        </Button>

        {/* View Token (Only if valid address) */}
        {hasValidTokenAddress ? (
          <Button variant="outline" asChild className="flex items-center gap-2">
            <a
              href={`${explorerBaseUrl}/address/${deploymentResult.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              View Token
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Token Pending
          </Button>
        )}

        {/* Copy Address (Only if valid) */}
        {hasValidTokenAddress ? (
          <Button
            variant="outline"
            onClick={() =>
              copyToClipboard(deploymentResult.tokenAddress, "Token address")
            }
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied === "Token address" ? "Copied!" : "Copy Address"}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Address Pending
          </Button>
        )}

        <Button
          onClick={exportDeploymentData}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Success Message */}
      <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          🚀 Congratulations on your successful deployment!
        </h3>
        <p className="text-green-700 mb-4">
          Your token and vesting contracts are now live on the blockchain.
          Contract addresses will be fully available once the transaction is
          completely processed.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={exportDeploymentData}>
            <Download className="h-4 w-4 mr-2" />
            Save Deployment Info
          </Button>
          <Button onClick={onReset}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Deploy Another Token
          </Button>
        </div>
      </div>
    </div>
  );
}
