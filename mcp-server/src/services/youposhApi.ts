import axios from 'axios';
import config from '../config.js';

export class YouposhApiService {
  private baseUrl: string;
  private jwtToken?: string;

  constructor() {
    this.baseUrl = config.youposh.baseUrl;
    this.jwtToken = config.youposh.jwtToken;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    return headers;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      return response.status === 200 && response.data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
    }

    try {
      const response = await axios.put(
        `${this.baseUrl}/api/orders/${orderId}/status`,
        { status },
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Order ${orderId} not found on the site`);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your JWT token.');
      } else {
        throw new Error(`Failed to update order status: ${error.message}`);
      }
    }
  }

  async webhookUpdateOrderStatus(orderId: string, status: string): Promise<any> {
    if (!config.youposh.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    try {
      const response = await axios.post(
        config.youposh.webhookUrl,
        { id: orderId, status },
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Webhook update failed: ${error.message}`);
    }
  }
}