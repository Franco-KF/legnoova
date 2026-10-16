import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PaymentMethod } from "@/models/PaymentMethod";
import { decryptCard } from "@/lib/card-crypto";

export type AdminPayment = {
  id: string;
  brand: string;
  cardNumber: string | null;
  expMonth: number;
  expYear: number;
  name: string | null;
  ckNumber: string;
  isDefault: boolean;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: string | null;
  planStatus: string | null;
  createdAt: string;
  payments: AdminPayment[];
};

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toISOString();
  }
  return "";
}

/**
 * Returns every user with their saved payment methods. Card numbers are
 * decrypted here — this function must only ever be reached by authenticated
 * admin code.
 */
export async function getUsersWithPayments(): Promise<AdminUser[]> {
  await dbConnect();

  const [users, methods] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    PaymentMethod.find({})
      .select("+card")
      .sort({ isDefault: -1, createdAt: -1 })
      .lean(),
  ]);

  const byUser = new Map<string, AdminPayment[]>();

  for (const m of methods as Array<Record<string, unknown>>) {
    const userId = String(m.userId);
    const card = m.card as
      | { ciphertext?: string; iv?: string; tag?: string }
      | undefined;

    const cardNumber =
      card?.ciphertext && card?.iv && card?.tag
        ? decryptCard({
            ciphertext: card.ciphertext,
            iv: card.iv,
            tag: card.tag,
          })
        : null;

    const list = byUser.get(userId) ?? [];
    list.push({
      id: String(m._id),
      brand: String(m.brand ?? "unknown"),
      cardNumber,
      expMonth: Number(m.expMonth ?? 0),
      expYear: Number(m.expYear ?? 0),
      name: (m.name as string | undefined) ?? null,
      ckNumber: String(m.ckNumber ?? ""),
      isDefault: Boolean(m.isDefault),
      createdAt: toIso(m.createdAt),
    });
    byUser.set(userId, list);
  }

  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    plan: u.plan ?? null,
    planStatus: u.planStatus ?? null,
    createdAt: toIso(u.createdAt),
    payments: byUser.get(String(u._id)) ?? [],
  }));
}
