import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { Analysis } from "@/models/Analysis";
import { SIGNAL_STATUSES } from "@/lib/analysis/types";

const WON: ("tp1" | "tp2" | "tp3")[] = ["tp1", "tp2", "tp3"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [overall, month, took, wonByYou, decidedByYou, decided] = await Promise.all([
      Analysis.countDocuments({
        userId: session.user.id,
        direction: { $ne: "neutral" },
      }),
      Analysis.countDocuments({
        userId: session.user.id,
        direction: { $ne: "neutral" },
        createdAt: { $gte: monthStart },
      }),
      Analysis.countDocuments({
        userId: session.user.id,
        direction: { $ne: "neutral" },
        tookIt: "yes",
      }),
      Analysis.countDocuments({
        userId: session.user.id,
        direction: { $ne: "neutral" },
        tookIt: "yes",
        signalStatus: { $in: WON },
      }),
      Analysis.countDocuments({
        userId: session.user.id,
        direction: { $ne: "neutral" },
        tookIt: "yes",
        signalStatus: { $in: [...WON, "stopped"] },
      }),
      Analysis.aggregate<{ won: number; stopped: number; active: number }>([
        {
          $match: {
            userId: session.user.id,
            direction: { $ne: "neutral" },
            signalStatus: { $in: [...WON, "stopped", "active"] },
          },
        },
        {
          $group: {
            _id: null,
            won: {
              $sum: { $cond: [{ $in: ["$signalStatus", WON] }, 1, 0] },
            },
            stopped: {
              $sum: { $cond: [{ $eq: ["$signalStatus", "stopped"] }, 1, 0] },
            },
            active: {
              $sum: { $cond: [{ $eq: ["$signalStatus", "active"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const decidedStats = decided[0] || { won: 0, stopped: 0, active: 0 };
    const closed = decidedStats.won + decidedStats.stopped;

    const aiWinRate =
      closed > 0 ? Math.round((decidedStats.won / closed) * 100) : null;
    const yourWinRate =
      decidedByYou > 0 ? Math.round((wonByYou / decidedByYou) * 100) : null;

    return NextResponse.json({
      stats: {
        totalSignals: overall,
        signalsThisMonth: month,
        activeSignals: decidedStats.active,
        aiWinRate,
        yourWinRate,
        signalsTraded: took,
        closedSignals: closed,
      },
      SIGNAL_STATUSES,
    });
  } catch (error) {
    console.error("Signal stats error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}