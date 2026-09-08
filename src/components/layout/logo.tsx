import { LogoMark } from "@/components/branding/logo-mark";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-glow-emerald">
        <LogoMark className="h-[22px] w-[22px] text-emerald-950" />
      </div>
      {showText && (
        <span className="font-heading text-xl font-bold tracking-tight text-foreground">
          Legnoova{" "}
          <span className="text-gradient-accent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            AI
          </span>
        </span>
      )}
    </div>
  );
}