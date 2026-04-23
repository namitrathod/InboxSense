import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const CHROMA_URL = `${process.env.CHROMA_URL || "http://localhost:8000"}/api/v2/tenants/default_tenant/databases/default_database`;

async function chromaFetch(endpoint: string, method = "GET", body?: any) {
  const res = await fetch(`${CHROMA_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Chroma Error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function getEmbeddings(text: string, isQuery = false) {
  const API_KEY = process.env.GOOGLE_AI_API_KEY || "";
  // The official March 2026 multimodal model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent?key=${API_KEY}`;
  
  const prefix = isQuery ? "task: query | " : "task: search document | ";
  const contentWithPrefix = `${prefix}${text}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text: contentWithPrefix }] }
    })
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google Embedding Error: ${error}`);
  }

  const data = await res.json();
  return data.embedding.values;
}

export async function getOrCreateCollection(name: string) {
  const collections = await chromaFetch("/collections");
  let collection = collections.find((c: any) => c.name === name);
  
  if (!collection) {
    collection = await chromaFetch("/collections", "POST", { name });
  }
  return collection;
}

export async function indexEmails(userId: string) {
  const emails = await prisma.email.findMany({
    where: { userId },
    take: 100, // Increased to capture more history
    orderBy: { receivedAt: 'desc' }
  });

  const name = `user_${userId.replace(/-/g, '_')}_emails`;
  const collection = await getOrCreateCollection(name);

  console.log(`Starting slow index for ${emails.length} emails (4s delay)...`);

  for (const email of emails) {
    const textToEmbed = `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.body.substring(0, 5000)}`;
    
    try {
      const embedding = await getEmbeddings(textToEmbed, false);

      await chromaFetch(`/collections/${collection.id}/add`, "POST", {
        ids: [email.id],
        embeddings: [embedding],
        metadatas: [{
          subject: email.subject,
          from: email.from,
          receivedAt: email.receivedAt.toISOString(),
          threadId: email.threadId
        }],
        documents: [textToEmbed]
      });

      console.log(`Indexed: ${email.subject}`);
      
      // High stability delay for 2026 free tier
      await new Promise(resolve => setTimeout(resolve, 4000));
      
    } catch (err: any) {
      console.error(`Failed to index ${email.id}: ${err.message}`);
      if (err.message.includes("429")) {
        console.log("Rate limited. Waiting 30 seconds...");
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  return emails.length;
}

export async function searchEmails(userId: string, query: string, limit = 5) {
  const name = `user_${userId.replace(/-/g, '_')}_emails`;
  const collection = await getOrCreateCollection(name);
  const queryEmbedding = await getEmbeddings(query, true);

  const results = await chromaFetch(`/collections/${collection.id}/query`, "POST", {
    query_embeddings: [queryEmbedding],
    n_results: limit,
  });

  return results;
}
