import { google } from "googleapis";
import { prisma } from "./prisma";

export async function getGmailClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account || !account.access_token) {
    throw new Error("No Google account linked or access token missing");
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  return google.gmail({ version: "v1", auth });
}

export async function syncEmails(userId: string) {
  const gmail = await getGmailClient(userId);
  
  // 1. Get list of messages (Exclude promotions/social, increase to 100)
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 100,
    q: "newer_than:30d -category:promotions -category:social",
  });

  const messages = response.data.messages || [];
  const results = [];

  for (const message of messages) {
    if (!message.id) continue;

    // Check if we already have this email
    const existing = await prisma.email.findUnique({
      where: { externalId: message.id },
    });

    if (existing) continue;

    // 2. Fetch full message details
    const fullMessage = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
    });

    const headers = fullMessage.data.payload?.headers;
    const subject = headers?.find((h) => h.name === "Subject")?.value || "(No Subject)";
    const from = headers?.find((h) => h.name === "From")?.value || "Unknown";
    const date = headers?.find((h) => h.name === "Date")?.value || new Date().toISOString();
    
    // Simple body extraction (look for text/plain)
    let body = "";
    const parts = fullMessage.data.payload?.parts || [];
    const textPart = parts.find((p) => p.mimeType === "text/plain");
    
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else if (fullMessage.data.snippet) {
      body = fullMessage.data.snippet;
    }

    // 3. Save to database
    const saved = await prisma.email.create({
      data: {
        userId,
        externalId: message.id,
        threadId: message.threadId || message.id,
        subject,
        from,
        to: "me",
        body,
        receivedAt: new Date(date),
      },
    });

    results.push(saved);
  }

  return results;
}
