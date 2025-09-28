import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:./vectors.db',
});

async function initializeVectorTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS document_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      embedding BLOB NOT NULL,
      filename TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      total_chunks INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_filename ON document_embeddings(filename)
  `);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const vectorStoreTool = createTool({
  id: 'store-embeddings',
  description: 'Store document chunks with their embeddings in vector database',
  inputSchema: z.object({
    chunks: z.array(
      z.object({
        content: z.string(),
        embedding: z.array(z.number()),
        metadata: z.object({
          filename: z.string(),
          chunkIndex: z.number(),
          totalChunks: z.number(),
        }),
      })
    ),
  }),
  outputSchema: z.object({
    stored: z.number(),
    success: z.boolean(),
  }),
  execute: async ({ context }) => {
    await initializeVectorTable();

    const { chunks } = context;

    for (const chunk of chunks) {
      const embeddingBuffer = Buffer.from(
        new Float32Array(chunk.embedding).buffer
      );

      await client.execute({
        sql: `INSERT INTO document_embeddings
              (content, embedding, filename, chunk_index, total_chunks)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          chunk.content,
          embeddingBuffer,
          chunk.metadata.filename,
          chunk.metadata.chunkIndex,
          chunk.metadata.totalChunks,
        ],
      });
    }

    return {
      stored: chunks.length,
      success: true,
    };
  },
});

export const vectorSearchTool = createTool({
  id: 'search-embeddings',
  description: 'Search for similar document chunks using vector similarity',
  inputSchema: z.object({
    queryEmbedding: z.array(z.number()).describe('Embedding vector of the query'),
    topK: z.number().describe('Number of results to return').default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        filename: z.string(),
        chunkIndex: z.number(),
        similarity: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { queryEmbedding, topK } = context;

    const rows = await client.execute('SELECT * FROM document_embeddings');

    const results = rows.rows.map((row) => {
      const embeddingBuffer = row.embedding as Buffer;
      const embedding = Array.from(new Float32Array(embeddingBuffer.buffer));

      const similarity = cosineSimilarity(queryEmbedding, embedding);

      return {
        content: row.content as string,
        filename: row.filename as string,
        chunkIndex: row.chunk_index as number,
        similarity,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    return {
      results: results.slice(0, topK),
    };
  },
});