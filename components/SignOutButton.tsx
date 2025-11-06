"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" suppressHydrationWarning />
      <span className="hidden sm:inline">Sign Out</span>
    </Button>
  );
}
