import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { getUsersWithPayments } from "@/lib/admin/data";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getUsersWithPayments();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
