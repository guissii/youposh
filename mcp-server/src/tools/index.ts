import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { OrderSyncService, OrderData } from '../services/orderSync.js';

export function createOrderTools(orderSync: OrderSyncService): Record<string, any> {
  return {
    healthCheck: {
      description: 'Check the health of Google Sheets and YouPOSH API connections',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      execute: async () => {
        const result = await orderSync.healthCheck();
        return {
          success: true,
          data: result
        };
      }
    },

    createOrder: {
      description: 'Create or update an order in Google Sheets and optionally sync to YouPOSH site',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Order ID' },
          date: { type: 'string', description: 'Order creation date (ISO string)' },
          customerName: { type: 'string', description: 'Customer name' },
          phone: { type: 'string', description: 'Customer phone number' },
          city: { type: 'string', description: 'Customer city' },
          address: { type: 'string', description: 'Customer address' },
          products: { type: 'string', description: 'List of products' },
          quantity: { type: 'number', description: 'Total quantity' },
          total: { type: 'number', description: 'Total amount' },
          status: { 
            type: 'string', 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
            description: 'Order status'
          },
          promoCode: { type: 'string', description: 'Promo code (optional)' },
          discount: { type: 'string', description: 'Discount amount (optional)' },
          note: { type: 'string', description: 'Order note (optional)' }
        },
        required: ['id', 'date', 'customerName', 'phone', 'city', 'address', 'products', 'quantity', 'total', 'status'],
        additionalProperties: false
      },
      execute: async (args: OrderData) => {
        await orderSync.createOrUpdateOrder(args);
        return {
          success: true,
          message: `Order ${args.id} created/updated successfully`
        };
      }
    },

    updateOrderStatus: {
      description: 'Update order status and synchronize between Google Sheets and YouPOSH site',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          status: { 
            type: 'string', 
            enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'],
            description: 'New order status'
          },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId', 'status'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; status: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, args.status, args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} status updated to ${args.status}`
        };
      }
    },

    getOrder: {
      description: 'Get order details from Google Sheets',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string }) => {
        const order = await orderSync.getOrder(args.orderId);
        if (!order) {
          return {
            success: false,
            message: `Order ${args.orderId} not found`
          };
        }
        return {
          success: true,
          data: order
        };
      }
    },

    syncSheetToSite: {
      description: 'Synchronize order status from Google Sheets to YouPOSH site',
      inputSchema: {
        type: 'object',
        properties: {
          sheetName: { type: 'string', description: 'Google Sheets tab name (e.g., Commandes_2026_03)' },
          orderId: { type: 'string', description: 'Order ID' }
        },
        required: ['sheetName', 'orderId'],
        additionalProperties: false
      },
      execute: async (args: { sheetName: string; orderId: string }) => {
        await orderSync.syncSheetToSite(args.sheetName, args.orderId);
        return {
          success: true,
          message: `Order ${args.orderId} synchronized from sheet ${args.sheetName} to site`
        };
      }
    },

    markOrderPending: {
      description: 'Mark order as pending',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'pending', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as pending`
        };
      }
    },

    markOrderProcessing: {
      description: 'Mark order as processing',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'processing', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as processing`
        };
      }
    },

    markOrderShipped: {
      description: 'Mark order as shipped',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'shipped', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as shipped`
        };
      }
    },

    markOrderDelivered: {
      description: 'Mark order as delivered',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'delivered', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as delivered`
        };
      }
    },

    markOrderCompleted: {
      description: 'Mark order as completed',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'completed', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as completed`
        };
      }
    },

    markOrderCancelled: {
      description: 'Mark order as cancelled',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'Order ID' },
          useWebhook: { 
            type: 'boolean', 
            default: false,
            description: 'Use webhook instead of direct API call (optional)' 
          }
        },
        required: ['orderId'],
        additionalProperties: false
      },
      execute: async (args: { orderId: string; useWebhook?: boolean }) => {
        await orderSync.updateOrderStatus(args.orderId, 'cancelled', args.useWebhook);
        return {
          success: true,
          message: `Order ${args.orderId} marked as cancelled`
        };
      }
    }
  };
}