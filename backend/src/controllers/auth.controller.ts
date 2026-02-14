import { Request, Response } from 'express';
import { Store } from '../models/store';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
  try {
    // Extract name
    const { email, password, name } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const user = await Store.createUser(email, password, name);
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret');
    
    // Return user info including name
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const user = await Store.findUser(req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret');
    
    // Return name here too
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};