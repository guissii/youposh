# Plan: Fix Missing Google Sheets Environment Variables

## Context
The user is encountering an error when trying to use Google Sheets functionality in the backend:
`{"ok":false,"error":"Missing Google Sheets env vars","env":{"hasSpreadsheetId":true,"hasClientEmail":false,"hasPrivateKey":true,"hasPrivateKeyBase64":true}}`

This indicates that `GOOGLE_SERVICE_ACCOUNT_EMAIL` is missing or not being read correctly by the backend process, while `GOOGLE_SHEETS_SPREADSHEET_ID` and the private key are present.

## Current State Analysis
1.  **Backend Environment**: The file `backend/.env` exists and contains all necessary variables, including `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
2.  **Verification**: A test script `backend/test_env.js` confirmed that `dotenv` can correctly load the variables from `backend/.env`.
3.  **Root Environment**: There is no `.env` file in the project root (`c:\Users\MSI\Desktop\you shop\.env`).
4.  **Hypothesis**: The backend process might be running from the project root (or another directory) where `dotenv` looks for `.env` in the current working directory but finds none, or it's picking up partial environment variables from the system/shell but missing `EMAIL`.

## Proposed Changes
1.  **Create Root .env**: Create a `.env` file in the project root (`c:\Users\MSI\Desktop\you shop\.env`) with the content from `backend/.env`. This ensures that if the backend is started from the root, it will find the environment variables.
2.  **Verify**: Run a test script from the root directory to confirm `dotenv` loads the variables correctly from the new root `.env`.

## Verification Plan
1.  Create `test_root_env.js` in the root directory.
2.  Run `node test_root_env.js` to verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is loaded.
3.  Ask the user to restart their backend server.
