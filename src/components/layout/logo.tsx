import { LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-glow-emerald">
        <LineChart className="h-5 w-5 text-emerald-950" strokeWidth={2.2} />
      </div>
      {showText && (
        <span className="font-heading text-xl font-bold tracking-tight text-foreground">
          Legnoova
        </span>
      )}
    </div>
  );
}
