import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  googleSheets: {
    spreadsheetId: string;
    credentials: {
      client_email: string;
      private_key: string;
    };
  };
  youposh: {
    baseUrl: string;
    webhookUrl?: string;
    jwtToken?: string;
  };
}

const config: Config = {
  googleSheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1k76HdtTH4mVY13rK1l3xafpHRjS4cckbYdyo3t8jUl0',
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
      private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
  },
  youposh: {
    baseUrl: process.env.YOUPOSH_BASE_URL || 'https://www.youposhmaroc.com',
    jwtToken: process.env.YOUPOSH_JWT_TOKEN,
  },
};

export default config;
