import { auth } from "@/lib/auth";
import { syncEmails } from "@/lib/gmail";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const emails = await syncEmails(session.user.id);
    return NextResponse.json({ 
      success: true, 
      count: emails.length,
      message: `Successfully synced ${emails.length} new emails.`
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to sync emails" 
    }, { status: 500 });
  }
}
