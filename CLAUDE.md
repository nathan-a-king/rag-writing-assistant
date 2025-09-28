# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Mastra-based AI application that demonstrates agentic workflows and tools. The project uses Mastra framework for building AI agents with integrated tools, workflows, and memory.

## Commands

- **Development**: `npm run dev` - Start Mastra development server
- **Build**: `npm run build` - Build the project
- **Production**: `npm run start` - Start production server

## Architecture

### Core Structure

The application is organized around Mastra's core concepts:

- **`src/mastra/index.ts`**: Main Mastra instance configuration
  - Registers agents, workflows, storage, and logging
  - Uses LibSQLStore for telemetry/evals (currently in-memory, can switch to `file:../mastra.db` for persistence)
  - PinoLogger for structured logging

- **`src/mastra/agents/`**: AI agents with specific capabilities
  - Each agent has: name, instructions, model (via AI SDK), tools, and memory
  - Memory storage uses LibSQLStore with paths relative to `.mastra/output` directory
  - Example: `weather-agent.ts` uses GPT-4o-mini with weatherTool

- **`src/mastra/tools/`**: Reusable tools that agents can use
  - Created with `createTool()` from `@mastra/core/tools`
  - Define: id, description, inputSchema (Zod), outputSchema (Zod), execute function
  - Tools receive context object with input parameters

- **`src/mastra/workflows/`**: Multi-step orchestrated processes
  - Created with `createWorkflow()` and `createStep()`
  - Steps chain together with `.then()` and share data through schemas
  - Steps can access Mastra instance via `mastra` parameter to get agents
  - Call `.commit()` to finalize workflow definition

### Key Patterns

**Agent Integration in Workflows**: Workflows can invoke agents by accessing them through the `mastra` parameter:
```typescript
const agent = mastra?.getAgent('agentName');
const response = await agent.stream([{ role: 'user', content: prompt }]);
```

**Memory Paths**: When using LibSQLStore in agents, paths are relative to `.mastra/output` directory (e.g., `file:../mastra.db`)

**Schema Design**: All inputs/outputs use Zod schemas for type safety and validation

## Environment

- Node.js >= 20.9.0 required
- Set `OPENAI_API_KEY` in `.env` file
- TypeScript with ES2022 target and bundler module resolution