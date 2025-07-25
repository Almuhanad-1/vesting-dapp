// src/components/dashboard/quick-actions.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, BarChart3, Users } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      title: "Deploy New Token",
      description: "Create a new token with vesting",
      icon: Plus,
      href: "/deploy",
      variant: "default" as const,
    },
    {
      title: "Batch Deploy",
      description: "Deploy multiple tokens at once",
      icon: Upload,
      href: "/batch",
      variant: "outline" as const,
    },
    {
      title: "View Analytics",
      description: "Analyze token performance",
      icon: BarChart3,
      href: "/analytics",
      variant: "outline" as const,
    },
    {
      title: "Manage Beneficiaries",
      description: "Update beneficiary information",
      icon: Users,
      href: "/beneficiary",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className="w-full justify-start h-auto p-4"
            asChild
          >
            <Link href={action.href}>
              <div className="flex items-start gap-3">
                <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
