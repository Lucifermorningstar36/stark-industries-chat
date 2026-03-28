import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5176;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(httpServer, { cors: { origin: '*' } });

// ─── AGENT DEFINITIONS ───────────────────────────────────────────────────────
const AGENTS = [
  {
    id: 'pm',
    name: 'PM Agent',
    role: 'Project Manager',
    color: '#06b6d4',
    icon: '🎯',
    systemPrompt: `Sen STARK COMMAND sisteminin Proje Yöneticisi ajanısın. 
Kullanıcıdan gelen görevi analiz et ve şu ajanlara alt görevler oluştur:
- frontend: UI/CSS/React işleri
- backend: API/veritabanı/sunucu işleri  
- qa: test ve kalite kontrol
- devops: deploy/docker/sunucu işleri

JSON formatında yanıt ver:
{
  "analysis": "görev analizi",
  "subtasks": [
    {"agent": "frontend|backend|qa|devops", "task": "görev açıklaması"}
  ]
}`,
  },
  {
    id: 'frontend',
    name: 'Frontend Agent',
    role: 'Frontend Developer',
    color: '#818cf8',
    icon: '🎨',
    systemPrompt: `Sen STARK COMMAND sisteminin Frontend Developer ajanısın.
React, TypeScript, Tailwind CSS konularında uzmansın.
Verilen görevi analiz et, kod öner veya düzeltme yap.
Kısa ve net yanıt ver. Kod bloklarını kullan.`,
  },
  {
    id: 'backend',
    name: 'Backend Agent',
    role: 'Backend Developer',
    color: '#34d399',
    icon: '⚙️',
    systemPrompt: `Sen STARK COMMAND sisteminin Backend Developer ajanısın.
Node.js, Express, Prisma, PostgreSQL konularında uzmansın.
Verilen görevi analiz et, API endpoint veya veritabanı çözümü öner.
Kısa ve net yanıt ver.`,
  },
  {
    id: 'qa',
    name: 'QA Agent',
    role: 'Quality Assurance',
    color: '#f59e0b',
    icon: '🔍',
    systemPrompt: `Sen STARK COMMAND sisteminin QA Test ajanısın.
Kod kalitesi, hata tespiti ve test senaryoları konusunda uzmansın.
Verilen kodu veya görevi analiz et, potansiyel sorunları listele.
Kısa ve net yanıt ver.`,
  },
  {
    id: 'devops',
    name: 'DevOps Agent',
    role: 'DevOps Engineer',
    color: '#f472b6',
    icon: '🚀',
    systemPrompt: `Sen STARK COMMAND sisteminin DevOps ajanısın.
Docker, Caddy, VDS, Git, deploy süreçleri konusunda uzmansın.
Verilen görevi analiz et, deploy veya altyapı çözümü öner.
Kısa ve net yanıt ver.`,
  },
];

// ─── TASK STORE ──────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
  createdAt: Date;
  logs: LogEntry[];
  subtasks: SubTask[];
}

interface SubTask {
  id: string;
  agentId: string;
  task: string;
  status: 'pending' | 'running' | 'done' | 'error';
  output?: string;
}

interface LogEntry {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  type: 'info' | 'code' | 'error' | 'success';
  timestamp: Date;
}

const tasks = new Map<string, Task>();

// ─── OLLAMA CALL ─────────────────────────────────────────────────────────────
async function callOllama(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const res = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
    }, { timeout: 60000 });
    return res.data.message?.content || 'No response';
  } catch (e: any) {
    // Ollama yoksa mock response
    return `[MOCK] Ollama bağlantısı yok (${OLLAMA_URL}). Görev alındı: "${userMessage.slice(0, 50)}..."`;
  }
}

// ─── EMIT LOG ─────────────────────────────────────────────────────────────────
function emitLog(taskId: string, agentId: string, message: string, type: LogEntry['type'] = 'info') {
  const agent = AGENTS.find(a => a.id === agentId)!;
  const entry: LogEntry = {
    id: uuidv4(),
    agentId,
    agentName: agent?.name || agentId,
    message,
    type,
    timestamp: new Date(),
  };
  const task = tasks.get(taskId);
  if (task) task.logs.push(entry);
  io.emit('task:log', { taskId, log: entry });
}

