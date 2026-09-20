import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. 현재 파일 기준 apps/server/.env 탐색
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env') });
dotenv.config();

import app from '../api/index.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Kokmart Backend Express Server listening on http://localhost:${PORT}`);
});
