import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAutomationDiagnostics } from "@/lib/automation/diagnostics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const user = await User.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(await getAutomationDiagnostics(user), { headers: { "Cache-Control": "no-store" } });
}
