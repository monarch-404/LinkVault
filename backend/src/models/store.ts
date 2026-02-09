import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import fs from 'fs';
import path from 'path';

export interface contentData {
  id: string;
  type: 'text' | 'file';
  content: string; 
  originalName?: string; 
  createdAt: number;
  expiresAt: number;
}

export const Store = {
  // 1. CREATE: Insert into Postgres
  create: async (data: Omit<contentData, 'id'>): Promise<string> => {
    const id = uuidv4().substring(0, 8);
    const query = `
      INSERT INTO uploads (id, type, content, original_name, created_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [id, data.type, data.content, data.originalName || null, data.createdAt, data.expiresAt];
    await pool.query(query, values);
    return id;
  },

  // 2. GET: Retrieve Single Item (Lazy Cleanup)
  get: async (id: string): Promise<contentData | null> => {
    const query = `SELECT * FROM uploads WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    const now = Date.now();
    const expiresAt = Number(row.expires_at);

    // Check if expired
    if (now > expiresAt) {
      // Delete from DB
      await pool.query(`DELETE FROM uploads WHERE id = $1`, [id]);
      
      // Delete physical file if it exists
      if (row.type === 'file' && row.content) {
        fs.unlink(row.content, (err) => {
          if (err) console.error(`Failed to delete file ${row.content}:`, err);
        });
      }
      return null;
    }

    return {
      id: row.id,
      type: row.type,
      content: row.content,
      originalName: row.original_name,
      createdAt: Number(row.created_at),
      expiresAt: expiresAt
    };
  },

  // 3. BACKGROUND CLEANUP: Delete all expired items
  deleteExpired: async () => {
    const now = Date.now();
    
    // Find AND Delete expired rows, returning their content paths
    const query = `
      DELETE FROM uploads 
      WHERE expires_at < $1 
      RETURNING type, content
    `;
    
    try {
      const result = await pool.query(query, [now]);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`♻️ Cleanup: Found ${result.rowCount} expired items.`);
        
        // Loop through deleted rows and remove physical files
        result.rows.forEach(row => {
          if (row.type === 'file' && row.content) {
            fs.unlink(row.content, (err) => {
              if (err) console.error(`Error deleting file: ${err.message}`);
              else console.log(`✓ Deleted file from disk: ${row.content}`);
            });
          }
        });
      }
    } catch (err) {
      console.error("Cleanup Job Failed:", err);
    }
  }
};