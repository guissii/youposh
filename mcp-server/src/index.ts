import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createOrderTools } from './tools/index.js';
import { OrderSyncService } from './services/orderSync.js';

async function main() {
  const serverTransport = new StdioServerTransport();
  
  const server = new Server(
    {
      name: 'youposh-order-sync-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const orderSync = new OrderSyncService();
  const tools = createOrderTools(orderSync);

  server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
    return {
      tools: Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = (tools as Record<string, any>)[name];

    await server.sendLoggingMessage({ level: 'info', logger: 'tools/call', data: { name, args } });

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool "${name}" not found`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.execute(args);
      await server.sendLoggingMessage({ level: 'info', logger: `tools/${name}`, data: { result } });
      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result),
          },
        ],
        structuredContent: typeof result === 'object' ? result : { result },
        isError: result?.success === false,
      };
    } catch (error: any) {
      await server.sendLoggingMessage({ level: 'error', logger: `tools/${name}`, data: { error: error?.message || String(error) } });
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error?.message || String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  await server.connect(serverTransport);

  console.log('YouPOSH Order Sync MCP Server is running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
