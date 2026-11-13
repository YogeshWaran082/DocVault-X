import { createApp } from './app.js';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[DocVault X API] Server is listening on http://localhost:${PORT}`);
  console.log(`[DocVault X API] OpenAPI documentation at http://localhost:${PORT}/api/v1/openapi.json`);
});
