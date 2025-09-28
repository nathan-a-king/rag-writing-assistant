Comprehensive Project Plan: Writing Workflow with RAG

  Overview

  Build a RAG (Retrieval-Augmented Generation) system that:
  1. Ingests markdown files from a directory
  2. Generates embeddings using Voyage AI (voyage-3-large)
  3. Stores embeddings in a local vector database
  4. Enables GPT-5 queries with semantic search over the document corpus

  ---
  Architecture

  Components

  1. Tools
  - markdown-reader-tool: Reads and chunks markdown files from a directory
  - voyage-embedding-tool: Generates embeddings using Voyage AI API
  - vector-store-tool: Stores and retrieves embeddings from vector database
  - semantic-search-tool: Queries vector database for relevant document chunks

  2. Agents
  - writing-assistant-agent: Uses GPT-5 (o1/gpt-5) with semantic search tool to answer questions based on document corpus

  3. Workflows
  - document-ingestion-workflow: Reads markdown → chunks → embeds → stores in vector DB
  - query-workflow: User query → embed query → search vectors → generate response with context

  ---
  Technology Stack

  Vector Database Options (pick one):
  - PgVector (PostgreSQL): Production-ready, excellent for local development with Docker
  - Chroma: Lightweight, embedded database, zero-config
  - LibSQL: Already in use for Mastra storage, supports vectors

  Recommended: LibSQL - Already integrated, minimal setup

  Dependencies to Add:
  npm install voyageai @mastra/libsql
  # LibSQL already installed, supports vector operations

  ---
  Implementation Plan

  Phase 1: Setup & Infrastructure

  1. Add Voyage AI npm package
  2. Configure LibSQL with vector support
  3. Create documents/ directory for markdown files
  4. Update .env with VOYAGE_API_KEY (already done)

  Phase 2: Document Ingestion

  1. markdown-reader-tool:
	- Scan directory for .md files
	- Read file content
	- Split into chunks (~500-1000 tokens each)
	- Preserve metadata (filename, section, date)
  2. voyage-embedding-tool:
	- Accept text chunks as input
	- Call Voyage API with voyage-3-large model
	- Use input_type: "document" for ingestion
	- Handle batching (max 120K tokens per request)
	- Output dimension: 1024 (default for voyage-3-large)
  3. document-ingestion-workflow:
	- Step 1: Read and chunk markdown files
	- Step 2: Generate embeddings for all chunks
	- Step 3: Upsert to vector database with metadata

  Phase 3: Query System

  1. semantic-search-tool:
	- Embed query using Voyage (input_type: "query")
	- Perform cosine similarity search in vector DB
	- Return top K relevant chunks (K=5-10)
	- Include metadata and relevance scores
  2. writing-assistant-agent:
	- Model: gpt-5 or o1 (when available via OpenAI)
	- Tools: semantic-search-tool
	- Instructions: Use retrieved context to answer questions accurately
	- Memory: Track conversation history
  3. query-workflow:
	- Step 1: Embed user query
	- Step 2: Retrieve relevant chunks
	- Step 3: Pass to agent for response generation
	- Step 4: Stream response to user

  Phase 4: Testing & Optimization

  1. Create sample markdown documents
  2. Test ingestion pipeline
  3. Validate embedding quality
  4. Test query accuracy with various questions
  5. Optimize chunk size and retrieval parameters

  ---
  File Structure

  src/mastra/
  ├── agents/
  │   ├── weather-agent.ts (existing)
  │   └── writing-assistant-agent.ts (new)
  ├── tools/
  │   ├── weather-tool.ts (existing)
  │   ├── markdown-reader-tool.ts (new)
  │   ├── voyage-embedding-tool.ts (new)
  │   ├── vector-store-tool.ts (new)
  │   └── semantic-search-tool.ts (new)
  ├── workflows/
  │   ├── weather-workflow.ts (existing)
  │   ├── document-ingestion-workflow.ts (new)
  │   └── query-workflow.ts (new)
  └── index.ts (update to register new components)

  documents/ (new directory for markdown files)

  ---
  Configuration Considerations

  Voyage API:
  - Model: voyage-3-large
  - Output dimension: 1024
  - Input types: document (ingestion), query (search)
  - Batch size: Stay under 120K tokens
  - Rate limits: Monitor API usage

  Vector Database:
  - Dimension: 1024 (matching voyage-3-large)
  - Similarity metric: Cosine similarity
  - Index type: HNSW or IVF for large datasets

  Chunking Strategy:
  - Size: 500-1000 tokens per chunk
  - Overlap: 100-200 tokens between chunks
  - Preserve markdown structure (headers, lists, code blocks)

  GPT-5 Configuration:
  - Temperature: 0.1-0.3 (factual responses)
  - Max context: Use top 5-10 chunks (~5000 tokens)
  - System prompt: Emphasize using provided context

  ---
  Next Steps

  Would you like me to proceed with implementation? I can start by:
  1. Installing dependencies (voyageai package)
  2. Setting up the documents directory
  3. Creating the markdown reader and Voyage embedding tools
  4. Building the document ingestion workflow

  Let me know if you'd like to adjust any part of this plan or have specific preferences for the vector database choice.

  Todos
  ☒ Research and understand Mastra's vector database integration options
  ☐ Design the embedding generation tool using Voyage AI
  ☐ Design the vector database storage layer
  ☐ Create markdown file reader and processor tool
  ☐ Implement embedding workflow for batch processing markdown files
  ☐ Create vector search tool for querying embeddings
  ☐ Implement writing assistant agent with GPT-5 and vector search
  ☐ Create query workflow that orchestrates search and response generation
  ☐ Set up markdown documents directory structure
  ☐ Test the complete pipeline with sample markdown files
  
  Implementation Complete
  
	I've successfully implemented the writing workflow system with RAG capabilities. Here's what was created:
  
	Core Components
  
	Tools (in src/mastra/tools/):
	- voyage-embedding-tool.ts - Generates embeddings using Voyage AI voyage-3-large
	- markdown-reader-tool.ts - Reads and chunks markdown files (800 tokens/chunk, 200 token overlap)
	- vector-store-tool.ts - Stores embeddings in LibSQL database with cosine similarity search
	- semantic-search-tool.ts - Combines query embedding + vector search
  
	Agent:
	- writing-assistant-agent.ts - GPT-4o agent with semantic search tool and memory
  
	Workflows:
	- document-ingestion-workflow.ts - Reads docs → generates embeddings → stores in DB
	- query-workflow.ts - Processes user queries through the writing assistant
  
	Sample Documents (in documents/):
	- typescript-best-practices.md
	- react-patterns.md
	- ai-agent-development.md
  
	How to Use
  
	1. Ingest documents (first time setup):
	npm run dev
	# Then access the document-ingestion-workflow
	2. Query the system:
	# Access the query-workflow or writing-assistant-agent
	# Ask questions like: "What are TypeScript best practices?"
	3. Add more documents:
	  - Place markdown files in documents/ directory
	  - Run document-ingestion-workflow again to index new files
  
	Technical Details
  
	- Embeddings: voyage-3-large with 1024 dimensions
	- Vector DB: LibSQL with cosine similarity search
	- Chunking: ~800 tokens per chunk with 200 token overlap
	- Model: GPT-4o (can upgrade to GPT-5/o1 when available)
	- Database: vectors.db for embeddings, mastra.db for agent memory
  
	The build succeeded with no errors. The system is ready to use via npm run dev.
	