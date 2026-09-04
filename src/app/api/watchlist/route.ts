import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { Watchlist } from "@/models/Watchlist";

const entrySchema = z.object({
  symbol: z.string().trim().min(1).max(20),
  pair: z.string().trim().min(1).max(20),
  timeframe: z.string().trim().max(10),
  direction: z.enum(["buy", "sell"]),
  entryPrice: z.number(),
  takeProfits: z.array(z.number()).optional(),
  stopLoss: z.number().optional(),
  note: z.string().trim().max(200).optional(),
});

const addSchema = z.object({
  entry: entrySchema,
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const watchlist = await Watchlist.findOne({ userId: session.user.id }).lean();

    return NextResponse.json({
      watchlist: watchlist
        ? {
            id: watchlist._id.toString(),
            name: watchlist.name,
            entries: watchlist.entries || [],
          }
        : { name: "My Watchlist", entries: [] },
    });
  } catch (error) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await dbConnect();
    let watchlist = await Watchlist.findOne({ userId: session.user.id });
    if (!watchlist) {
      watchlist = await Watchlist.create({
        userId: session.user.id,
        name: "My Watchlist",
        entries: [],
      });
    }

    watchlist.entries.push(parsed.data.entry);
    await watchlist.save();

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
