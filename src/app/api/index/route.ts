import { auth } from "@/lib/auth";
import { indexEmails } from "@/lib/vector";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await indexEmails(session.user.id);
    return NextResponse.json({ 
      success: true, 
      count,
      message: `Successfully indexed ${count} emails into the vector store.`
    });
  } catch (error: any) {
    console.error("Indexing Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to index emails" 
    }, { status: 500 });
  }
}
