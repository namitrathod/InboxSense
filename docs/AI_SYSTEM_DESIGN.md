# AI System Design: InboxSense (Gemini 2.5 & 3.1)

This document deep-dives into the implementation of the Google AI models within the platform.

## 1. Model Selection Strategy (April 2026)

| Model Role | Model ID | Reason |
| :--- | :--- | :--- |
| **Embeddings** | `gemini-embedding-2-preview` | Selected for its 3,072-dimension semantic density and native multimodal support (PDF/Image compatibility). |
| **Reasoning** | `gemini-2.5-flash` | Balanced for speed and complex reasoning. Provides stable generation for the "Executive Assistant" persona. |

## 2. The Retrieval-Augmented Generation (RAG) Loop

### Task-Specific Prefixing
In the 2026 Gemini ecosystem, embeddings are not universal. We utilize **Task Prefixes** to steer the vector space:

- **Indexing Phase**: `task: search document | `
  - Optimizes the vector for "document storage" within a searchable index.
- **Search Phase**: `task: query | `
  - Transforms the user's question into a "retrieval vector" that matches document-style embeddings.

### Semantic Search vs. Keyword Search
Traditional search fails on queries like "What did my boss say about the project?". Our system:
1.  Embeds the *meaning* of the question.
2.  Finds emails with *similar meaning* (even if the word "project" isn't present).
3.  Injects those emails as "Truth Context" into the LLM prompt.

## 3. Intelligent Prompt Engineering

Our prompt utilizes a **System Role Definition** to ensure accuracy:

```text
You are a high-accuracy AI Executive Assistant...
1. Answer naturally...
2. Do not just look for times...
3. 99% Data Fidelity...
```

This engineering ensures the LLM doesn't "hallucinate" information that isn't present in the local database.

## 4. Scalability Considerations
While the current implementation is optimized for the **Free Tier**, the REST-based architecture allows for a seamless transition to the **Pay-as-you-go** tier by simply switching the endpoint from `v1beta` to `v1` (where applicable) and removing the rate-limiting delays.
