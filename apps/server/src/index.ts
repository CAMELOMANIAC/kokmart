import app from '../api/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Kokmart Backend Express Server listening on http://localhost:${PORT}`);
});