// ─── RUN TASK ─────────────────────────────────────────────────────────────────
async function runTask(taskId: string, userInput: string) {
  const task = tasks.get(taskId)!;
  task.status = 'running';
  io.emit('task:update', { taskId, status: 'running' });

  // 1. PM Agent analiz eder
  emitLog(taskId, 'pm', `Görev alındı: "${userInput}"`, 'info');
  await sleep(500);
  emitLog(taskId, 'pm', 'Görev analiz ediliyor...', 'info');

  const pmResponse = await callOllama(AGENTS[0].systemPrompt, userInput);
  emitLog(taskId, 'pm', pmResponse, 'info');

  // JSON parse dene
  let subtasks: { agent: string; task: string }[] = [];
  try {
    const jsonMatch = pmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      subtasks = parsed.subtasks || [];
    }
  } catch {
    // JSON parse başarısız — basit dağıtım yap
    subtasks = [
      { agent: 'frontend', task: userInput },
      { agent: 'qa', task: `Test: ${userInput}` },
    ];
  }

  if (subtasks.length === 0) {
    subtasks = [{ agent: 'frontend', task: userInput }];
  }

  emitLog(taskId, 'pm', `${subtasks.length} alt görev oluşturuldu`, 'success');
  await sleep(300);

  // 2. Alt görevleri çalıştır
  for (const sub of subtasks) {
    const agent = AGENTS.find(a => a.id === sub.agent) || AGENTS[1];
    const subId = uuidv4();

    task.subtasks.push({ id: subId, agentId: agent.id, task: sub.task, status: 'running' });
    io.emit('task:subtask', { taskId, subtask: { id: subId, agentId: agent.id, task: sub.task, status: 'running' } });

    emitLog(taskId, agent.id, `Görev alındı: ${sub.task}`, 'info');
    await sleep(400);

    const output = await callOllama(agent.systemPrompt, sub.task);
    emitLog(taskId, agent.id, output, output.includes('```') ? 'code' : 'info');

    // Subtask güncelle
    const st = task.subtasks.find(s => s.id === subId);
    if (st) { st.status = 'done'; st.output = output; }
    io.emit('task:subtask', { taskId, subtask: { id: subId, agentId: agent.id, task: sub.task, status: 'done', output } });

    await sleep(300);
  }

  // 3. QA son kontrol (eğer subtask'ta yoksa)
  if (!subtasks.find(s => s.agent === 'qa')) {
    emitLog(taskId, 'qa', 'Çıktılar kontrol ediliyor...', 'info');
    await sleep(400);
    const qaOut = await callOllama(AGENTS[3].systemPrompt, `Şu görevin çıktısını değerlendir: ${userInput}`);
    emitLog(taskId, 'qa', qaOut, 'info');
  }

  emitLog(taskId, 'pm', '✅ Tüm görevler tamamlandı.', 'success');
  task.status = 'done';
  io.emit('task:update', { taskId, status: 'done' });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'STARK COMMAND API running', model: OLLAMA_MODEL }));

app.get('/api/agents', (_, res) => res.json(AGENTS.map(({ id, name, role, color, icon }) => ({ id, name, role, color, icon }))));

app.get('/api/tasks', (_, res) => {
  const list = Array.from(tasks.values()).map(t => ({
    id: t.id, title: t.title, status: t.status, createdAt: t.createdAt,
    logCount: t.logs.length, subtaskCount: t.subtasks.length,
  }));
  res.json(list.reverse());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });

  const task: Task = {
    id: uuidv4(),
    title: title.trim(),
    status: 'pending',
    createdAt: new Date(),
    logs: [],
    subtasks: [],
  };
  tasks.set(task.id, task);
  io.emit('task:created', { id: task.id, title: task.title, status: task.status, createdAt: task.createdAt });

  // Async çalıştır
  runTask(task.id, title.trim()).catch(e => {
    emitLog(task.id, 'pm', `Hata: ${e.message}`, 'error');
    task.status = 'error';
    io.emit('task:update', { taskId: task.id, status: 'error' });
  });

  res.json({ id: task.id, title: task.title, status: 'pending' });
});

// ─── SOCKET ──────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  // Mevcut task listesini gönder
  socket.emit('tasks:init', Array.from(tasks.values()).map(t => ({
    id: t.id, title: t.title, status: t.status, createdAt: t.createdAt,
  })));
});

httpServer.listen(PORT, () => console.log(`STARK COMMAND API running on port ${PORT}`));
