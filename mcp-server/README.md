# YouPOSH Order Sync MCP Server

This MCP (Model Context Protocol) server provides synchronization between Google Sheets and the YouPOSH website for order management.

## Features

- **Order Creation**: Create new orders in Google Sheets with optional sync to website
- **Status Updates**: Update order status with quick actions (mark_pending, mark_processing, mark_shipped, mark_delivered, mark_completed, mark_cancelled)
- **Order Retrieval**: Get order details from Google Sheets
- **Order Listing**: List orders from specific months with optional status filtering
- **Bidirectional Sync**: Sync orders between Google Sheets and website API
- **Health Checks**: Verify connectivity to both Google Sheets and website API

## Installation

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

Create a `.env` file in the `mcp-server` directory with the following environment variables:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_SPREADSHEET_ID=1k76HdtTH4mVY13rK1l3xafpHRjS4cckbYdyo3t8jUl0
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Website API Configuration
WEBSITE_API_BASE=https://www.youposhmaroc.com/api
WEBSITE_TOKEN=your-jwt-token-here (optional)
```

## Usage

### Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Available Tools

#### 1. create_order
Create a new order in Google Sheets and optionally sync to website.

**Parameters:**
- `orderId` (string, required): Unique order ID
- `customerName` (string, required): Customer name
- `phone` (string, required): Customer phone number
- `city` (string, required): Customer city
- `address` (string, required): Customer address
- `products` (string, required): Products description
- `quantityTotal` (number, required): Total quantity
- `total` (number, required): Total amount
- `promoCode` (string, optional): Promo code used
- `discount` (number, optional): Discount amount
- `remark` (string, optional): Additional remarks
- `syncToWebsite` (boolean, optional): Whether to sync to website API (default: false)

#### 2. update_order_status
Update order status in both Google Sheets and website, with quick actions.

**Parameters:**
- `orderId` (string, required): Order ID to update
- `status` (string, optional): New order status (pending, processing, shipped, delivered, completed, cancelled)
- `action` (string, optional): Quick action (mark_pending, mark_processing, mark_shipped, mark_delivered, mark_completed, mark_cancelled)
- `syncToWebsite` (boolean, optional): Whether to sync to website API (default: true)
- `syncToSheet` (boolean, optional): Whether to sync to Google Sheets (default: true)

**Note:** Either `status` or `action` must be provided.

#### 3. get_order
Get order details from Google Sheets.

**Parameters:**
- `orderId` (string, required): Order ID to retrieve

#### 4. list_orders
List orders from Google Sheets for a specific month.

**Parameters:**
- `year` (number, required): Year (e.g., 2026)
- `month` (number, required): Month (1-12)
- `status` (string, optional): Filter by order status

#### 5. sync_order_from_sheet_to_website
Sync a specific order from Google Sheets to website API.

**Parameters:**
- `orderId` (string, required): Order ID to sync

#### 6. sync_order_from_website_to_sheet
Sync a specific order from website API to Google Sheets.

**Parameters:**
- `orderId` (string, required): Order ID to sync

#### 7. health_check
Check connectivity to Google Sheets and website API.

**Parameters:** None

## Status Mapping

The server automatically maintains consistency between order status and delivery status:

| Order Status | Delivery Status |
|--------------|----------------|
| pending      | not_shipped    |
| processing   | prepared       |
| shipped      | shipped        |
| delivered    | delivered      |
| completed    | delivered      |
| cancelled    | returned       |

## Google Sheets Structure

The server expects Google Sheets with the following column structure:

1. ID commande
2. Date création
3. Nom client
4. Téléphone
5. Ville
6. Adresse
7. Produits
8. Quantité totale
9. Total
10. Statut commande
11. Statut livraison
12. Code promo
13. Remise
14. Remarque
15. Dernière mise à jour

Sheets are organized by month with the naming convention: `Commandes_YYYY_MM`

## Error Handling

The server provides detailed error messages for common issues:
- Missing or invalid credentials
- Order not found
- Invalid status values
- API connectivity issues
- Google Sheets access problems

## Integration with Existing System

This MCP server integrates with the existing YouPOSH backend:
- Uses the same Google Sheets credentials as the existing order system
- Follows the same status mapping rules
- Maintains the same sheet structure and naming conventions
- Provides the same API endpoints for order status updates

## Development

The server is built with:
- TypeScript
- Node.js
- Google APIs Node.js Client
- Axios for HTTP requests
- Model Context Protocol SDK

## License

MIT License