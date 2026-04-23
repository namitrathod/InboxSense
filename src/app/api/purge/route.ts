import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const CHROMA_URL = `${process.env.CHROMA_URL || "http://localhost:8000"}/api/v2/tenants/default_tenant/databases/default_database`;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[PURGE] User ${session.user.id} requested a total purge.`);

    // 1. Clear Prisma for this user
    await prisma.email.deleteMany({
      where: { userId: session.user.id }
    });

    // 2. Clear Chroma Collections for this user
    const name = `user_${session.user.id.replace(/-/g, '_')}_emails`;
    
    // Fetch all collections to find the ID
    const colRes = await fetch(`${CHROMA_URL}/collections`);
    const collections = await colRes.json();
    const collection = collections.find((c: any) => c.name === name);

    if (collection) {
      await fetch(`${CHROMA_URL}/collections/${collection.id}`, {
        method: "DELETE"
      });
    }

    return NextResponse.json({ success: true, message: "Index cleared successfully." });
  } catch (error: any) {
    console.error("Purge Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
