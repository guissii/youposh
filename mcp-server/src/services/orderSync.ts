import { GoogleSheetsService } from './googleSheets.js';
import { YouposhApiService } from './youposhApi.js';
import config from '../config.js';

export interface OrderData {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  products: string;
  quantity: number;
  total: number;
  status: string;
  promoCode?: string;
  discount?: string;
  note?: string;
}

export class OrderSyncService {
  private googleSheets: GoogleSheetsService;
  private youposhApi: YouposhApiService;

  constructor() {
    this.googleSheets = new GoogleSheetsService();
    this.youposhApi = new YouposhApiService();
  }

  async healthCheck(): Promise<{ googleSheets: boolean; youposh: boolean }> {
    let googleSheets = false;
    try {
      googleSheets = await this.googleSheets.ensureSheetExists('test');
    } catch (error) {
      googleSheets = false;
    }
    
    const youposh = await this.youposhApi.healthCheck();
    
    return { googleSheets, youposh };
  }

  async createOrUpdateOrder(orderData: OrderData): Promise<void> {
    // Update Google Sheets
    await this.googleSheets.createOrUpdateOrder(orderData);

    // Update site API if status is being changed
    if (orderData.status) {
      try {
        await this.youposhApi.updateOrderStatus(orderData.id, orderData.status);
      } catch (error: any) {
        console.error(`Failed to update order ${orderData.id} on site:`, error.message);
        // Don't throw error - Google Sheets update was successful
      }
    }
  }

  async updateOrderStatus(orderId: string, status: string, useWebhook: boolean = false): Promise<void> {
    // Update site API first
    try {
      if (useWebhook && config.youposh.webhookUrl) {
        await this.youposhApi.webhookUpdateOrderStatus(orderId, status);
      } else {
        await this.youposhApi.updateOrderStatus(orderId, status);
      }
    } catch (error: any) {
      throw new Error(`Failed to update order ${orderId} on site: ${error.message}`);
    }

    // Update Google Sheets
    const sheetName = this.googleSheets.getSheetName();
    await this.googleSheets.updateOrderStatus(sheetName, orderId, status);
  }

  async getOrder(orderId: string): Promise<any> {
    const sheetName = this.googleSheets.getSheetName();
    return await this.googleSheets.getOrder(sheetName, orderId);
  }

  async syncSheetToSite(sheetName: string, orderId: string): Promise<void> {
    const order = await this.googleSheets.getOrder(sheetName, orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found in sheet ${sheetName}`);
    }

    const status = order.statut_commande;
    if (!status) {
      throw new Error(`No status found for order ${orderId}`);
    }

    await this.youposhApi.updateOrderStatus(orderId, status);
    await this.googleSheets.updateOrderStatus(sheetName, orderId, status);
  }
}