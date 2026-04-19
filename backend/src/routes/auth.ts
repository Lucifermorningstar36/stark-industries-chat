import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/mailer';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stark_key_2026';

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  try {
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'E-posta, kullanıcı adı ve şifre zorunludur.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email (async, don't block registration)
    sendWelcomeEmail(email, username).catch(err =>
      console.error('[MAIL] Welcome email failed:', err.message)
    );

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role }
    });
  } catch (error: any) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Kayıt sırasında sunucu hatası oluştu.' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    // Allow login with email or username
    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] }
    });
    if (!user) return res.status(400).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Geçersiz kullanıcı adı veya şifre.' });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, role: user.role }
    });
  } catch (error: any) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Giriş sırasında sunucu hatası oluştu.' });
  }
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ error: 'E-posta adresi gereklidir.' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'Eğer bu e-posta kayıtlıysa sıfırlama linki gönderildi.' });
    }

    // Invalidate old tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true }
    });

    // Create new token (expires in 1 hour)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token: rawToken, userId: user.id, expiresAt }
    });

    await sendPasswordResetEmail(user.email, user.username, rawToken);

    res.json({ message: 'Eğer bu e-posta kayıtlıysa sıfırlama linki gönderildi.' });
  } catch (error: any) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ error: 'Şifre sıfırlama e-postası gönderilemedi.' });
  }
});

// ── Verify Reset Token ────────────────────────────────────────────────────────
router.get('/verify-reset-token/:token', async (req: Request, res: Response) => {
  try {
    const rawToken = req.params.token;
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: rawToken }
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, error: 'Geçersiz veya süresi dolmuş link.' });
    }
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'Sunucu hatası.' });
  }
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token ve yeni şifre gereklidir.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş link.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true }
    });

    res.json({ message: 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.' });
  } catch (error: any) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ error: 'Şifre güncellenirken hata oluştu.' });
  }
});

// ── Update Profile ────────────────────────────────────────────────────────────
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  const { username, avatarUrl } = req.body;
  const userId = (req as any).user.userId;
  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { username, avatarUrl }
    });
    res.json({ id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

// ── Get Users ─────────────────────────────────────────────────────────────────
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, avatarUrl: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

// ── Set Role ──────────────────────────────────────────────────────────────────
router.put('/users/:id/role', authenticateToken, async (req: Request, res: Response) => {
  const adminId = (req as any).user.userId;
  try {
    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    const { role } = req.body;
    await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { role: role === 'ADMIN' ? 'ADMIN' : 'USER' }
    });
    res.json({ message: 'Rol güncellendi.' });
  } catch (error) {
    res.status(500).json({ error: 'Rol güncellenemedi.' });
  }
});

// ── Change Password (authenticated) ──────────────────────────────────────────
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Mevcut şifre yanlış.' });

    if (newPassword.length < 6) return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    res.status(500).json({ error: 'Şifre güncellenemedi.' });
  }
});

export default router;
