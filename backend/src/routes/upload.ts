import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
router.use(authenticateToken);

// Uploads klasörü
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    // İzin verilen tipler
    const allowed = [
      'image/', 'audio/', 'video/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/zip',
      'text/',
    ];
    if (allowed.some(t => file.mimetype.startsWith(t))) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

// POST /api/upload — tek dosya yükle
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  const fileType = req.file.mimetype.startsWith('image/') ? 'image'
    : req.file.mimetype.startsWith('audio/') ? 'audio'
    : req.file.mimetype.startsWith('video/') ? 'video'
    : 'file';

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    fileType,
  });
});

// GET /api/upload/files — tüm yüklenen dosyaları listele
router.get('/files', (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) return res.json([]);
    const files = fs.readdirSync(UPLOAD_DIR).map(f => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      return { filename: f, size: stat.size, createdAt: stat.birthtime };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
