import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { VoyageAIClient } from 'voyageai';

const client = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY,
});

export const voyageEmbeddingTool = createTool({
  id: 'generate-embeddings',
  description: 'Generate embeddings using Voyage AI voyage-3-large model',
  inputSchema: z.object({
    texts: z.array(z.string()).describe('Array of text strings to embed'),
    inputType: z
      .enum(['document', 'query'])
      .describe('Type of input: document for storage, query for search')
      .default('document'),
  }),
  outputSchema: z.object({
    embeddings: z.array(z.array(z.number())).describe('Array of embedding vectors'),
    model: z.string(),
    totalTokens: z.number(),
  }),
  execute: async ({ context }) => {
    const { texts, inputType } = context;

    const response = await client.embed({
      input: texts,
      model: 'voyage-3-large',
      inputType: inputType,
      outputDimension: 1024,
    });

    return {
      embeddings: response.data.map((item) => item.embedding),
      model: response.model,
      totalTokens: response.usage.totalTokens,
    };
  },
});