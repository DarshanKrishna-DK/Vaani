/**
 * server.js - Vaani backend entry point.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import api from './routes/api.js';
import { hasGroq } from './services/groq.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);

app.get('/', (req, res) => {
  res.json({ name: 'Vaani API', status: 'ok', aiMode: hasGroq() ? 'groq' : 'fallback' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`\n  Vaani backend running on http://localhost:${PORT}`);
  console.log(`  AI mode: ${hasGroq() ? 'Groq (live LLM)' : 'Fallback planner (no GROQ_API_KEY set)'}`);
  console.log(`  API base: http://localhost:${PORT}/api\n`);
});
