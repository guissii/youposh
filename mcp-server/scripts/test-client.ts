import dotenv from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

dotenv.config();

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    stderr: 'inherit',
  });

  const client = new Client(
    { name: 'youposh-order-sync-mcp-test', version: '1.0.0' },
    {}
  );

  await client.connect(transport);

  const toolsList = await client.listTools();
  console.log('Tools:', toolsList.tools.map((t: any) => t.name));

  const health = await client.callTool({ name: 'healthCheck' });
  console.log('Health:', JSON.stringify(health.structuredContent ?? health, null, 2));

  try {
    const result = await client.callTool({
      name: 'updateOrderStatus',
      arguments: { orderId: 'TEST-ORDER', status: 'pending' }
    });
    console.log('UpdateStatus:', JSON.stringify(result.structuredContent ?? result, null, 2));
  } catch (e: any) {
    console.log('UpdateStatus Error:', e?.message || String(e));
  }

  await transport.close();
}

main().catch(async (e) => {
  console.error('Test client error:', e);
  process.exit(1);
});
