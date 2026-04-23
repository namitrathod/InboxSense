# Development Guide

This guide covers the internal mechanics of building and maintaining InboxSense.

## 🛠️ Development Workflow

1.  **Environment Variables**: Ensure all keys in `.env` are populated. Never commit this file.
2.  **Database Migrations**: When changing the schema in `prisma/schema.prisma`:
    ```bash
    npx prisma db push
    npx prisma generate
    ```
3.  **Local API Testing**: You can test the REST endpoints directly using `curl` or Postman:
    - `POST /api/sync`: Triggers Gmail fetch.
    - `POST /api/index`: Triggers the slow vectorization loop.
    - `POST /api/purge`: Wipes all local state.

## 📊 Monitoring & Debugging

### Vector Logs
The system logs indexing progress to the standard terminal output. Look for:
- `[DEBUG] Found X relevant documents`: Indicates a successful ChromaDB query.
- `Rate limited. Waiting 30 seconds...`: Indicates we've hit the Gemini free-tier ceiling.

### ChromaDB Inspection
You can view the raw collections by hitting the Chroma REST API directly:
```bash
curl http://localhost:8000/api/v2/tenants/default_tenant/databases/default_database/collections
```

## ⚠️ Troubleshooting FAQ

### "Model not found (404)"
Google frequently rotates model names in the 2026 lifecycle. 
- **Action**: Check [Google AI Studio](https://aistudio.google.com/) for the latest model strings and update the `url` constants in `src/lib/vector.ts` and `src/app/api/search/route.ts`.

### "Quota Exhausted (429)"
The free tier for `gemini-embedding-2-preview` is strictly enforced.
- **Action**: Increase the `setTimeout` value in `src/lib/vector.ts` if you encounter persistent 429s during large inbox syncs.

### "Chroma Connection Refused"
Ensure the Docker container is running:
```bash
docker ps # Should show chromadb/chroma
```
