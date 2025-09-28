# Writing Agent

A RAG (Retrieval-Augmented Generation) system for querying your own writing using semantic search. Built with [Mastra](https://mastra.ai), [Voyage AI](https://voyageai.com), and LibSQL.

## Overview

Writing Agent processes markdown documents, generates embeddings using Voyage AI's `voyage-3-large` model, and stores them in a local vector database. You can then query your documents using natural language, and GPT-4o synthesizes answers based on semantically similar content from your corpus.

## Features

- **Document Ingestion**: Automatically processes markdown files with intelligent chunking (800 tokens with 200 token overlap)
- **Semantic Search**: Uses Voyage AI embeddings (1024 dimensions) for high-quality similarity search
- **Conversational Interface**: Query your documents through a chat interface with GPT-4o
- **Persistent Memory**: Conversation history and embeddings persist across sessions
- **Local Storage**: Everything runs locally using LibSQL - no external database required

## Architecture

### Components

- **Tools**: Reusable functions for reading files, generating embeddings, and searching
- **Workflows**: Multi-step processes for document ingestion and query handling
- **Agent**: GPT-4o-powered writing assistant with access to semantic search
- **Vector Database**: LibSQL stores embeddings with cosine similarity search

### How It Works

1. **Document Ingestion Workflow**:
   - Reads markdown files from `documents/` directory
   - Chunks documents into ~800 token segments with 200 token overlap
   - Generates embeddings using Voyage AI `voyage-3-large` (1024-dimensional vectors)
   - Stores embeddings and content in LibSQL database

2. **Query Workflow**:
   - User asks a question
   - Query is embedded using Voyage AI (`input_type: 'query'`)
   - System performs cosine similarity search across all document chunks
   - Top K relevant chunks are retrieved
   - GPT-4o synthesizes an answer based on retrieved context

## Prerequisites

- Node.js >= 20.9.0
- OpenAI API key
- Voyage AI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/writing-agent.git
   cd writing-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your-openai-api-key
   VOYAGE_API_KEY=your-voyage-api-key
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

### 1. Add Your Documents

Place your markdown files in the `documents/` directory:

```bash
cp your-blog-posts/*.md documents/
```

### 2. Start the Development Server

```bash
npm run dev
```

This starts the Mastra development server with a web UI for interacting with workflows and agents.

### 3. Ingest Documents

Run the **document-ingestion-workflow** through the Mastra UI. This will:
- Read all `.md` files from `documents/`
- Generate embeddings (may take several minutes depending on document count)
- Store everything in `vectors.db`

You'll see progress in the console:
```
Read 14 files and created 136 chunks
Generating embeddings for batch 1/2
Processed 128/136 chunks
Stored 136 embeddings in vector database
```

### 4. Query Your Documents

Use the **writing-assistant-agent** or **query-workflow** to ask questions:

- "What have I written about AI-native design?"
- "Summarize my thoughts on RAG systems"
- "What did I say about TypeScript best practices?"

The agent will search your documents and provide synthesized answers with citations.

## Project Structure

```
writing-agent/
├── src/
│   └── mastra/
│       ├── agents/
│       │   └── writing-assistant-agent.ts    # GPT-4o agent with semantic search
│       ├── tools/
│       │   ├── markdown-reader-tool.ts        # Reads and chunks markdown files
│       │   ├── voyage-embedding-tool.ts       # Generates Voyage AI embeddings
│       │   ├── vector-store-tool.ts           # Stores embeddings in LibSQL
│       │   └── semantic-search-tool.ts        # Searches for similar content
│       ├── workflows/
│       │   ├── document-ingestion-workflow.ts # Ingestion pipeline
│       │   └── query-workflow.ts              # Query processing
│       └── index.ts                           # Mastra configuration
├── documents/                                 # Your markdown files go here
├── vectors.db                                 # Vector embeddings (created on first run)
├── mastra.db                                  # Mastra telemetry
├── agent-memory.db                            # Conversation history
└── package.json
```

## Configuration

### Chunking Strategy

Documents are split into chunks with the following parameters (configurable in `markdown-reader-tool.ts`):

- **Chunk size**: 800 tokens
- **Overlap**: 200 tokens

This preserves context across chunk boundaries while keeping chunks small enough for efficient retrieval.

### Embedding Model

Using Voyage AI's `voyage-3-large`:
- **Dimensions**: 1024
- **Input types**: `document` for ingestion, `query` for search
- **Max tokens per request**: 120K

### Vector Search

- **Similarity metric**: Cosine similarity
- **Top K results**: 5 (configurable in queries)
- **Database**: LibSQL (SQLite fork)

## Commands

- `npm run dev` - Start Mastra development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Database Management

### Clear Vector Database

To re-ingest all documents from scratch:

```bash
rm vectors.db
npm run dev
# Then run document-ingestion-workflow again
```

### Clear Conversation History

```bash
rm agent-memory.db
```

### View Database Contents

```bash
sqlite3 vectors.db "SELECT COUNT(*) as chunks, COUNT(DISTINCT filename) as files FROM document_embeddings;"
```

## API Costs

Approximate costs for typical usage:

- **Voyage AI**: ~$0.12 per million tokens (~$0.02 per 10 blog posts for embedding)
- **OpenAI GPT-4o**: ~$5 per million input tokens, ~$15 per million output tokens

A typical query costs < $0.01 (embedding query + GPT-4o generation).

## Troubleshooting

### Embeddings Return NaN

This was an issue with how LibSQL returns blob data. The fix checks for `ArrayBuffer` type first. If you encounter this, ensure you're running the latest version.

### Documents Not Found

The markdown reader uses a path resolution strategy to work from both development and built environments. If documents aren't found:

1. Verify files are in `documents/` directory
2. Check they have `.md` extension
3. Review console logs for path resolution

### Memory Not Persisting

All databases are stored in the project root:
- `vectors.db` - embeddings
- `mastra.db` - Mastra storage
- `agent-memory.db` - conversation history

Ensure these files aren't being deleted between sessions.

## Development

### Adding New Tools

Tools are created using Mastra's `createTool()` function:

```typescript
export const myTool = createTool({
  id: 'my-tool',
  description: 'What this tool does',
  inputSchema: z.object({ /* zod schema */ }),
  outputSchema: z.object({ /* zod schema */ }),
  execute: async ({ context }) => {
    // Implementation
  }
});
```

### Creating Workflows

Workflows chain steps together:

```typescript
const step1 = createStep({ /* ... */ });
const step2 = createStep({ /* ... */ });

export const myWorkflow = createWorkflow({
  id: 'my-workflow',
  inputSchema: z.object({ /* ... */ }),
  outputSchema: z.object({ /* ... */ })
})
  .then(step1)
  .then(step2);

myWorkflow.commit();
```

Register workflows in `src/mastra/index.ts`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT

## Acknowledgments

- Built with [Mastra](https://mastra.ai) - TypeScript AI agent framework
- Embeddings by [Voyage AI](https://voyageai.com)
- Vector storage using [LibSQL](https://github.com/tursodatabase/libsql)
- Language model by [OpenAI](https://openai.com)

---

**Note**: This project is designed for personal use with your own writing. Ensure you have the right to process and embed any documents you add to the system.