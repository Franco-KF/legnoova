import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-full w-full", className)}
    >
      <rect
        x="4.5"
        y="20"
        width="6.5"
        height="8"
        rx="2"
        fill="currentColor"
        opacity="0.55"
      />
      <rect
        x="12.75"
        y="15"
        width="6.5"
        height="13"
        rx="2"
        fill="currentColor"
        opacity="0.8"
      />
      <rect
        x="21"
        y="9"
        width="6.5"
        height="19"
        rx="2"
        fill="currentColor"
      />
      <circle cx="24.5" cy="6.2" r="2.3" fill="currentColor" />
    </svg>
  );
}