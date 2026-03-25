import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stark_key_2026';

router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword }
    });

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role } });
  } catch (error: any) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role } });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  const { username, avatarUrl } = req.body;
  const userId = (req as any).user.userId;
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { username, avatarUrl }
    });
    res.json({ id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, avatarUrl: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/role', authenticateToken, async (req: Request, res: Response) => {
  const adminId = (req as any).user.userId;
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { role } = req.body;
    await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { role: role === 'ADMIN' ? 'ADMIN' : 'USER' }
    });
    res.json({ message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Incorrect current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
