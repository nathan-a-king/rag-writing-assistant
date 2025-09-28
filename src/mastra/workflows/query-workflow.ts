import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const processQuery = createStep({
  id: 'process-query',
  description: 'Process user query using writing assistant agent with semantic search',
  inputSchema: z.object({
    query: z.string().describe('User query to process'),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('writingAssistantAgent');
    if (!agent) {
      throw new Error('Writing assistant agent not found');
    }

    const response = await agent.stream([
      {
        role: 'user',
        content: inputData.query,
      },
    ]);

    let responseText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      responseText += chunk;
    }

    console.log('\n');

    return {
      response: responseText,
    };
  },
});

export const queryWorkflow = createWorkflow({
  id: 'query-workflow',
  inputSchema: z.object({
    query: z.string().describe('User query to process'),
  }),
  outputSchema: z.object({
    response: z.string(),
  }),
}).then(processQuery);

queryWorkflow.commit();