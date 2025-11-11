import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Types
type Role = 'admin' | 'instructor' | 'member';

interface User { id: string; name: string; email: string; role: Role; passwordHash: string }
interface Member { id: string; vin: string; name: string; email: string; branch: string; year: number }
interface Attendance { id: string; memberId: string; date: string; status: 'present'|'late'|'absent'|'excused' }
interface Performance { id: string; memberId: string; category: string; score: number; rating: number; createdAt: string }

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-insecure';

// In-memory store (fallback when DATABASE_URL is not configured)
const db = {
  users: [] as User[],
  members: [] as Member[],
  attendance: [] as Attendance[],
  performance: [] as Performance[]
};

function seed() {
  if (db.users.length > 0) return;
  const mk = (name: string, email: string, role: Role, password: string): User => ({
    id: cryptoRandomId(), name, email, role, passwordHash: bcrypt.hashSync(password, 10)
  });
  db.users.push(
    mk('Admin User', 'admin@vinyasa.club', 'admin', 'password'),
    mk('Instructor One', 'instructor@vinyasa.club', 'instructor', 'password'),
    mk('Member One', 'member@vinyasa.club', 'member', 'password'),
  );
  for (let i = 1; i <= 25; i++) {
    const id = cryptoRandomId();
    db.members.push({ id, vin: `VIN-${String(i).padStart(3,'0')}`, name: `Member ${i}`, email: `member${i}@nmims.edu`, branch: 'CSE', year: (i%4)+1 });
  }
  const today = new Date().toISOString().slice(0,10);
  db.members.forEach((m, idx) => {
    db.attendance.push({ id: cryptoRandomId(), memberId: m.id, date: today, status: (idx%5===0?'late': idx%7===0?'absent':'present') as any });
  });
  for (let i = 0; i < 10; i++) {
    db.performance.push({ id: cryptoRandomId(), memberId: db.members[i].id, category:'Robotics', score: 60+i, rating: (i%5)+1, createdAt: new Date(Date.now()-i*86400000).toISOString() });
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Auth middleware
function auth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing token' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function allow(...roles: Role[]) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

seed();

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find(u => u.email.toLowerCase() === String(email||'').toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  if (!bcrypt.compareSync(password || '', user.passwordHash)) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/auth/me', auth, (req: Request & { user?: any }, res) => {
  const { id, email, name, role } = req.user;
  res.json({ id, email, name, role });
});

// Members
app.get('/api/members', auth, (_req, res) => {
  res.json(db.members);
});

app.post('/api/members', auth, allow('admin','instructor'), (req, res) => {
  const { name, email, branch = 'CSE', year = 1 } = req.body || {};
  if (!name || !email) return res.status(400).json({ message: 'Name and email required' });
  const id = cryptoRandomId();
  const nextNum = db.members.length + 1;
  const vin = `VIN-${String(nextNum).padStart(3,'0')}`;
  const member: Member = { id, vin, name, email, branch, year: Number(year) };
  db.members.push(member);
  res.status(201).json(member);
});

app.delete('/api/members/:id', auth, allow('admin'), (req, res) => {
  const { id } = req.params;
  const idx = db.members.findIndex(m => m.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Not found' });
  db.members.splice(idx, 1);
  // Also cleanup attendance and performance for consistency
  db.attendance = db.attendance.filter(a => a.memberId !== id);
  db.performance = db.performance.filter(p => p.memberId !== id);
  res.status(204).send('');
});

// Attendance
app.get('/api/attendance', auth, (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0,10));
  const list = db.attendance.filter(a => a.date === date);
  res.json(list);
});

app.post('/api/attendance/bulk', auth, allow('admin','instructor'), (req, res) => {
  const { date, records } = req.body || {};
  if (!date || !Array.isArray(records)) return res.status(400).json({ message: 'date and records[] required' });
  // Remove existing for date then insert
  db.attendance = db.attendance.filter(a => a.date !== date);
  for (const r of records) {
    if (!r.memberId || !r.status) continue;
    db.attendance.push({ id: cryptoRandomId(), memberId: r.memberId, date, status: r.status });
  }
  res.json({ ok: true, count: records.length });
});

// Performance
app.get('/api/performance', auth, (_req, res) => {
  res.json(db.performance);
});

app.post('/api/performance', auth, allow('admin','instructor'), (req, res) => {
  const { memberId, category, score, rating } = req.body || {};
  if (!memberId || !category) return res.status(400).json({ message: 'memberId and category required' });
  const perf: Performance = { id: cryptoRandomId(), memberId, category, score: Number(score||0), rating: Number(rating||0), createdAt: new Date().toISOString() };
  db.performance.push(perf);
  res.status(201).json(perf);
});

// Dashboard
app.get('/api/dashboard/summary', auth, (_req, res) => {
  const totalMembers = db.members.length;
  const today = new Date().toISOString().slice(0,10);
  const todayPresent = db.attendance.filter(a => a.date === today && a.status === 'present').length;
  // last 14 days series
  const attendanceSeries = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().slice(0,10);
    const present = db.attendance.filter(a => a.date === ds && a.status === 'present').length;
    return { date: ds.slice(5), present };
  });
  const sevenDay = attendanceSeries.slice(-7);
  const sevenDayAvg = totalMembers ? (sevenDay.reduce((s, d) => s + (d.present / totalMembers * 100), 0) / sevenDay.length) : 0;
  const recentPerformanceCount = db.performance.filter(p => new Date(p.createdAt).getTime() > Date.now()-7*86400000).length;
  res.json({ totalMembers, todayPresent, sevenDayAvg, attendanceSeries, recentPerformanceCount });
});

// Default export required by Vercel
export default app;
