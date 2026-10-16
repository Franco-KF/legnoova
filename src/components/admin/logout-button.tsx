"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={signOut} disabled={loading}>
      {loading ? (
        <Lock className="h-4 w-4" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      Sign out
    </Button>
  );
}
