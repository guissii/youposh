const fs = require('fs');
const { execSync } = require('child_process');

// 1. The clean Private Key (PEM format) from your JSON
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDE3ZR+vdi5hroq\npC6Lme2tbIohRd8eGO1ZEvrT1k9RXJuvYsjUBjw6ILo8lAGKSUxVkUOkJbj56sbG\nPbZjcB2bsbQ96l5XJzIC3A9ozu/sp5ut5oKktWrCDnVdz6XW5qkCemb5qPKbSbnO\nKkXNz0R7GODiicuihrbhuzqWZqyFJIaMigFiqKPCuTf7he0mc6cBmd0zWY8BVUtD\nA10Ja00kSFmCCJKx71s4wFkFnfm+dgpjXTK03M9k7V8IgFGWm2Rc7dLM/uNLy1jy\nRbc7r8XJzwZrmK9L2tNuIlWdRVcDAuMi6SIXM33WUiEY8QC8rhQUzro/F1aE4LjC\nJXZsSod7AgMBAAECggEAC7Ri5lAySQGOIwfk7o7l1zhLVCQb2mXAAtpCiILG737y\nkLBuYVDHlusoN37TQp4OCE5dN664ez9utw2nQO1DDWU44q+DEWp2qj3cOq6HDEqA\n0ouQe+t/X+9NIhk88nR/WvLdGX3mgr4U6oGP6ecnWqxFfqKTtWOODwi7OIL9QeMp\nvAWhFLFj/LZmbxhOvzf5tMjWXa57oHCfFm8Nd0ZJVzziANSe2LSkN1yh1sAzpOsR\n/jfE+jwKqTYuV/qODQRihW3Ixk1djMaeT0RiZFxdWH+P0faNHA0pIOW1fZnu05P7\ndegqRung9yqrDf5Zdo9bl4q/cIDQzM2zSJ6ELudfgQKBgQD3mqHflNAbgbpF/S3H\nyBzNgGnExZSpbbtZ5osI+IewzhPXPjLhCi6/2Nq/6/W6J+KNSipiMJdCoL4XdUf7\n14bfdUB+tx9hX1nTQeiJ473YAiKcaAfOg11jAsO4ruPUNCH2KBjnxzQ5o/t7TnsH\nIxIfITiVbRbUoz/2uUKZXAFK+wKBgQDLioECWHEbzy2VKObsJGCUAoPzmkpx0Xlz\nzg5cY2yvpqPav7Q1S+/7VEcmO0KVpbS0sc1kzSG3ptwqXGZr6lkKrrHyaq68KEj6\nzoHtAdQN+2KthN84c/toM/7Dm6ttnoDN2GDarlUDSDUxGNjjoRxbhAnXvNzYXhi4\na+jBtG8NgQKBgAl4vdZ6r9dNiB2jSLwKuKdX0TP4xu4QR4lx20G1mCM4TuP9+h5H\nsHAgUIXk9dpwKidzfdmRuEeRNJRbJSzKGtuzdYsjYCzuY9ZEACw+LQX1VvOauym4\nNrtR4MDQ1+BHOkFbWVCMez/1OOqHnwcv3UKZl7uHl8b8k7bRcW3Caj4/AoGAKr3A\n7X8o8VAGIGZgZ4IUDcCheMwTiecU++5vMZNnRVNW4R6UdwSlNj+yWSLkjowncDJO\nETbKN8iAPxz8HPkvDYE1uNQSMUy8Vn565gwWPYFmbU2TmkUwq+cPPoA39WLtZUxk\nukcVbwUAtnijQtmYHNeTQYxVS9ImmsN+Mv7yuwECgYBWZM7zIMrmYz3vlNmA1mqQ\naJnDuHQPaHv/sok2bpcQ1Rz4f+NRYb7prJbFcNaVfs+PkiHkWZZReaPeAEsqgw9c\nqY8YD53UZ9BMFS4XpjmF1U5ZHkKuI4YyCWv70ESAr5wlfStImfNVhL8de2Ubf4yo\n3tlN1WMzt+rzcsxI2Hrciw==\n-----END PRIVATE KEY-----\n`;

// 2. Convert to Base64 to be safe for env vars
const base64Key = Buffer.from(privateKey).toString('base64');

// 3. Write to a temporary file to avoid Shell piping issues (PowerShell encoding corruption)
const tempFile = 'temp_key_base64.txt';
fs.writeFileSync(tempFile, base64Key, { encoding: 'utf8' });

console.log("Written Base64 key to temp file:", tempFile);

// 4. Update Vercel Env
try {
    console.log("Removing old variable...");
    execSync('npx vercel env rm GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 production --yes', { stdio: 'ignore' });
} catch (e) {}

try {
    console.log("Uploading new variable from file (safer)...");
    // Use cmd /c type to pipe pure bytes/text without PowerShell's UTF-16 interference
    execSync(`cmd /c "type ${tempFile} | npx vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 production"`, { stdio: 'inherit' });
    
    console.log("Deploying...");
    execSync('npx vercel deploy --prod --yes', { stdio: 'inherit' });
    console.log("Success!");
} catch (e) {
    console.error("Error:", e.message);
} finally {
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
}
