
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { documentIngestionWorkflow } from './workflows/document-ingestion-workflow';
import { queryWorkflow } from './workflows/query-workflow';
import { writingAssistantAgent } from './agents/writing-assistant-agent';

export const mastra = new Mastra({
  workflows: {
    documentIngestionWorkflow,
    queryWorkflow
  },
  agents: {
    writingAssistantAgent
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
