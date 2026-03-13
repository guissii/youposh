import { google, sheets_v4 } from 'googleapis';
import config from '../config.js';

export class GoogleSheetsService {
  private auth: any;
  private sheets: sheets_v4.Sheets;

  constructor() {
    this.auth = new google.auth.JWT({
      email: config.googleSheets.credentials.client_email,
      key: config.googleSheets.credentials.private_key.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  getSheetName(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `Commandes_${year}_${month}`;
  }

  private getHeaders(): string[] {
    return [
      'ID commande',
      'Date création',
      'Nom client',
      'Téléphone',
      'Ville',
      'Adresse',
      'Produits',
      'Quantité totale',
      'Total',
      'Statut commande',
      'Statut livraison',
      'Code promo',
      'Remise',
      'Remarque',
      'Dernière mise à jour'
    ];
  }

  private mapStatusToDelivery(status: string): string {
    const mapping: Record<string, string> = {
      pending: 'not_shipped',
      processing: 'not_shipped',
      shipped: 'shipped',
      delivered: 'delivered',
      completed: 'delivered',
      cancelled: 'not_shipped'
    };
    return mapping[status] || 'not_shipped';
  }

  async ensureSheetExists(sheetName: string): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheets.spreadsheetId,
        ranges: [sheetName]
      });
      return true;
    } catch (error: any) {
      if (error.code === 400) {
        // Sheet doesn't exist, create it
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.googleSheets.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: sheetName
                }
              }
            }]
          }
        });

        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheets.spreadsheetId,
          range: `${sheetName}!A1:O1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [this.getHeaders()]
          }
        });
        return true;
      } else {
        throw error;
      }
    }
  }

  async findOrderRow(sheetName: string, orderId: string): Promise<number | null> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: `${sheetName}!A:A`
    });

    const values = response.data.values;
    if (!values) return null;

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === orderId) {
        return i + 1; // Google Sheets is 1-indexed
      }
    }
    return null;
  }

  async createOrUpdateOrder(orderData: any): Promise<void> {
    const sheetName = this.getSheetName(new Date(orderData.date));
    await this.ensureSheetExists(sheetName);

    const existingRow = await this.findOrderRow(sheetName, orderData.id);
    const deliveryStatus = this.mapStatusToDelivery(orderData.status);
    const lastUpdate = new Date().toISOString();

    const values = [
      orderData.id,
      orderData.date,
      orderData.customerName,
      orderData.phone,
      orderData.city,
      orderData.address,
      orderData.products,
      orderData.quantity,
      orderData.total,
      orderData.status,
      deliveryStatus,
      orderData.promoCode || '',
      orderData.discount || '',
      orderData.note || '',
      lastUpdate
    ];

    if (existingRow) {
      // Update existing row
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${sheetName}!A${existingRow}:O${existingRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      });
    } else {
      // Add new row
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheets.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values]
        }
      });
    }
  }

  async getOrder(sheetName: string, orderId: string): Promise<any> {
    const row = await this.findOrderRow(sheetName, orderId);
    if (!row) return null;

    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: `${sheetName}!A${row}:O${row}`
    });

    const values = response.data.values?.[0];
    if (!values) return null;

    const headers = this.getHeaders();
    const order: any = {};
    headers.forEach((header, index) => {
      order[header.toLowerCase().replace(' ', '_')] = values[index] || '';
    });

    return order;
  }

  async updateOrderStatus(sheetName: string, orderId: string, status: string): Promise<void> {
    const row = await this.findOrderRow(sheetName, orderId);
    if (!row) return;

    const deliveryStatus = this.mapStatusToDelivery(status);
    const lastUpdate = new Date().toISOString();

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: config.googleSheets.spreadsheetId,
      range: `${sheetName}!J${row}:O${row}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status, deliveryStatus, '', '', '', lastUpdate]]
      }
    });
  }
}
