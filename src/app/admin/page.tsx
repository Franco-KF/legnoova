import { redirect } from "next/navigation";
import { CreditCard, ShieldCheck, Users } from "lucide-react";
import { isAdmin } from "@/lib/admin/auth";
import { getUsersWithPayments } from "@/lib/admin/data";
import { LogoutButton } from "@/components/admin/logout-button";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  let users: Awaited<ReturnType<typeof getUsersWithPayments>> = [];
  let loadError: string | null = null;
  try {
    users = await getUsersWithPayments();
  } catch (error) {
    console.error("Admin panel load error:", error);
    loadError = "Could not load users.";
  }

  const totalCards = users.reduce((sum, u) => sum + u.payments.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold">Admin panel</h1>
            <p className="text-sm text-muted-foreground">
              Users and their saved payment methods
            </p>
          </div>
        </div>
        <LogoutButton />
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <Users className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-2xl font-semibold">{users.length}</p>
            <p className="text-xs text-muted-foreground">Total users</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-2xl font-semibold">{totalCards}</p>
            <p className="text-xs text-muted-foreground">Saved cards</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/[0.12] px-2.5 py-0.5 text-xs text-muted-foreground">
                  {user.plan ?? "free"}
                  {user.planStatus ? ` · ${user.planStatus}` : ""}
                </span>
              </div>
            </div>

            {user.payments.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No saved payment methods.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Brand</th>
                      <th className="pb-2 pr-4 font-medium">Card number</th>
                      <th className="pb-2 pr-4 font-medium">Expiry</th>
                      <th className="pb-2 pr-4 font-medium">Name</th>
                      <th className="pb-2 pr-4 font-medium">Legnoova code</th>
                      <th className="pb-2 font-medium">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-white/[0.06]"
                      >
                        <td className="py-2 pr-4 capitalize">{p.brand}</td>
                        <td className="py-2 pr-4 font-mono tracking-wider">
                          {p.cardNumber ?? "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono">
                          {String(p.expMonth).padStart(2, "0")}/
                          {String(p.expYear).slice(-2)}
                        </td>
                        <td className="py-2 pr-4">{p.name ?? "—"}</td>
                        <td className="py-2 pr-4 font-mono">{p.companyCode ?? "—"}</td>
                        <td className="py-2">
                          {p.isDefault ? (
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                              Default
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && !loadError && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
            No users yet.
          </div>
        )}
      </div>
    </div>
  );
}
