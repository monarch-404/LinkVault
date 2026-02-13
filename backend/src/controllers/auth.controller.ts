import { Request, Response } from 'express';
import { Store } from '../models/store';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await Store.createUser(req.body.email, req.body.password);
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
    res.json({ token, user });
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
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};