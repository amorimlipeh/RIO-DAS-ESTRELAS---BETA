import express from 'express';
import { listLogs } from '../modules/logs.js';
import { writeJson } from '../modules/db.js';

const router = express.Router();

router.get('/', (_req, res) => res.json(listLogs()));
router.delete('/', (_req, res) => {
  writeJson('logs.json', []);
  res.json({ ok: true });
});

export default router;
