/**
 * Vercel Serverless Function: /api/sbt
 * Returns complete SBT atlas data
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sbtPath = path.resolve(process.cwd(), 'data', 'sbt-atlas.json');
    if (fs.existsSync(sbtPath)) {
      const data = JSON.parse(fs.readFileSync(sbtPath, 'utf-8'));
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(data);
    }
    return res.status(200).json({ sbts: [], total: 0 });
  } catch (err) {
    console.error("[API] SBT error:", err);
    return res.status(200).json({ sbts: [], total: 0, error: "Failed to load SBT data" });
  }
}
