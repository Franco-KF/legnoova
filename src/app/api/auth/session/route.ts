import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, applySessionCookie } from "@/lib/auth/session";
import { AUTH } from "@/lib/auth/config";
import { rejectCrossOrigin } from "@/lib/auth/request";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  const session = await auth();
  return NextResponse.json(session, { headers: NO_STORE });
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  image: z.string().url().max(2048).optional().nullable(),
});

export async function PATCH(req: Request) {
  const crossOrigin = rejectCrossOrigin(req);
  if (crossOrigin) return crossOrigin;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed" },
      { status: 400, headers: NO_STORE }
    );
  }

  const user = {
    ...session.user,
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.image !== undefined ? { image: parsed.data.image } : {}),
  };

  const response = NextResponse.json(
    {
      session: {
        user,
        expires: new Date(
          Date.now() + AUTH.sessionTtlSeconds * 1000
        ).toISOString(),
      },
    },
    { headers: NO_STORE }
  );
  applySessionCookie(response, user);
  return response;
}
