import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const prisma = new PrismaClient();

const allowedOrigins = [
  FRONTEND_URL,
  'https://admin.stark.net.tr',
  'http://localhost:5174'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 20 * 1024 * 1024
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Stark Industries Backend is Running' });
});

// ── Download endpoint ─────────────────────────────────────────────────────────
const RELEASE_DIR = process.env.RELEASE_DIR || path.join(__dirname, '../../desktop/release');

// Serve release files statically
if (fs.existsSync(RELEASE_DIR)) {
  app.use('/downloads', express.static(RELEASE_DIR));
}

// GET /api/download/latest?platform=win|mac|linux
// Returns { filename, url, version, size }
app.get('/api/download/latest', (req: Request, res: Response) => {
  const platform = (req.query.platform as string) || 'win';

  const extMap: Record<string, string[]> = {
    win:   ['.exe'],
    mac:   ['.dmg'],
    linux: ['.AppImage'],
  };

  const exts = extMap[platform] || ['.exe'];

  if (!fs.existsSync(RELEASE_DIR)) {
    return res.status(404).json({ error: 'No release found. Build the desktop app first.' });
  }

  const files = fs.readdirSync(RELEASE_DIR)
    .filter(f => exts.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => ({
      name: f,
      mtime: fs.statSync(path.join(RELEASE_DIR, f)).mtime,
      size: fs.statSync(path.join(RELEASE_DIR, f)).size,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) {
    return res.status(404).json({ error: `No ${platform} release found.` });
  }

  const latest = files[0];
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    filename: latest.name,
    url: `${baseUrl}/downloads/${latest.name}`,
    size: latest.size,
    platform,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
app.use('/uploads', express.static(UPLOAD_DIR));

interface ActiveUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

const activeUsers = new Map<string, ActiveUser>(); // socketId -> ActiveUser
const voiceRooms = new Map<string, Set<any>>(); // channelId -> participants

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stark_key_2026';

function getUserFromSocket(socket: Socket): { userId: string } | null {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

io.on('connection', async (socket: Socket) => {
  console.log(`New connection: ${socket.id}`);

  const decoded = getUserFromSocket(socket);
  if (decoded) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (dbUser) {
        activeUsers.set(socket.id, { id: dbUser.id, username: dbUser.username, avatarUrl: dbUser.avatarUrl || undefined });
        io.emit('active-users', Array.from(activeUsers.values()));
        // Join personal room for DMs
        socket.join(`user-${dbUser.id}`);
      }
    } catch (e) {
      console.log('Token error on connect');
    }
  }

  // ── Channel Messages ──────────────────────────────────────────────────────
  socket.on('send-message', async (data: { channelId: string; content: string; fileUrl?: string; fileType?: string; fileName?: string }) => {
    try {
      const dec = getUserFromSocket(socket);
      if (!dec) return;

      const message = await prisma.message.create({
        data: {
          content: data.content,
          channelId: data.channelId,
          userId: dec.userId,
          fileUrl: data.fileUrl || null,
          fileType: data.fileType || null,
          fileName: data.fileName || null
        },
        include: { user: { select: { username: true, avatarUrl: true } } }
      });

      io.emit('new-message', message);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('typing', (data: { channelId: string; username: string }) => {
    socket.broadcast.emit('user-typing', data);
  });

  socket.on('stop-typing', (data: { channelId: string; username: string }) => {
    socket.broadcast.emit('user-stop-typing', data);
  });

  // ── Direct Messages ───────────────────────────────────────────────────────
  socket.on('send-dm', async (data: { receiverId: string; content: string; fileUrl?: string; fileType?: string; fileName?: string }) => {
    try {
      const dec = getUserFromSocket(socket);
      if (!dec) return;

      const dm = await prisma.directMessage.create({
        data: {
          content: data.content,
          senderId: dec.userId,
          receiverId: data.receiverId,
          fileUrl: data.fileUrl || null,
          fileType: data.fileType || null,
          fileName: data.fileName || null
        },
        include: { sender: { select: { username: true, avatarUrl: true } } }
      });

      // Send to both sender and receiver rooms
      io.to(`user-${dec.userId}`).to(`user-${data.receiverId}`).emit('new-dm', dm);
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('dm-typing', (data: { receiverId: string; username: string }) => {
    socket.to(`user-${data.receiverId}`).emit('dm-user-typing', data);
  });

  socket.on('dm-stop-typing', (data: { receiverId: string; username: string }) => {
    socket.to(`user-${data.receiverId}`).emit('dm-user-stop-typing', data);
  });

  // ── WebRTC & Voice ────────────────────────────────────────────────────────
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('join-voice', (roomId: string) => {
    socket.join(`voice-${roomId}`);
    const userinfo = activeUsers.get(socket.id);
    if (!userinfo) return;

    if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
    const userData = { socketId: socket.id, user: userinfo, isStreaming: false };
    voiceRooms.get(roomId)!.add(userData);

    socket.to(`voice-${roomId}`).emit('user-joined-voice', userData);
    socket.emit('voice-participants', Array.from(voiceRooms.get(roomId)!));
    io.emit('voice-rooms-update', Array.from(voiceRooms.entries()).map(([id, set]) => [id, Array.from(set)]));
  });

  socket.on('leave-voice', (roomId: string) => {
    socket.leave(`voice-${roomId}`);
    socket.to(`voice-${roomId}`).emit('user-left-voice', socket.id);

    if (voiceRooms.has(roomId)) {
      const roomUsers = voiceRooms.get(roomId)!;
      for (const u of roomUsers) {
        if (u.socketId === socket.id) { roomUsers.delete(u); break; }
      }
      if (roomUsers.size === 0) voiceRooms.delete(roomId);
    }
    io.emit('voice-rooms-update', Array.from(voiceRooms.entries()).map(([id, set]) => [id, Array.from(set)]));
  });

  socket.on('set-stream-state', (data: { roomId: string; isStreaming: boolean }) => {
    if (voiceRooms.has(data.roomId)) {
      for (const u of voiceRooms.get(data.roomId)!) {
        if (u.socketId === socket.id) { (u as any).isStreaming = data.isStreaming; break; }
      }
      socket.to(`voice-${data.roomId}`).emit('user-stream-state', { socketId: socket.id, isStreaming: data.isStreaming });
    }
  });

  socket.on('webrtc-signal', (data: { target: string; caller: string; signal: any }) => {
    socket.to(data.target).emit('webrtc-signal', data);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    activeUsers.delete(socket.id);
    io.emit('active-users', Array.from(activeUsers.values()));

    voiceRooms.forEach((users, roomId) => {
      let removed = false;
      for (const u of users) {
        if (u.socketId === socket.id) {
          users.delete(u);
          removed = true;
          socket.to(`voice-${roomId}`).emit('user-left-voice', socket.id);
          break;
        }
      }
      if (removed) {
        if (users.size === 0) voiceRooms.delete(roomId);
        io.emit('voice-rooms-update', Array.from(voiceRooms.entries()).map(([id, set]) => [id, Array.from(set)]));
      }
    });
  });
});

httpServer.listen(PORT, async () => {
  console.log(`[SERVER] Backend is running on port ${PORT}`);

  // ── Auto-seed default channels if none exist ──────────────────────────────
  try {
    const count = await prisma.channel.count();
    if (count === 0) {
      await prisma.channel.createMany({
        data: [
          { name: 'genel',      type: 'TEXT'  },
          { name: 'duyurular',  type: 'TEXT'  },
          { name: 'lobi',       type: 'VOICE' },
          { name: 'toplanti',   type: 'VOICE' },
        ],
        skipDuplicates: true,
      });
      console.log('[SERVER] Default channels created.');
    }
  } catch (e) {
    console.error('[SERVER] Channel seed failed:', e);
  }
});
