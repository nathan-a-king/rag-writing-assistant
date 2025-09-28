import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { VoyageAIClient } from 'voyageai';
import { createClient } from '@libsql/client';
import { resolve } from 'path';

const voyageClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

const projectRoot = process.cwd().includes('.mastra/output')
  ? resolve(process.cwd(), '../..')
  : process.cwd();

const dbClient = createClient({
  url: `file:${resolve(projectRoot, 'vectors.db')}`,
});

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

export const semanticSearchTool = createTool({
  id: 'semantic-search',
  description:
    'Search for relevant document chunks based on semantic similarity to a query',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
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
    const { query, topK } = context;

    const embeddingResponse = await voyageClient.embed({
      input: [query],
      model: 'voyage-3-large',
      inputType: 'query',
      outputDimension: 1024,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    const rows = await dbClient.execute('SELECT * FROM document_embeddings');

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