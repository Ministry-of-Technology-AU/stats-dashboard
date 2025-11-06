"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="gap-2"
      >
        <Sun className="h-4 w-4" suppressHydrationWarning />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="gap-2"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4" suppressHydrationWarning />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" suppressHydrationWarning />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  );
}
