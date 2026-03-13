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

  const order = {
    id: 'TEST-ORDER-001',
    date: new Date().toISOString(),
    customerName: 'Client Test',
    phone: '0600000000',
    city: 'Casablanca',
    address: 'Adresse Test',
    products: 'Produit A x1; Produit B x2',
    quantity: 3,
    total: 199.9,
    status: 'pending',
    promoCode: '',
    discount: '',
    note: 'Commande de test'
  };

  try {
    const result = await client.callTool({
      name: 'createOrder',
      arguments: order
    });
    console.log('CreateOrder:', JSON.stringify(result.structuredContent ?? result, null, 2));
  } catch (e: any) {
    console.log('CreateOrder Error:', e?.message || String(e));
  }

  await transport.close();
}

main().catch(async (e) => {
  console.error('Test client error:', e);
  process.exit(1);
});
