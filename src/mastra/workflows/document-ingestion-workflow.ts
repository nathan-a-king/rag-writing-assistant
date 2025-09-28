import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { markdownReaderTool } from '../tools/markdown-reader-tool';
import { voyageEmbeddingTool } from '../tools/voyage-embedding-tool';
import { vectorStoreTool } from '../tools/vector-store-tool';

const readDocuments = createStep({
  id: 'read-documents',
  description: 'Read and chunk markdown files from documents directory',
  inputSchema: z.object({
    directoryPath: z.string().default('documents'),
  }),
  outputSchema: z.object({
    chunks: z.array(
      z.object({
        content: z.string(),
        metadata: z.object({
          filename: z.string(),
          chunkIndex: z.number(),
          totalChunks: z.number(),
        }),
      })
    ),
    totalFiles: z.number(),
    totalChunks: z.number(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const result = await markdownReaderTool.execute({
      context: { directoryPath: inputData.directoryPath },
    });

    console.log(
      `Read ${result.totalFiles} files and created ${result.totalChunks} chunks`
    );

    return result;
  },
});

const generateEmbeddings = createStep({
  id: 'generate-embeddings',
  description: 'Generate embeddings for document chunks using Voyage AI',
  inputSchema: z.object({
    chunks: z.array(
      z.object({
        content: z.string(),
        metadata: z.object({
          filename: z.string(),
          chunkIndex: z.number(),
          totalChunks: z.number(),
        }),
      })
    ),
  }),
  outputSchema: z.object({
    embeddings: z.array(
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
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const { chunks } = inputData;

    const batchSize = 128;
    const allEmbeddings: {
      content: string;
      embedding: number[];
      metadata: {
        filename: string;
        chunkIndex: number;
        totalChunks: number;
      };
    }[] = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map((chunk) => chunk.content);

      console.log(
        `Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`
      );

      const result = await voyageEmbeddingTool.execute({
        context: {
          texts,
          inputType: 'document',
        },
      });

      result.embeddings.forEach((embedding, index) => {
        allEmbeddings.push({
          content: batch[index].content,
          embedding,
          metadata: batch[index].metadata,
        });
      });

      console.log(`Processed ${allEmbeddings.length}/${chunks.length} chunks`);
    }

    return {
      embeddings: allEmbeddings,
    };
  },
});

const storeEmbeddings = createStep({
  id: 'store-embeddings',
  description: 'Store embeddings in vector database',
  inputSchema: z.object({
    embeddings: z.array(
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
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const result = await vectorStoreTool.execute({
      context: {
        chunks: inputData.embeddings,
      },
    });

    console.log(`Stored ${result.stored} embeddings in vector database`);

    return result;
  },
});

export const documentIngestionWorkflow = createWorkflow({
  id: 'document-ingestion-workflow',
  inputSchema: z.object({
    directoryPath: z.string().default('documents'),
  }),
  outputSchema: z.object({
    stored: z.number(),
    success: z.boolean(),
  }),
})
  .then(readDocuments)
  .then(generateEmbeddings)
  .then(storeEmbeddings);

documentIngestionWorkflow.commit();