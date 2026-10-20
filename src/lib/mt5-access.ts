import type { IUser } from "@/models/User";

export function hasBrokerAutomationAccess(user: Pick<IUser, "plan" | "planStatus" | "trialEndsAt" | "planCurrentPeriodEnd"> | null) {
  if (!user || user.plan !== "broker") return false;

  const now = Date.now();
  if (user.planStatus === "active") {
    return !user.planCurrentPeriodEnd || user.planCurrentPeriodEnd.getTime() > now;
  }
  if (user.planStatus === "trialing") {
    return Boolean(user.trialEndsAt && user.trialEndsAt.getTime() > now);
  }
  if (user.planStatus === "canceled") {
    return Boolean(user.planCurrentPeriodEnd && user.planCurrentPeriodEnd.getTime() > now);
  }

  return false;
}
