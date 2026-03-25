import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All admin routes require auth + ADMIN role
router.use(authenticateToken);
router.use(async (req: Request, res: Response, next) => {
  const userId = (req as any).user.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// GET /api/admin/stats — dashboard analytics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalMessages, totalChannels] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.channel.count(),
    ]);

    // Messages per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rawMessages = await prisma.message.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }
    rawMessages.forEach((m: any) => {
      const key = new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dayMap[key] !== undefined) dayMap[key]++;
    });
    const messagesByDay = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    // Messages per channel
    const channels = await prisma.channel.findMany({
      include: { _count: { select: { messages: true } } }
    });
    const messagesByChannel = channels
      .filter(c => c.type === 'TEXT')
      .map((c: any) => ({ name: c.name, count: c._count.messages }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 8);

    // Recent messages
    const recentMessages = await prisma.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        channel: { select: { name: true } }
      }
    });

    res.json({
      totalUsers,
      totalMessages,
      totalChannels,
      onlineUsers: 0, // populated from socket in-memory state — placeholder
      messagesByDay,
      messagesByChannel,
      recentMessages
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users — all users with full info
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, avatarUrl: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/admin/users/:id — delete user and their messages
router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const adminId = (req as any).user.userId;
  if (id === adminId) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await prisma.directMessage.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
    await prisma.message.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/channels — channels with message count
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const channels = await prisma.channel.findMany({
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(channels);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// GET /api/admin/messages — paginated message log with search
router.get('/messages', async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'));
  const limit = parseInt(String(req.query.limit || '30'));
  const search = String(req.query.search || '');
  const skip = (page - 1) * limit;

  try {
    const where = search ? { content: { contains: search, mode: 'insensitive' as const } } : {};
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { username: true } },
          channel: { select: { name: true } }
        }
      }),
      prisma.message.count({ where })
    ]);
    res.json({ messages, total });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE /api/admin/messages/:id
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    await prisma.message.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Message deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// GET /api/admin/analytics — realtime 3D scene data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo  = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalMessages, totalChannels,
      messagesLastHour, messagesLastDay,
      topChannels, recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.channel.count(),
      prisma.message.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.channel.findMany({
        include: { _count: { select: { messages: true } } },
        orderBy: { messages: { _count: 'desc' } },
        take: 6
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, role: true, createdAt: true }
      })
    ]);

    // Build 3D node data — each channel becomes a data node
    const nodes = topChannels.map((ch: any, i: number) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      messageCount: ch._count.messages,
      // Circular layout positions
      angle: (i / topChannels.length) * Math.PI * 2,
      radius: 3.5,
      intensity: Math.min(ch._count.messages / Math.max(totalMessages, 1), 1),
    }));

    res.json({
      totalUsers,
      totalMessages,
      totalChannels,
      messagesLastHour,
      messagesLastDay,
      nodes,
      recentUsers,
      serverTime: now.toISOString(),
      uptime: process.uptime(),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/voice-history — voice channel session log (from messages with type hint)
router.get('/voice-history', async (req: Request, res: Response) => {
  try {
    // Voice kanallarını ve son aktivitelerini getir
    const voiceChannels = await prisma.channel.findMany({
      where: { type: 'VOICE' },
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: 'asc' }
    });

    // Her ses kanalı için son mesajları getir (ses aktivitesi kaydı olarak)
    const history = await Promise.all(
      voiceChannels.map(async (ch: any) => {
        const lastActivity = await prisma.message.findFirst({
          where: { channelId: ch.id },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { username: true } } }
        });
        return {
          channelId: ch.id,
          channelName: ch.name,
          username: lastActivity?.user?.username || 'Unknown',
          joinedAt: lastActivity?.createdAt || ch.createdAt,
          messageCount: ch._count.messages,
        };
      })
    );

    res.json(history);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch voice history' });
  }
});

// POST /api/admin/terminal — VDS terminal command executor
router.post('/terminal', async (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'No command' });

  // Güvenlik: sadece izin verilen komutlar
  const allowed = ['ls', 'pwd', 'docker', 'git', 'cat', 'echo', 'df', 'free', 'uptime', 'ps', 'whoami', 'date', 'node', 'npm'];
  const cmd = command.trim().split(' ')[0];
  if (!allowed.includes(cmd)) {
    return res.json({ output: `Permission denied: '${cmd}' is not allowed.` });
  }

  const { exec } = require('child_process');
  exec(command, { timeout: 10000, cwd: '/root/stark-industries-chat' }, (err: any, stdout: string, stderr: string) => {
    res.json({ output: stdout || stderr || (err?.message ?? 'Done') });
  });
});

export default router;
