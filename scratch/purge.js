const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = require('node-fetch');

const CHROMA_URL = "http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database";

async function purge() {
  console.log("🚀 Starting Total Purge...");

  // 1. Clear Prisma
  const deletedEmails = await prisma.email.deleteMany({});
  console.log(`✅ Cleared ${deletedEmails.count} emails from Prisma.`);

  // 2. Clear Chroma Collections
  try {
    const res = await fetch(`${CHROMA_URL}/collections`);
    const collections = await res.json();
    
    for (const col of collections) {
      console.log(`🗑️ Deleting collection: ${col.name}`);
      await fetch(`${CHROMA_URL}/collections/${col.id}`, { method: 'DELETE' });
    }
    console.log("✅ All vector collections cleared.");
  } catch (err) {
    console.error("❌ Failed to clear Chroma:", err.message);
  }

  await prisma.$disconnect();
  console.log("✨ Purge complete. Your index is now empty and ready for a clean sync!");
}

purge();
