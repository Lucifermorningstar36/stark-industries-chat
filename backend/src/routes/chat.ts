import express, { Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Get all channels
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const channels = await prisma.channel.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(channels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Create a new channel
router.post('/channels', async (req: Request, res: Response) => {
  const { name, type } = req.body;
  try {
    const existing = await prisma.channel.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Channel name exists' });
    const channel = await prisma.channel.create({
      data: { name, type: type === 'VOICE' ? 'VOICE' : 'TEXT' }
    });
    res.status(201).json(channel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Rename a channel
router.put('/channels/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { name } = req.body;
  try {
    const updated = await prisma.channel.update({ where: { id }, data: { name } });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete a channel
router.delete('/channels/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  try {
    await prisma.message.deleteMany({ where: { channelId: id } });
    await prisma.channel.delete({ where: { id } });
    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Get messages for a channel
router.get('/channels/:channelId/messages', async (req: Request, res: Response) => {
  const channelId = String(req.params.channelId);
  try {
    const messages = await prisma.message.findMany({
      where: { channelId },
      include: { user: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// --- DM Routes ---

// Get DM conversation between two users
router.get('/dm/:userId', async (req: Request, res: Response) => {
  const myId = (req as any).user.userId;
  const otherId = String(req.params.userId);
  try {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: otherId },
          { senderId: otherId, receiverId: myId }
        ]
      },
      include: { sender: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch DMs' });
  }
});

// Get list of DM conversations (unique users I've talked to)
router.get('/dm-conversations', async (req: Request, res: Response) => {
  const myId = (req as any).user.userId;
  try {
    const dms = await prisma.directMessage.findMany({
      where: { OR: [{ senderId: myId }, { receiverId: myId }] },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Build unique conversation list
    const seen = new Set<string>();
    const conversations: any[] = [];
    for (const dm of dms) {
      const other = dm.senderId === myId ? dm.receiver : dm.sender;
      if (!seen.has(other.id)) {
        seen.add(other.id);
        conversations.push({ user: other, lastMessage: dm });
      }
    }
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
