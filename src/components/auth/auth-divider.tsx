export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/[0.08]" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white/[0.02] px-3 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}