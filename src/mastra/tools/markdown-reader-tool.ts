import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

interface DocumentChunk {
  content: string;
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

function chunkText(text: string, chunkSize: number = 800, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordLength = word.length + 1;

    if (currentLength + wordLength > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));

      const overlapWords = Math.floor(overlap / (currentLength / currentChunk.length));
      currentChunk = currentChunk.slice(-overlapWords);
      currentLength = currentChunk.join(' ').length;
    }

    currentChunk.push(word);
    currentLength += wordLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks.length > 0 ? chunks : [text];
}

export const markdownReaderTool = createTool({
  id: 'read-markdown-files',
  description: 'Read and chunk markdown files from the documents directory',
  inputSchema: z.object({
    directoryPath: z.string().describe('Path to the documents directory').default('documents'),
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
  execute: async ({ context }) => {
    const { directoryPath } = context;
    const projectRoot = process.cwd().includes('.mastra/output')
      ? resolve(process.cwd(), '../..')
      : process.cwd();
    const absolutePath = join(projectRoot, directoryPath);

    const files = readdirSync(absolutePath).filter((file) => file.endsWith('.md'));

    const allChunks: DocumentChunk[] = [];

    for (const file of files) {
      const filePath = join(absolutePath, file);
      const content = readFileSync(filePath, 'utf-8');

      const textChunks = chunkText(content);

      textChunks.forEach((chunk, index) => {
        allChunks.push({
          content: chunk,
          metadata: {
            filename: file,
            chunkIndex: index,
            totalChunks: textChunks.length,
          },
        });
      });
    }

    return {
      chunks: allChunks,
      totalFiles: files.length,
      totalChunks: allChunks.length,
    };
  },
});