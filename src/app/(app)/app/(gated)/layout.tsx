import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";

/**
 * Paywall: only users with an active paid plan can reach these routes.
 * Users without a plan are sent to Billing to choose one.
 */
export default async function GatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select("plan planStatus");

  if (!user?.plan) {
    redirect("/app/billing?upgrade=required");
  }

  return <>{children}</>;
}
