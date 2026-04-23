# System Architecture: InboxSense

This document outlines the architectural decisions and data flow of the InboxSense platform.

## 1. High-Level Data Flow

The system operates on a "Sync-Index-Retrieve" cycle designed for maximum reliability under free-tier constraints.

### A. Sync Layer (Gmail -> Prisma)
We utilize the Gmail API (v1) to fetch messages. Key optimizations:
- **Noise Filtering**: We apply a strict query filter (`-category:promotions -category:social`) to reduce vector database noise by approximately 60-70% for typical users.
- **Deduplication**: Prisma uses `externalId` (Gmail Message ID) as a unique constraint to prevent redundant processing.

### B. Index Layer (Prisma -> ChromaDB)
This is the most critical phase. 
- **Model**: `gemini-embedding-2-preview`.
- **Dimensions**: 3,072.
- **Strategy**: Due to the high semantic density of the 2026 multimodal embedding models, we implement a **4000ms cooldown** per request. This ensures compliance with the `requests_per_minute` limits of the Gemini 2.5 free tier.
- **Prefixing**: We use mandatory 2026 task prefixes (`task: search document |`) to optimize the vector space for retrieval rather than classification.

### C. Retrieval Layer (ChromaDB -> Gemini)
When a user asks a question:
1.  The query is embedded using the `task: query |` prefix.
2.  ChromaDB performs a cosine similarity search (Top-50 results).
3.  The top results are injected into a specialized **Executive Assistant Prompt**.
4.  The final generation is performed by `gemini-2.5-flash` via a direct REST call to bypass SDK overhead.

## 2. Decision Log

| Decision | Rationale |
| :--- | :--- |
| **Direct REST API** | The 2026 SDKs frequently lagged behind model releases. REST ensures we can use `v1` and `v1beta` features (like multimodal embeddings) the day they launch. |
| **Local ChromaDB** | Privacy is paramount for email. By keeping the vector store local (Dockerized), we ensure that PII (Personally Identifiable Information) never leaves the user's infrastructure except as an anonymous vector. |
| **Prisma/SQLite** | Provides a lightweight but structured metadata store that allows for complex relational filtering before passing data to the vector engine. |

## 3. Error Handling & Resilience
- **429 Recovery**: The indexing loop includes a 30-second "Deep Sleep" state when a `RESOURCE_EXHAUSTED` error is detected.
- **404 Mitigation**: The system is architected to be "Model Agnostic," allowing for easy rotation of model strings in `.env` as Google phases out older generations.
