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

    console.log(`[SemanticSearch] Retrieved ${rows.rows.length} chunks from database`);

    const results = rows.rows.map((row, index) => {
      let embedding: number[];

      const embeddingData = row.embedding;

      if (index === 0) {
        console.log(`[SemanticSearch] First embedding type: ${typeof embeddingData}`);
        console.log(`[SemanticSearch] Is Uint8Array: ${embeddingData instanceof Uint8Array}`);
        console.log(`[SemanticSearch] Is Buffer: ${Buffer.isBuffer(embeddingData)}`);
        console.log(`[SemanticSearch] Constructor: ${embeddingData?.constructor?.name}`);
        if (typeof embeddingData === 'object' && embeddingData !== null) {
          console.log(`[SemanticSearch] Object keys: ${Object.keys(embeddingData).slice(0, 10)}`);
          console.log(`[SemanticSearch] Has type property: ${embeddingData.type}`);
        }
      }

      if (embeddingData instanceof ArrayBuffer) {
        embedding = Array.from(new Float32Array(embeddingData));
      } else if (embeddingData instanceof Uint8Array) {
        embedding = Array.from(new Float32Array(embeddingData.buffer, embeddingData.byteOffset, embeddingData.byteLength / 4));
      } else if (Buffer.isBuffer(embeddingData)) {
        embedding = Array.from(new Float32Array(embeddingData.buffer, embeddingData.byteOffset, embeddingData.byteLength / 4));
      } else if (typeof embeddingData === 'object' && embeddingData !== null) {
        if (embeddingData.type === 'Buffer' && Array.isArray(embeddingData.data)) {
          const buffer = Buffer.from(embeddingData.data);
          embedding = Array.from(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4));
        } else {
          const buffer = Buffer.from(Object.values(embeddingData));
          embedding = Array.from(new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4));
        }
      } else {
        throw new Error(`Unexpected embedding type: ${typeof embeddingData}, constructor: ${embeddingData?.constructor?.name}`);
      }

      const similarity = cosineSimilarity(queryEmbedding, embedding);

      return {
        content: row.content as string,
        filename: row.filename as string,
        chunkIndex: row.chunk_index as number,
        similarity,
      };
    });

    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`[SemanticSearch] Top 5 results:`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.filename} (similarity: ${r.similarity.toFixed(4)})`);
    });

    return {
      results: results.slice(0, topK),
    };
  },
});