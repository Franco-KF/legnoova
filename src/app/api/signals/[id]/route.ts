import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { SIGNAL_STATUSES, TOOK_IT_VALUES } from "@/lib/analysis/types";

const patchSchema = z
  .object({
    tookIt: z.enum(TOOK_IT_VALUES as [string, ...string[]]).optional(),
    signalStatus: z.enum(SIGNAL_STATUSES as [string, ...string[]]).optional(),
  })
  .refine((v) => v.tookIt !== undefined || v.signalStatus !== undefined, {
    message: "Provide tookIt and/or signalStatus",
  });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    const doc = await Analysis.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!doc) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    return NextResponse.json({
      signal: {
        id: doc._id.toString(),
        signalStatus: doc.signalStatus || "active",
        tookIt: doc.tookIt || "unset",
      },
    });
  } catch (error) {
    console.error("Signal PATCH error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}