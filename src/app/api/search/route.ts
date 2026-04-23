import { auth } from "@/lib/auth";
import { searchEmails } from "@/lib/vector";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query } = await req.json();

    // 1. Get semantically relevant emails (Increased limit to 50 for max coverage)
    const searchResults = await searchEmails(session.user.id, query, 50);

    if (!searchResults.documents || searchResults.documents[0].length === 0) {
      return NextResponse.json({ answer: "I couldn't find any relevant emails." });
    }

    const context = searchResults.documents[0].join("\n---\n");
    console.log(`[DEBUG] Found ${searchResults.documents[0].length} relevant documents for query: ${query}`);
    console.log(`[DEBUG] First document snippet: ${searchResults.documents[0][0]?.substring(0, 100)}...`);

    // 2. Ask Gemini 2.5 via REST to be a high-accuracy Assistant
    const API_KEY = process.env.GOOGLE_AI_API_KEY || "";
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const prompt = `
      You are a high-accuracy AI Executive Assistant for a user's inbox. 
      Your goal is to provide 99% accurate answers based ONLY on the provided email data.
      
      INSTRUCTIONS:
      1. Answer the user's question naturally and comprehensively.
      2. Do not just look for times; look for meaning, details, and specific instructions within the emails.
      3. If there are multiple relevant events or details, summarize them all clearly.
      4. If the data is not in the provided emails, state that clearly rather than guessing.
      
      User Question: ${query}
      
      Email Data Source (Synced):
      ${context}
    `;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Gemini Generation Error: ${error}`);
    }

    const data = await res.json();
    const answer = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
