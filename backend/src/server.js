import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import jwt        from 'jsonwebtoken';

import { errorHandler } from './middleware/errorHandler.js';
import { setSocketIO }  from './engines/alertRouter.js';

import authRouter      from './routes/auth.js';
import ingestRouter    from './routes/ingest.js';
import shipmentsRouter from './routes/shipments.js';
import exceptionsRouter from './routes/exceptions.js';
import alertsRouter    from './routes/alerts.js';
import actionsRouter   from './routes/actions.js';
import analyticsRouter from './routes/analytics.js';
import rulesRouter     from './routes/rules.js';
import usersRouter     from './routes/users.js';

const app  = express();
const http = createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new SocketIO(http, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3002', credentials: true },
});

// Authenticate socket connections with JWT
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // Join role-based room for targeted alerts
  if (socket.user?.role) {
    socket.join(`role:${socket.user.role}`);
  }
  socket.on('disconnect', () => {});
});

setSocketIO(io);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3002', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/ingest',     ingestRouter);
app.use('/api/shipments',  shipmentsRouter);
app.use('/api/exceptions', exceptionsRouter);
app.use('/api/alerts',     alertsRouter);
app.use('/api/actions',    actionsRouter);
app.use('/api/analytics',  analyticsRouter);
app.use('/api/rules',      rulesRouter);
app.use('/api/users',      usersRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5002;
http.listen(PORT, () => {
  console.log(`\n🚦 HaulSync Control Tower`);
  console.log(`   API  → http://localhost:${PORT}`);
  console.log(`   WS   → ws://localhost:${PORT}`);
  console.log(`   Env  → ${process.env.NODE_ENV || 'development'}\n`);
});
