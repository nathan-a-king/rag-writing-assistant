
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { documentIngestionWorkflow } from './workflows/document-ingestion-workflow';
import { queryWorkflow } from './workflows/query-workflow';
import { writingAssistantAgent } from './agents/writing-assistant-agent';
import { resolve } from 'path';

const projectRoot = process.cwd().includes('.mastra/output')
  ? resolve(process.cwd(), '../..')
  : process.cwd();

export const mastra = new Mastra({
  workflows: {
    documentIngestionWorkflow,
    queryWorkflow
  },
  agents: {
    writingAssistantAgent
  },
  storage: new LibSQLStore({
    url: `file:${resolve(projectRoot, 'mastra.db')}`,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
