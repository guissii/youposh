import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const backend = require('../backend/dist/index.js');
const app = backend.default || backend;

export default app;
