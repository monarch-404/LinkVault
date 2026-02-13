import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import fs from 'fs';
import bcrypt from 'bcrypt';

export const Store = {
  // --- AUTHENTICATION ---
  createUser: async (email: string, password: string) => {
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, $3) RETURNING id, email',
      [email, hash, Date.now()]
    );
    return res.rows[0];
  },

  findUser: async (email: string) => {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  },

  // --- UPLOADS ---
  createUpload: async (data: any) => {
    const id = uuidv4().substring(0, 8);
    const deleteToken = uuidv4();
    
    await pool.query(
      `INSERT INTO secure_uploads (
        id, user_id, type, content, original_name, created_at, expires_at, 
        password_hash, max_views, delete_token, view_count
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0)`,
      [
        id, data.userId || null, data.type, data.content, data.originalName, 
        Date.now(), data.expiresAt, data.passwordHash, data.maxViews, deleteToken
      ]
    );
    return { id, deleteToken };
  },

  getMetadata: async (id: string) => {
    const res = await pool.query('SELECT * FROM secure_uploads WHERE id = $1', [id]);
    return res.rows[0];
  },

  incrementView: async (id: string) => {
    await pool.query('UPDATE secure_uploads SET view_count = view_count + 1 WHERE id = $1', [id]);
  },

  getUserHistory: async (userId: number) => {
    const res = await pool.query(
      'SELECT id, original_name, type, created_at, view_count, max_views FROM secure_uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows;
  },

  // --- CLEANUP & DELETION ---
  delete: async (id: string) => {
    const res = await pool.query('DELETE FROM secure_uploads WHERE id = $1 RETURNING type, content', [id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (row.type === 'file' && fs.existsSync(row.content)) {
        fs.unlinkSync(row.content); // Physical Delete
      }
      return true;
    }
    return false;
  },

  // Feature: Background Job Logic
  deleteExpired: async () => {
    const now = Date.now();
    const res = await pool.query('DELETE FROM secure_uploads WHERE expires_at < $1 RETURNING type, content', [now]);
    res.rows.forEach(row => {
      if (row.type === 'file' && fs.existsSync(row.content)) {
        fs.unlinkSync(row.content);
        console.log(`♻️ Auto-Cleaned: ${row.content}`);
      }
    });
  }
};